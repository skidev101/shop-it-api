import jwt, { Jwt } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "../config/env";
import { Otp, User } from "../models";
import {
  ApiError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/api-errors";
import mailer from "../config/mailer";
import { logger } from "../lib/logger";
import { SuccessRes } from "../utils/responses";
import { LoginPayload, RegisterPayload, TokenPayload } from "../types/auth";
import { TokenBlacklist } from "../models/TokenBlacklist";

export class AuthService {
  private generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  private generateTokens = ({
    userId,
    email,
  }: TokenPayload): { accessToken: string; refreshToken: string } => {
    const accessToken = jwt.sign({ userId, email }, env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId, email }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  };

  async sendVerificationEmail(email: string) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 12);

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt,
      verified: false,
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
    logger.info("Verification email sent");

    return SuccessRes({ message: "Verification email sent" });
  }

  async verifyOtp(email: string, otp: string) {
    const otpMatch = await Otp.findOne({ email, verified: false });

    if (!otpMatch) {
      throw new NotFoundError("OTP");
    }

    if (otpMatch.expiresAt < new Date()) {
      throw new UnauthorizedError("Otp has expired");
    }

    const validOtp = await bcrypt.compare(otp, otpMatch.otp);
    if (!validOtp) {
      throw new UnauthorizedError("Inavalid or expired otp");
    }

    otpMatch.verified = true;
    await otpMatch.save();

    return SuccessRes({ message: "Email verification successful" });
  }

  async register(data: RegisterPayload) {
    const isVerified = await Otp.findOne({ email: data.email, verified: true });
    if (!isVerified) {
      throw new UnauthorizedError("Account not verified");
    }

    const userExists = await User.findOne({ email: data.email });

    if (userExists) {
      throw new ConflictError("Account already exists");
    }

    const user = await User.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash: data.password,
      role: "customer",
      isVerified: false,
      timezone: "Africa/Lagos",
    });

    await Otp.deleteOne({ _id: isVerified._id });

    const { accessToken, refreshToken } = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
    });

    const userObject = user.toObject();

    return SuccessRes({
      message: "Registeration successful",
      data: {
        user: userObject,
        accessToken,
        refreshToken,
      },
      statusCode: 201,
    });
  }

  async login(data: LoginPayload) {
    const user = await User.findOne({ email: data.email }).select(
      "+passwordHash"
    );
    if (!user) {
      throw new NotFoundError("User");
    }

    const isPasswordValid = await bcrypt.compare(
      user.passwordHash,
      data.password
    );
    if (!isPasswordValid) {
      throw new ValidationError("Invalid credentials");
    }

    const { accessToken, refreshToken } = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
    });

    const userObj = user.toObject();

    return SuccessRes({
      message: "Login successful",
      data: {
        user: userObj,
        accessToken,
        refreshToken,
      },
      statusCode: 200,
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      const decodedToken = jwt.verify(
        refreshToken,
        env.JWT_SECRET
      ) as TokenPayload;

      const isInBlacklist = await TokenBlacklist.findOne({
        token: refreshToken,
      });
      if (isInBlacklist) {
        throw new ForbiddenError("Expired token");
      }

      const user = await User.findById(decodedToken.userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const newTokens = this.generateTokens({
        userId: user._id.toString(),
        email: user.email,
      });

      const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;
      console.log("decoded token:", decoded);
      if (decoded?.exp) {
        await TokenBlacklist.create({
          token: refreshToken,
          expiresAt: new Date(decoded.exp * 1000),
        });

        console.log("created new blacklist token");
      }

      return SuccessRes({
        message: "Token refreshed successfully",
        data: newTokens,
      });
    } catch (error) {
      if (error) throw new UnauthorizedError("Invalid refresh token");
      throw error;
    }
  }

  async logout(accessToken: string, refreshToken?: string) {
    if (!accessToken || accessToken.trim() === "") {
      throw new ValidationError("Access token is required");
    }

    const decodedAccessToken = jwt.decode(accessToken) as jwt.JwtPayload;
    const decodedRefreshToken = refreshToken
      ? (jwt.decode(refreshToken) as jwt.JwtPayload)
      : null;

    if (!decodedAccessToken) {
      return new ValidationError("Invalid access token");
    }

    if (decodedAccessToken.exp) {
      const isBlacklisted = await TokenBlacklist.findOne({
        token: accessToken,
      });

      if (!isBlacklisted) {
        await TokenBlacklist.create({
          token: accessToken,
          expiresAt: new Date(decodedAccessToken.exp * 1000),
        });
      }
    }

    if (refreshToken && decodedRefreshToken?.exp) {
      const isBlacklisted = await TokenBlacklist.findOne({
        token: accessToken,
      });

      if (!isBlacklisted) {
        await TokenBlacklist.create({
          token: refreshToken,
          expiresAt: new Date(decodedRefreshToken.exp * 1000),
        });
      }
    }

    return SuccessRes({
      message: "Logged out successfully",
    });
  }
}
