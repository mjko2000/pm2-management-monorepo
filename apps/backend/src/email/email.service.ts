import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const smtpUser = this.configService.get<string>("SMTP_USER");
    const smtpPass = this.configService.get<string>("SMTP_PASS");

    if (!smtpUser || !smtpPass) {
      console.warn(
        "Email service not configured: SMTP_USER and SMTP_PASS are required"
      );
      return;
    }

    const port = this.configService.get<number>("SMTP_PORT", 587);
    // Port 465 uses direct SSL, port 587 uses STARTTLS
    const secure = port === 465;

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST", "smtp.gmail.com"),
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.isConfigured = true;
    console.log(
      `Email service configured with ${secure ? "SSL" : "STARTTLS"} on port ${port}`
    );
  }

  async sendWelcomeEmail(
    email: string,
    username: string,
    password: string
  ): Promise<void> {
    const appName = this.configService.get<string>("APP_NAME", "PM2 Dashboard");
    const appUrl = this.configService.get<string>(
      "APP_URL",
      "http://localhost:3000"
    );

    const mailOptions = {
      from: this.configService.get<string>(
        "SMTP_FROM",
        `"${appName}" <noreply@example.com>`
      ),
      to: email,
      subject: `Welcome to ${appName} - Your Account Has Been Created`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2; }
            .credentials p { margin: 8px 0; }
            .credentials strong { color: #1976d2; }
            .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3e0; padding: 15px; border-radius: 4px; margin-top: 20px; color: #e65100; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${username}!</h2>
              <p>Your account has been created by an administrator. Below are your login credentials:</p>
              
              <div class="credentials">
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
              </div>
              
              <a href="${appUrl}" class="button">Login to ${appName}</a>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from ${appName}. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to ${appName}!

Your account has been created by an administrator.

Your login credentials:
- Username: ${username}
- Email: ${email}
- Password: ${password}

Login at: ${appUrl}

IMPORTANT: Please change your password after your first login for security purposes.

This is an automated message. Please do not reply to this email.
      `,
    };

    if (!this.isConfigured || !this.transporter) {
      console.warn("Email not sent: Email service is not configured");
      return;
    }

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send welcome email:", error.message);
      // Don't throw - email failure shouldn't prevent user creation
    }
  }

  async sendPasswordResetEmail(
    email: string,
    username: string,
    newPassword: string
  ): Promise<void> {
    const appName = this.configService.get<string>("APP_NAME", "PM2 Dashboard");
    const appUrl = this.configService.get<string>(
      "APP_URL",
      "http://localhost:3000"
    );

    const mailOptions = {
      from: this.configService.get<string>(
        "SMTP_FROM",
        `"${appName}" <noreply@example.com>`
      ),
      to: email,
      subject: `${appName} - Your Password Has Been Reset`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2; }
            .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
            </div>
            <div class="content">
              <h2>Password Reset</h2>
              <p>Hello ${username}, your password has been reset by an administrator.</p>
              
              <div class="credentials">
                <p><strong>New Password:</strong> ${newPassword}</p>
              </div>
              
              <a href="${appUrl}" class="button">Login to ${appName}</a>
            </div>
            <div class="footer">
              <p>This is an automated message from ${appName}. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset - ${appName}

Hello ${username}, your password has been reset by an administrator.

New Password: ${newPassword}

Login at: ${appUrl}

This is an automated message. Please do not reply to this email.
      `,
    };

    if (!this.isConfigured || !this.transporter) {
      console.warn("Email not sent: Email service is not configured");
      return;
    }

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send password reset email:", error.message);
    }
  }
}
