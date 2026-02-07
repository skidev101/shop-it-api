import jwt, { Jwt } from "jsonwebtoken";
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
import { LoginPayload, RegisterPayload, AccessTokenPayload, RefreshTokenPayload } from "../types/auth";

export class AuthService {
  private generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  private generateAccessToken(payload: AccessTokenPayload) {
    return jwt.sign({ ...payload }, env.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
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
    const hashedOtp = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt,
      isVerified: false,
      use: "email_verification",
    });

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
    const otpMatch = await Otp.findOne({ email, isVerified: false });

    if (!otpMatch) {
      throw new NotFoundError("OTP");
    }

    if (otpMatch.expiresAt < new Date()) {
      throw new UnauthorizedError("Otp has expired");
    }

    const isValid = await bcrypt.compare(otp, otpMatch.otp);
    if (!isValid) {
      throw new UnauthorizedError("Inavalid or expired otp");
    }

    otpMatch.isVerified = true;
    await otpMatch.save();

    return SuccessRes({ message: "OTP verification successful" });
  }

  async register(data: RegisterPayload) {
    const isVerified = await Otp.findOne({
      email: data.email,
      use: "email_verification",
      isVerified: true,
    });
    if (!isVerified) {
      throw new UnauthorizedError("Email not verified");
    }

    const userExists = await User.findOne({ email: data.email });
    if (userExists) {
      throw new ConflictError("Account already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash,
      role: "customer",
      isVerified: false,
      timezone: "Africa/Lagos",
    });

    await Otp.deleteOne({ _id: isVerified._id });
    user.isVerified = true;
    await user.save();

    const newJti = uuidv4();
    const accessPayload = {
      userId: user._id.toString(),
      email: user.email,
    };
    const refreshPayload = {
      userId: user._id.toString(),
      jti: newJti
    };
    const newAccessToken = this.generateAccessToken(accessPayload);
    const newRefreshToken = this.generateRefreshToken(refreshPayload);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return SuccessRes({
      message: "Registeration successful",
      data: {
        user: user.toObject(),
        newAccessToken,
        newRefreshToken,
      },
      statusCode: 201,
    });
  }

  async login(data: LoginPayload, userAgent?: string, ip?: string) {
    const user = await User.findOne({ email: data.email }).select(
      "+passwordHash"
    );
    if (!user) {
      throw new NotFoundError("User");
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new ValidationError("Invalid credentials");
    }

    const newJti = uuidv4();
    const accessPayload = {
      userId: user._id.toString(),
      email: user.email,
    };
    const refreshPayload = {
      userId: user._id.toString(),
      jti: newJti
    };
    const newAccessToken = this.generateAccessToken(accessPayload);
    const newRefreshToken = this.generateRefreshToken(refreshPayload);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newRefreshTokenHash,
      userAgent,
      ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return SuccessRes({
      message: "Login successful",
      data: {
        user: user.toObject(),
        newAccessToken,
        newRefreshToken,
      },
      statusCode: 200,
    });
  }

  // try {
  //   const decodedToken = jwt.verify(
  //     refreshToken,
  //     env.JWT_REFRESH_SECRET
  //   ) as TokenPayload;

  //   const isInBlacklist = await TokenBlacklist.findOne({
  //     token: refreshToken,
  //   });
  //   if (isInBlacklist) {
  //     throw new ForbiddenError("Expired token");
  //   }

  //   const user = await User.findById(decodedToken.userId);
  //   if (!user) {
  //     throw new NotFoundError("User not found");
  //   }

  //   const newTokens = this.generateTokens({
  //     userId: user._id.toString(),
  //     email: user.email,
  //   });

  //   const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;
  //   console.log("decoded token:", decoded);
  //   if (decoded?.exp) {
  //     await TokenBlacklist.create({
  //       token: refreshToken,
  //       expiresAt: new Date(decoded.exp * 1000),
  //     });

  //     console.log("created new blacklist token");
  //   }

  //   return SuccessRes({
  //     message: "Token refreshed successfully",
  //     data: newTokens,
  //   });
  // } catch (error) {
  //   if (error instanceof jwt.JsonWebTokenError) throw new UnauthorizedError("Invalid refresh token");
  //   throw error;
  // }
  async refreshToken(token: string, userAgent?: string, ip?: string) {
    let payload: { userId: string; jti: string };

    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; jti: string };
    } catch (error) {
      console.error("Error refreshing token", error)
      throw new UnauthorizedError("Invalid or expired refresh token")
    }

    const tokenDoc = await RefreshToken.findOne({ 
      jti: payload.jti,
      isRevoked: false
    });

    if (!tokenDoc) {
      await RefreshToken.updateMany(
        { userId: payload.userId },
        { isRevoked: true }
      )
      throw new UnauthorizedError("Refresh tokens revoked")
    }

    const isValid = await bcrypt.compare(token, tokenDoc.tokenHash);
    if (!isValid) {
      throw new UnauthorizedError("Refresh token mismatch")
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
    };
    const refreshPayload = {
      userId: user._id.toString(),
      jti: newJti
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

  // async logout(accessToken: string, refreshToken?: string) {
  //   if (!accessToken || accessToken.trim() === "") {
  //     throw new ValidationError("Access token is required");
  //   }

  //   const decodedAccessToken = jwt.decode(accessToken) as jwt.JwtPayload;
  //   const decodedRefreshToken = refreshToken
  //     ? (jwt.decode(refreshToken) as jwt.JwtPayload)
  //     : null;

  //   if (!decodedAccessToken) {
  //     throw new ValidationError("Invalid access token");
  //   }

  //   if (decodedAccessToken.exp) {
  //     const isBlacklisted = await TokenBlacklist.findOne({
  //       token: accessToken,
  //     });

  //     if (!isBlacklisted) {
  //       await TokenBlacklist.create({
  //         token: accessToken,
  //         expiresAt: new Date(decodedAccessToken.exp * 1000),
  //       });
  //     }
  //   }

  //   if (refreshToken && decodedRefreshToken?.exp) {
  //     const isBlacklisted = await TokenBlacklist.findOne({
  //       token: refreshToken,
  //     });

  //     if (!isBlacklisted) {
  //       await TokenBlacklist.create({
  //         token: refreshToken,
  //         expiresAt: new Date(decodedRefreshToken.exp * 1000),
  //       });
  //     }
  //   }

  //   return SuccessRes({
  //     message: "Logged out successfully",
  //   });
  // }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const tokenDoc = await RefreshToken.findOne({ isRevoked: false })
      if (tokenDoc && (await tokenDoc.compareToken(refreshToken))) {
        tokenDoc.isRevoked = true;
        await tokenDoc.save();
      }
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
    const hashedOtp = await bcrypt.hash(otp, 12);

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt,
      isVerified: false,
      use: "password_reset",
    });

    const mailConfig = {
      from: "stuffworks101@gmail.com",
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
    const otpMatch = await Otp.findOne({
      email,
      isVerified: false,
      use: "password_reset",
    });
    if (!otpMatch) {
      throw new NotFoundError("OTP");
    }

    if (otpMatch.expiresAt < new Date()) {
      await otpMatch.deleteOne();
      throw new ValidationError("Invalid or expired otp");
    }

    const isOtpValid = await bcrypt.compare(otp, otpMatch.otp);
    if (!isOtpValid) {
      throw new ValidationError("Invalid or expired otp");
    }

    otpMatch.isVerified = true;
    await otpMatch.save();

    return SuccessRes({
      message: "Otp verified successfully",
    });
  }

  async resetPassword(email: string, password: string) {
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

    const hashedPassword = await bcrypt.hash(password, 12);
    user.passwordHash = hashedPassword;
    await user.save();

    await otpRecord.deleteOne({ _id: otpRecord._id });
    await otpRecord.save();

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

    await mailer.sendMail(mailConfig);
    logger.info("Password RESET successfully");

    return SuccessRes({ message: "Password reset successfully" });
  }

  async changePassword(
    userId: string,
    newPassword: string,
    currentPassword: string
  ) {
    const user = await User.findOne({ _id: userId }).select("+passwordHash");
    if (!user) {
      throw new NotFoundError("User");
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new ValidationError("Invalid Password");
    }

    const isSamePassword = await bcrypt.compare(newPassword, currentPassword);
    if (isSamePassword) {
      throw new ConflictError("Passwords are already same");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = newPasswordHash;
    await user.save();

    const mailConfig = {
      from: "stuffworks101@gmail.com",
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

  async updateProfile() {
    return;
  }
}

const authService = new AuthService();
export default authService;
