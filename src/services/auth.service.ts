import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models";

export class AuthService {
  private generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  private generateTokens = (
    username: string,
    email: string
  ): { accessToken: string; refreshToken: string } => {
    const accessToken = jwt.sign({ username, email }, env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ username, email }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  };

  async sendVerificationEmail(email: string) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("User already exists")
    }
  }
}
