import { Response } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { optimizeAvatarImage } from '../utils/userAvatarUpload';

export class UserController {
  // Get current user
  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const user = await User.findById(payload.sub).select("username email role firstName lastName profilePicture");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      return res.json({ 
        data: { 
          username: user.username, 
          email: user.email, 
          role: user.role,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          profilePicture: (user as any).profilePicture,
          name: `${(user as any).firstName} ${(user as any).lastName}`,
        } 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get user profile (detailed information)
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const user = await User.findById(payload.sub).select("-password -googleCalendarTokens");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      return res.json({ data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Update user profile
  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const {
        username,
        email,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        address,
        emailNotifications,
      } = req.body as {
        username?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        address?: any;
        emailNotifications?: boolean;
      };

      const user = await User.findById(payload.sub);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Username update (optional)
      if (username !== undefined) {
        if (username.length < 3) {
          return res.status(400).json({ message: "Username must be at least 3 characters long" });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
        }

        const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }

        user.username = username;
      }

      // Email update (optional)
      if (email !== undefined) {
        if (typeof email !== "string" || !email.includes("@")) {
          return res.status(400).json({ message: "A valid email address is required" });
        }

        const existingByEmail = await User.findOne({ email, _id: { $ne: user._id } });
        if (existingByEmail) {
          return res.status(400).json({ message: "Email already in use" });
        }

        user.email = email;
        // Mark as unverified after changing email
        (user as any).isEmailVerified = false;
      }

      // Update other profile fields if provided
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      if (dateOfBirth !== undefined) user.dateOfBirth = new Date(dateOfBirth);
      if (address !== undefined) user.address = address;
      if (emailNotifications !== undefined) user.emailNotifications = Boolean(emailNotifications);

      user.updatedAt = new Date();
      await user.save();

      // Return updated user without sensitive data
      const updatedUser = await User.findById(payload.sub).select("-password -googleCalendarTokens");
      return res.json({
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Delete the currently authenticated user's account
  static async deleteAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;

      const user = await User.findByIdAndDelete(payload.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res
        .clearCookie("auth", { httpOnly: true, secure: true, sameSite: "none", path: "/" })
        .status(200)
        .json({ message: "Account deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Change password
  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      const user = await User.findById(payload.sub);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Verify current password
      const bcrypt = require('bcrypt');
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.updatedAt = new Date();
      await user.save();

      return res.json({ message: "Password updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Upload / update profile avatar
  static async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const file = (req as any).file as { filename: string } | undefined;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await User.findById(payload.sub);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Optimize the stored avatar image (resize/compress) before saving the path
      await optimizeAvatarImage(file.filename);

      const relativePath = `/uploads/avatars/${file.filename}`;
      (user as any).profilePicture = relativePath;
      user.updatedAt = new Date();
      await user.save();

      const updatedUser = await User.findById(payload.sub).select("-password -googleCalendarTokens");
      return res.json({
        message: "Avatar updated successfully",
        data: updatedUser,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get all users (admin only)
  static async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await User.find({}).select("username email role createdAt firstName lastName phoneNumber isEmailVerified");
      res.json({ data: users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Update user role (admin only)
  static async updateUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required (user or admin)" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.role = role;
      user.updatedAt = new Date();
      await user.save();

      res.json({ 
        message: "User role updated successfully", 
        data: { userId, role } 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}
