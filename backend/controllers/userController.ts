import { Response } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

export class UserController {
  // Get current user
  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const user = await User.findById(payload.sub).select("username email role");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      return res.json({ data: { username: user.username, email: user.email, role: user.role } });
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
        firstName, 
        lastName, 
        phoneNumber, 
        dateOfBirth, 
        address 
      } = req.body;

      const user = await User.findById(payload.sub);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Update fields if provided
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      if (dateOfBirth !== undefined) user.dateOfBirth = new Date(dateOfBirth);
      if (address !== undefined) user.address = address;
      
      user.updatedAt = new Date();
      await user.save();

      // Return updated user without sensitive data
      const updatedUser = await User.findById(payload.sub).select("-password -googleCalendarTokens");
      return res.json({ 
        message: "Profile updated successfully", 
        data: updatedUser 
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

  // Get all users (admin only)
  static async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await User.find({}).select("username email role createdAt");
      res.json({ data: users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}
