import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Router } from "express";
import nodemailer from "nodemailer";
import pool from "../../database/db.js";
dotenv.config();

const router = Router();

// get the email from the client
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("email from client", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }

    // check if the email is exist in the database
    const checkEmail = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (checkEmail.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `user not found with this email ${email}`,
      });
    }

    // generate a random token for password reset
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // save the token in the database with an expiration time ( e.g., 15 minutes)
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [token, expirationTime, email.toLowerCase()],
    );

    // send the token to the user's email using nodemailer
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;
    console.log("reset link", resetLink);

    // set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // send the email
    await transporter.sendMail({
      from: `"Postora Support" <${process.env.SMTP_USER}>`,
      to: email.toLowerCase(),
      subject: " Postora - Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #10b981;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested to reset your password for your Postora account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
            <p style="color: #666;">This link will expire in <strong>15 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Postora - Your Blogging Platform</p>
        </div>
    `,
    });
  } catch (error) {
    console.error("password reset link send failed: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to send password reset link",
    });
  }
});


// route for reset password
router.post('/forgot-password/reset', async (req, res) => {
    try {
        const { token, email, newPassword, confirmNewPassword } = req.body;

        // validation
        if (!token || !email || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // check token validity and expiration
        const user = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()",
            [email.toLowerCase(), token]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        // hash the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // update the password in the database and clear the reset token and expiry
        await pool.query(
            "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email = $2",
            [hashedPassword, email.toLowerCase()]
        );

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

export default router;
