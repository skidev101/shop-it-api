import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "../config/env";
import { Otp, User } from "../models";
import ApiError from "../utils/api-errors";
import mailer from "../config/mailer";
import { logger } from "../lib/logger";
import { SuccessRes } from "../utils/responses";
import { RegisterPayload } from "../../types/auth";

export class AuthService {
  private generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  private generateTokens = (
    userId: string,
    email: string
  ): { accessToken: string; refreshToken: string } => {
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
      throw new ApiError("User already exists", 402);
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
      throw new ApiError("Invalid Otp", 400);
    }

    if (otpMatch.expiresAt < new Date()) {
      throw new ApiError("Otp has expired", 402);
    }

    const validOtp = await bcrypt.compare(otpMatch.otp, otp);
    if (!validOtp) {
      throw new ApiError("Inavalid or expired otp", 400);
    }

    otpMatch.verified = true;
    await otpMatch.save();

    return SuccessRes({ message: "Email verification successful" });
  }

  async register(data: RegisterPayload) {
    const isVerified = await Otp.findOne({ email: data.email, verified: true });
    if (!isVerified) {
      throw new ApiError("Account not verified", 400);
    }

    const userExists = await User.findOne({ email: data.email });

    if (userExists) {
      throw new ApiError("Account already exists", 409);
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

    const {accessToken, refreshToken} = this.generateTokens({ userId: user._id.toString(), email: user.email });

    const userObject = user.toObject();

    return SuccessRes({ message: "Registeration successful" });
  }
}
