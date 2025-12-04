import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { optimizeAvatarImage, AVATAR_DIR } from '../utils/userAvatarUpload';
import { validatePassword, PASSWORD_REQUIREMENTS } from '../utils/passwordValidation';

export class UserController {
  // Get current user
  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const user = await User.findById(payload.sub).select("username email role firstName lastName profilePicture adminPermissions authProvider");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      
      console.log("getCurrentUser - user:", user.email, "role:", user.role, "adminPermissions:", (user as any).adminPermissions);
      
      return res.json({ 
        data: { 
          username: user.username, 
          email: user.email, 
          role: user.role,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          profilePicture: (user as any).profilePicture,
          name: `${(user as any).firstName} ${(user as any).lastName}`,
          adminPermissions: (user as any).adminPermissions,
          authProvider: (user as any).authProvider || 'local',
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

  // Change password
  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(payload.sub);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Check if user signed up with Google OAuth
      if (user.authProvider === 'google' && !user.password) {
        return res.status(400).json({ 
          message: "Your account uses Google Sign-In. You cannot change password here.",
          isGoogleAccount: true
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Validate password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: PASSWORD_REQUIREMENTS,
          errors: passwordValidation.errors 
        });
      }

      // Verify current password
      const bcrypt = require('bcrypt');
      if (!user.password) {
        return res.status(400).json({ message: "No password set for this account" });
      }
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

      const oldAvatar = (user as any).profilePicture as string | undefined;

      // Optimize the stored avatar image (resize/compress) before saving the path
      await optimizeAvatarImage(file.filename);

      const relativePath = `/uploads/avatars/${file.filename}`;
      (user as any).profilePicture = relativePath;
      user.updatedAt = new Date();
      await user.save();

      // After successfully saving the new avatar, delete the previous local avatar file (if any)
      if (oldAvatar && typeof oldAvatar === "string") {
        try {
          if (oldAvatar.startsWith("/uploads/avatars/")) {
            const oldFilename = oldAvatar.split("/").pop();
            if (oldFilename && oldFilename !== file.filename) {
              const oldPath = path.join(AVATAR_DIR, oldFilename);
              if (fs.existsSync(oldPath)) {
                await fs.promises.unlink(oldPath);
              }
            }
          }
        } catch (err) {
          console.error("Failed to delete old avatar image", err);
        }
      }

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
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await User.find({}).select("username email role createdAt firstName lastName phoneNumber isEmailVerified adminPermissions");
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
      
      if (payload.role !== "superadmin") {
        return res.status(403).json({ message: "Superadmin access required" });
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

  // Update admin module permissions (superadmin only)
  static async updateAdminPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;

      if (payload.role !== "superadmin") {
        return res.status(403).json({ message: "Superadmin access required" });
      }

      const { userId } = req.params;
      const { adminPermissions } = req.body as { adminPermissions?: any };

      if (!adminPermissions || typeof adminPermissions !== 'object') {
        return res.status(400).json({ message: "adminPermissions object is required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== "admin") {
        return res.status(400).json({ message: "Permissions can only be set for admin users" });
      }

      const current: any = (user as any).adminPermissions || {};

      const updated = {
        ...current,
        manageBookings: adminPermissions.manageBookings ?? current.manageBookings,
        manageRooms: adminPermissions.manageRooms ?? current.manageRooms,
        manageHousekeeping: adminPermissions.manageHousekeeping ?? current.manageHousekeeping,
        manageUsers: adminPermissions.manageUsers ?? current.manageUsers,
        viewReports: adminPermissions.viewReports ?? current.viewReports,
      };

      (user as any).adminPermissions = updated;
      user.updatedAt = new Date();
      await user.save();

      return res.json({
        message: "Admin permissions updated successfully",
        data: {
          userId,
          adminPermissions: updated,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}
