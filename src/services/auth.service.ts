import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { Otp, User, RefreshToken } from "../models";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/api-errors";
import mailer from "../config/mailer";
import { logger } from "../lib/logger";
import { SuccessRes } from "../utils/responses";
import {
  LoginPayload,
  RegisterPayload,
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../types/auth";

export class AuthService {
  private generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateAccessToken(payload: AccessTokenPayload) {
    return jwt.sign({ ...payload }, env.JWT_ACCESS_SECRET, {
      expiresIn: "1d",
    });
  }

  private generateRefreshToken(payload: RefreshTokenPayload) {
    return jwt.sign({ ...payload }, env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });
  }

  async sendVerificationEmail(email: string) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({
      email,
      otp,
      expiresAt,
      isVerified: false,
      use: "email_verification",
    });

    console.log("Generated OTP:", otp); // Log the OTP for debugging purposes

    const mailConfig = {
      from: env.EMAIL_USER,
      to: email,
      subject: "Shop-It - Verify your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #cc6300; font-size: 32px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    await mailer.sendMail(mailConfig);
    logger.info("Verification email sent");

    return SuccessRes({ message: "Verification email sent" });
  }

  async verifyOtp(email: string, otp: string) {
    const otpRecord = await Otp.findOne({
      email,
      isVerified: false,
      use: "email_verification",
    });

    if (!otpRecord) {
      throw new NotFoundError("OTP");
    }

    if (otpRecord.expiresAt < new Date()) {
      await otpRecord.deleteOne();
      throw new UnauthorizedError("Otp has expired");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      throw new UnauthorizedError("Invalid or expired otp");
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    return SuccessRes({ message: "OTP verification successful" });
  }

  async register(data: RegisterPayload) {
    const isOtpVerified = await Otp.findOne({
      email: data.email,
      use: "email_verification",
      isVerified: true,
    });
    if (!isOtpVerified) {
      throw new UnauthorizedError("Email not verified");
    }

    // Check OTP hasn't expired
    if (isOtpVerified.expiresAt < new Date()) {
      await isOtpVerified.deleteOne();
      throw new UnauthorizedError(
        "Verification expired. Please verify email again",
      );
    }

    const userExists = await User.findOne({ email: data.email });
    if (userExists) {
      throw new ConflictError("Account already exists");
    }

    const user = await User.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      role: "customer",
      isVerified: true,
      timezone: "Africa/Lagos",
    });

    await Otp.deleteOne({ _id: isOtpVerified._id });

    const newJti = uuidv4();
    const accessPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const refreshPayload = {
      userId: user._id.toString(),
      jti: newJti,
      role: user.role
    };
    const newAccessToken = this.generateAccessToken(accessPayload);
    const newRefreshToken = this.generateRefreshToken(refreshPayload);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    await RefreshToken.create({
      userId: user._id,
      jti: newJti,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return SuccessRes({
      message: "Registeration successful",
      data: {
        user: user.toObject(),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      statusCode: 201,
    });
  }

  async login(data: LoginPayload, metadata: { userAgent: string; ip: string }) {
    const user = await User.findOne({ email: data.email }).select("+password");
    if (!user) {
      throw new NotFoundError("User");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new ValidationError("Invalid credentials");
    }

    if (user.isVerified === false) {
      throw new ForbiddenError("Email not verified");
    }

    const newJti = uuidv4();
    const accessPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };
    const refreshPayload = {
      userId: user._id.toString(),
      jti: newJti,
      role: user.role
    };
    const newAccessToken = this.generateAccessToken(accessPayload);
    const newRefreshToken = this.generateRefreshToken(refreshPayload);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    await RefreshToken.deleteMany({
      userId: user._id,
      userAgent: metadata.userAgent,
    });

    await RefreshToken.create({
      userId: user._id,
      jti: newJti,
      tokenHash: newRefreshTokenHash,
      userAgent: metadata.userAgent,
      ip: metadata.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return SuccessRes({
      message: "Login successful",
      data: {
        user: user.toObject(),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      statusCode: 200,
    });
  }

  async refreshToken(token: string, userAgent?: string, ip?: string) {
    let payload: { userId: string; jti: string };

    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        userId: string;
        jti: string;
        role: string;
      };
    } catch (error) {
      console.error("Error refreshing token", error);
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const tokenDoc = await RefreshToken.findOne({
      jti: payload.jti,
      isRevoked: false,
    });

    if (!tokenDoc) {
      await RefreshToken.updateMany(
        { userId: payload.userId },
        { isRevoked: true },
      );
      logger.warn(
        `Security breach detected. All sessions revoked for user: ${payload.userId}`,
      );
      throw new UnauthorizedError(
        "Security breach detected. All sessions revoked",
      );
    }

    const isValid = await bcrypt.compare(token, tokenDoc.tokenHash);
    if (!isValid) {
      throw new UnauthorizedError("Refresh token mismatch");
    }

    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const newJti = uuidv4();
    const accessPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };
    const refreshPayload = {
      userId: user._id.toString(),
      jti: newJti,
      role: user.role
    };
    const newAccessToken = this.generateAccessToken(accessPayload);
    const newRefreshToken = this.generateRefreshToken(refreshPayload);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    await RefreshToken.create({
      userId: user._id,
      jti: newJti,
      tokenHash: newRefreshTokenHash,
      userAgent,
      ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return SuccessRes({
      message: "Tokens refreshed",
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return SuccessRes({ message: "Logged out" });
    }

    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        jti: string;
      };
      const result = await RefreshToken.findOneAndUpdate(
        { jti: payload.jti, isRevoked: false },
        { $set: { isRevoked: true } },
        { new: true },
      );

      if (!result) {
        logger.warn(
          `Logout attempted on missing or already revoked JTI: ${payload.jti}`,
        );
        console.warn(
          `Logout attempted on missing or already revoked JTI: ${payload.jti}`,
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error("jwt logout verification error:", err.message);
      }
      console.error("jwt logout error");
    }

    return SuccessRes({ message: "Logged out" });
  }

  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFoundError("User");
    }

    await Otp.deleteMany({ email });

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log("generated otp:", otp);

    await Otp.create({
      email,
      otp,
      expiresAt,
      isVerified: false,
      use: "password_reset",
    });

    const mailConfig = {
      from: "hello@gmail.com",
      to: email,
      subject: "Shop-It - Verify your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #cc6300; font-size: 32px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    await mailer.sendMail(mailConfig);
    logger.info("Password reset mail sent");

    return SuccessRes({
      message: "Password reset mail sent successfully",
    });
  }

  async verifyPasswordResetOtp(email: string, otp: string) {
    const otpRecord = await Otp.findOne({
      email,
      isVerified: false,
      use: "password_reset",
    });
    if (!otpRecord) {
      throw new NotFoundError("OTP");
    }

    if (otpRecord.expiresAt < new Date()) {
      await otpRecord.deleteOne();
      throw new ValidationError("Invalid or expired otp");
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isOtpValid) {
      throw new ValidationError("Invalid or expired otp");
    }

    const updated = await Otp.findOneAndUpdate(
      { _id: otpRecord._id, isVerified: false },
      { $set: { isVerified: true } },
      { new: true },
    );

    if (!updated) {
      throw new ValidationError("OTP already verified or processed");
    }

    return SuccessRes({
      message: "Otp verified successfully",
    });
  }

  async resetPassword(
    email: string,
    password: string,
    metadata: { userAgent: string; ip: string },
  ) {
    const otpRecord = await Otp.findOne({
      email,
      isVerified: true,
      use: "password_reset",
    });
    if (!otpRecord) {
      throw new NotFoundError("Verify email first");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFoundError("User");
    }

    user.password = password;
    await user.save();

    await RefreshToken.deleteMany({ _id: user._id });

    await otpRecord.deleteOne({ _id: otpRecord._id });

    const newJti = uuidv4();
    const accessToken = this.generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    const refreshToken = this.generateRefreshToken({
      userId: user._id.toString(),
      jti: newJti,
      role: user.role
    });

    const newRefreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await RefreshToken.create({
      userId: user._id,
      jti: newJti,
      tokenHash: newRefreshTokenHash,
      userAgent: metadata.userAgent,
      ip: metadata.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const mailConfig = {
      from: "stuffworks101@gmail.com",
      to: email,
      subject: "Shop-It - Password reset successfully",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password changed successfully</h2>
        </div>
      `,
    };

    await mailer
      .sendMail(mailConfig)
      .catch((err) => logger.error("Email send failed", err));
    logger.info("Password RESET successfully");

    return SuccessRes({
      message: "Password reset successfully",
      data: { user: user.toObject(), accessToken, refreshToken },
    });
  }

  async changePassword(
    userId: string,
    newPassword: string,
    currentPassword: string,
  ) {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new NotFoundError("User");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ValidationError("Invalid Password");
    }

    user.password = newPassword;
    await user.save();

    const mailConfig = {
      from: "hello@gmail.com",
      to: user.email,
      subject: "Shop-It - Password changed successfully",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password changed successfully</h2>
        </div>
      `,
    };

    await mailer.sendMail(mailConfig);
    logger.info("Password CHANGED successfully");

    return SuccessRes({ message: "Password changed successfully" });
  }
}

const authService = new AuthService();
export default authService;
