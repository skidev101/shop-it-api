import nodemailer from "nodemailer";
import {
  env
} from "./env";

const mailer = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.EMAIL_PORT as string),
  secure: true, // true for 465, false for other ports
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
});

export default mailer;
