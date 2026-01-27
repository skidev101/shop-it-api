import { Request, Response } from "express";
import { readDb, writeDb } from "../utils/fileDb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../../types/User";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.IS_PROD,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

const ACCESS_TOKEN_COOKIE = "auth_access_token";
const REFRESH_TOKEN_COOKIE = "auth_refresh_token";

const issueTokens = (username: string, email:string) => {
  const accessToken = jwt.sign({ username, email }, env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ username, email }, env.JWT_SECRET, {
    expiresIn: "1m",
  });

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    console.log("incoming request:", req.body);
    const { email, password, username } = req.body as {
      email?: string;
      password?: string;
      username?: string;
    };

    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ error: "username, email and password are required" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ error: "password must be at least 6 chars" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = readDb();
    const existingUser = db.users.find(
      (user: any) => user.email === normalizedEmail
    );
    if (existingUser) {
      return res.status(409).json({ error: "account already exists" });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const user: User = {
      id: Date.now().toString(),
      username: username,
      email: email,
      password: hashedPwd,
      refreshTokens: [],
    };

    const { accessToken, refreshToken } = issueTokens(user);
    user.refreshTokens.push(refreshToken);
    db.users.push(user);

    writeDb(db);

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, COOKIE_OPTIONS);
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("an error occured", err);
    return res.status(500).json({ error: "internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: String;
      password?: String;
    };

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ error: "password must be at least 6 chars" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const db = readDb();
    const user: User = db.users.find((u: any) => u.email === normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(409).json({ error: "invalid credentials" });
    }

    const { accessToken, refreshToken } = issueTokens(user);
    console.log("refresh tokens at login:", refreshToken);
    // user.refreshToken = []
    user.refreshTokens.push(refreshToken);
    writeDb(db);

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, COOKIE_OPTIONS);
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("error logging in:", error);
    return res.status(500).json({ error: "internal server error" });
  }
};
