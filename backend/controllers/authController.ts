import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { sendEmail } from '../services/emailService';
import { verifyRecaptcha } from '../middleware/recaptcha';
import { AuthenticatedRequest } from '../middleware/auth';
import { validatePassword, PASSWORD_REQUIREMENTS } from '../utils/passwordValidation';
import { logActivity } from '../services/activityLogService';
import { encrypt, encryptObject } from '../utils/encryption';

const jwtSecret = process.env.JWT_SECRET || "dev_secret";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
const isProduction = process.env.NODE_ENV === "production";

// Store pending verifications (in production, use Redis or database)
const pendingVerifications = new Map<string, { 
  username: string; 
  email: string; 
  password: string; 
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: any;
  code: string; 
  expires: number 
}>();

// Store password reset tokens (in production, use Redis or database)
const passwordResetTokens = new Map<string, {
  email: string;
  code: string;
  expires: number;
}>();

export class AuthController {
  // SIGNUP
  static async signup(req: Request, res: Response) {
    try {
      const { 
        username, 
        email, 
        password, 
        firstName, 
        lastName, 
        phoneNumber, 
        dateOfBirth,
        address,
        recaptchaToken
      } = req.body;

      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Username, email, password, first name, and last name are required" });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: PASSWORD_REQUIREMENTS,
          errors: passwordValidation.errors 
        });
      }

      // Verify reCAPTCHA
      if (recaptchaToken) {
        const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, req.ip);
        if (!isRecaptchaValid) {
          return res.status(400).json({ message: "reCAPTCHA verification failed" });
        }
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      
      // Store pending verification (expires in 10 minutes)
      pendingVerifications.set(email, {
        username,
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        address,
        code: verificationCode.toString(),
        expires: Date.now() + 10 * 60 * 1000 // 10 minutes
      });

      // Send verification email
      const subject = "Your RedBoat verification code";
      const html = `
        <div style="background:#f6f8fb;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
            <tr>
              <td style="padding:20px 24px;background:#0ea5e9;color:#ffffff;">
                <h1 style="margin:0;font-size:18px;">RedBoat</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a;">Verify your email</h2>
                <p style="margin:0 0 16px;color:#334155;">Use this verification code to complete your signup.</p>
                <div style="display:inline-block;padding:12px 20px;border:1px dashed #0ea5e9;border-radius:8px;font-size:24px;letter-spacing:6px;font-weight:700;color:#0ea5e9;">
                  ${verificationCode}
                </div>
                <p style="margin:16px 0 0;color:#64748b;font-size:12px;">This code expires in 10 minutes.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} RedBoat
              </td>
            </tr>
          </table>
        </div>
      `;

      await sendEmail(email, subject, html);

      await logActivity(req, {
        action: 'signup_requested',
        resource: 'auth',
        actorEmail: email,
        details: { username, firstName, lastName }
      });

      res.status(200).json({ 
        message: "Verification code sent to your email. Please check your inbox and verify your account.",
        email: email
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // VERIFY EMAIL CODE
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      const pending = pendingVerifications.get(email);
      if (!pending) {
        return res.status(400).json({ message: "No pending verification found for this email" });
      }

      if (Date.now() > pending.expires) {
        pendingVerifications.delete(email);
        return res.status(400).json({ message: "Verification code has expired" });
      }

      if (pending.code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Create the user account (encrypt sensitive fields at rest)
      const hashedPassword = await bcrypt.hash(pending.password, 10);
      const newUser = new User({
        username: pending.username,
        email: pending.email,
        password: hashedPassword,
        firstName: pending.firstName,
        lastName: pending.lastName,
        phoneNumber: pending.phoneNumber ? (encrypt(pending.phoneNumber) ?? undefined) : undefined,
        dateOfBirth: pending.dateOfBirth ? new Date(pending.dateOfBirth) : undefined,
        address: pending.address,
        addressEncrypted: pending.address ? (encryptObject(pending.address) ?? undefined) : undefined,
        isEmailVerified: true,
      } as any);

      const savedUser = await newUser.save();
      
      // Clean up pending verification
      pendingVerifications.delete(email);

      await logActivity(req, {
        action: 'signup_verified',
        resource: 'auth',
        actorEmail: email,
        details: { userId: (savedUser._id as any).toString() }
      });

      res.status(201).json({ 
        message: "Email verified and account created successfully", 
        data: { username: savedUser.username, email: savedUser.email, role: savedUser.role }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // LOGIN
  static async login(req: Request, res: Response) {
    try {
      const { email, password, recaptchaToken } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Verify reCAPTCHA
      if (recaptchaToken) {
        const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, req.ip);
        if (!isRecaptchaValid) {
          return res.status(400).json({ message: "reCAPTCHA verification failed" });
        }
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      if ((user as any).isBlocked) {
        return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
      }

      // Check if user signed up with Google OAuth
      if (user.authProvider === 'google') {
        return res.status(400).json({ message: "This account uses Google Sign-In. Please use the Google button to log in." });
      }

      // Check password
      if (!user.password) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ sub: (user._id as any).toString(), email: user.email, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn } as SignOptions);
      await logActivity(req, {
        action: 'login',
        resource: 'auth',
        actorEmail: user.email,
        details: { role: user.role },
        status: 'success'
      });

      res
        .cookie("auth", token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .json({
          message: "Login successful",
          data: { username: user.username, email: user.email, role: user.role },
        });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // FORGOT PASSWORD - Generate reset token
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as { email?: string };

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store the reset token
      passwordResetTokens.set(email, {
        email,
        code: verificationCode,
        expires
      });

      // Send email with reset code
      const subject = "Your RedBoat account password reset code";
      const html = `
        <div style="background:#f6f8fb;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
            <tr>
              <td style="padding:20px 24px;background:#0ea5e9;color:#ffffff;">
                <h1 style="margin:0;font-size:18px;">RedBoat</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a;">Password reset code</h2>
                <p style="margin:0 0 16px;color:#334155;">Use the verification code below to reset your password.</p>
                <div style="display:inline-block;padding:12px 20px;border:1px dashed #0ea5e9;border-radius:8px;font-size:24px;letter-spacing:6px;font-weight:700;color:#0ea5e9;">
                  ${verificationCode}
                </div>
                <p style="margin:16px 0 0;color:#64748b;font-size:12px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;">
                © RedBoat
              </td>
            </tr>
          </table>
        </div>
      `;

      await sendEmail(email, subject, html);

      return res.json({ message: "Password reset code sent to your email" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // VERIFY RESET CODE
  static async verifyResetCode(req: Request, res: Response) {
    try {
      const { email, code } = req.body as { email?: string; code?: string };

      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      const resetToken = passwordResetTokens.get(email);
      if (!resetToken) {
        return res.status(400).json({ message: "No password reset request found for this email" });
      }

      if (Date.now() > resetToken.expires) {
        passwordResetTokens.delete(email);
        return res.status(400).json({ message: "Reset code has expired" });
      }

      if (resetToken.code !== code) {
        return res.status(400).json({ message: "Invalid reset code" });
      }

      // Code is valid, allow password reset
      return res.json({ message: "Reset code verified successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // RESET PASSWORD
  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, newPassword } = req.body as {
        email?: string;
        code?: string;
        newPassword?: string;
      };

      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and newPassword are required" });
      }

      // Validate password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: PASSWORD_REQUIREMENTS,
          errors: passwordValidation.errors 
        });
      }

      // Verify the reset token
      const resetToken = passwordResetTokens.get(email);
      if (!resetToken) {
        return res.status(400).json({ message: "No password reset request found for this email" });
      }

      if (Date.now() > resetToken.expires) {
        passwordResetTokens.delete(email);
        return res.status(400).json({ message: "Reset code has expired" });
      }

      if (resetToken.code !== code) {
        return res.status(400).json({ message: "Invalid reset code" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      // Clean up the reset token
      passwordResetTokens.delete(email);

      await logActivity(req, {
        action: 'reset_password',
        resource: 'auth',
        actorEmail: email,
        status: 'success'
      });

      return res.json({ message: "Password updated successfully" });
    } catch (err) {
      console.error("Reset password error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // GOOGLE LOGIN
  static async googleLogin(req: Request, res: Response) {
    try {
      console.log("Google login attempt received");
      
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        console.error("Google auth not configured - missing clientId");
        return res.status(500).json({ 
          message: "Google auth not configured",
          details: "GOOGLE_CLIENT_ID environment variable is missing or invalid"
        });
      }

      const { OAuth2Client } = require('google-auth-library');
      const googleClient = new OAuth2Client(googleClientId);

      const { idToken } = req.body as { idToken?: string };
      if (!idToken) {
        console.error("No idToken provided in request");
        return res.status(400).json({ message: "idToken is required" });
      }

      console.log("Verifying Google token with client ID:", googleClientId);
      
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        console.error("Invalid Google token payload");
        return res.status(400).json({ message: "Invalid Google token" });
      }

      console.log("Google token verified for email:", payload.email);

      const email = payload.email;

      let user = await User.findOne({ email });
      if (!user) {
        console.log("Creating new user for Google account:", email);
        
        // Create user without password for Google accounts (no username for now)
        user = new User({ 
          username: undefined, // Leave username blank for Google OAuth users
          email, 
          authProvider: 'google',
          // No password for Google OAuth users
          firstName: payload.given_name || email.split("@")[0],
          lastName: payload.family_name || "",
          isEmailVerified: true
        });
        
        await user.save();
        console.log("New user created with email:", user.email);
      } else {
        console.log("Existing user found:", user.email);
      }

      if ((user as any).isBlocked) {
        return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
      }

      const token = jwt.sign({ sub: (user._id as any).toString(), email: user.email, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn } as SignOptions);
      
      console.log("Google login successful for user:", user.email);
      
      await logActivity(req, {
        action: 'login_google',
        resource: 'auth',
        actorEmail: user.email,
        details: { role: user.role },
        status: 'success'
      });

      return res
        .cookie("auth", token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .json({
          message: "Google login successful",
          data: { 
            username: user.username || null, 
            email: user.email, 
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          },
        });
    } catch (err) {
      console.error("Google OAuth error:", err);
      if (err instanceof Error) {
        return res.status(500).json({ 
          message: "Failed to verify Google token", 
          error: err.message,
          details: "Check server console for more details"
        });
      }
      return res.status(500).json({ message: "Failed to verify Google token" });
    }
  }

  // LOGOUT
  static async logout(req: Request, res: Response) {
    await logActivity(req, { action: 'logout', resource: 'auth', status: 'success' });
    res.clearCookie("auth", { 
      httpOnly: true, 
      secure: isProduction, 
      sameSite: isProduction ? "none" : "lax", 
      path: '/' 
    }).json({ message: "Logged out" });
  }

  // PROMOTE TO ADMIN
  static async promoteToAdmin(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.role = "admin";
      await user.save();

      await logActivity(req, {
        action: 'promote_to_admin',
        resource: 'user',
        resourceId: (user._id as any).toString(),
        details: { email }
      });

      res.json({ 
        message: "User promoted to admin successfully", 
        data: { username: user.username, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // SET USERNAME (for Google OAuth users)
  static async setUsername(req: AuthenticatedRequest, res: Response) {
    try {
      const { username } = req.body;
      const payload = req.user!;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }

      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
      }

      // Check if username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Update the current user's username
      const user = await User.findById(payload.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.username = username;
      await user.save();

      await logActivity(req, {
        action: 'set_username',
        resource: 'user',
        resourceId: (user._id as any).toString(),
        details: { username }
      });

      res.json({
        message: "Username set successfully",
        data: { 
          username: user.username, 
          email: user.email, 
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}
