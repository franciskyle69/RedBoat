import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import cors from "cors";
import { sendEmail } from "./emailService";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import jwt, { SignOptions } from "jsonwebtoken";
import cookieParser from "cookie-parser";
import axios from "axios";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const jwtSecret = process.env.JWT_SECRET || "dev_secret";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

// reCAPTCHA configuration
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"; // Default test key
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// Google Calendar API setup
const oauth2Client = new google.auth.OAuth2(
  googleClientId,
  googleClientSecret,
  `${clientOrigin}/auth/google/callback`
);

// reCAPTCHA verification function
async function verifyRecaptcha(token: string, remoteip?: string): Promise<boolean> {
  try {
    const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
        remoteip: remoteip
      }
    });

    const { success, score } = response.data;
    
    // For reCAPTCHA v2, we only check success
    // For reCAPTCHA v3, we would also check score (typically > 0.5)
    return success === true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({ 
  origin: [clientOrigin, "http://localhost:5173", "http://localhost:3000"], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// Routes (inline below)

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: false, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: false },
  dateOfBirth: { type: Date, required: false },
  address: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    zipCode: { type: String, required: false },
    country: { type: String, required: false }
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isEmailVerified: { type: Boolean, default: false },
  googleCalendarTokens: {
    accessToken: { type: String, required: false },
    refreshToken: { type: String, required: false },
    expiryDate: { type: Date, required: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.model("User", UserSchema);

// Room Schema
const RoomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  roomType: { type: String, required: true, enum: ["Standard", "Deluxe", "Suite", "Presidential"] },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  amenities: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  description: { type: String },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const RoomModel = mongoose.model("Room", RoomSchema);

// Booking Schema
const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  numberOfGuests: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "checked-in", "checked-out", "cancelled"], 
    default: "pending" 
  },
  specialRequests: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "refunded"], 
    default: "pending" 
  },
  adminNotes: { type: String },
  googleCalendarEventId: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BookingModel = mongoose.model("Booking", BookingSchema);

// -------------------- ROUTES --------------------

// Root
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// Test email endpoint
app.post("/test-email", async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) {
      return res
        .status(400)
        .json({ message: "to, subject and html are required" });
    }

    await sendEmail(to, subject, html);
    return res.status(200).json({ message: "Email sent" });
  } catch (error) {
    console.error("sendEmail error:", error);
    return res.status(500).json({ message: "Failed to send email" });
  }
});

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

// SIGNUP
app.post("/signup", async (req, res) => {
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

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, req.ip);
      if (!isRecaptchaValid) {
        return res.status(400).json({ message: "reCAPTCHA verification failed" });
      }
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
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
    const subject = "Your WebProj verification code";
    const html = `
      <div style="background:#f6f8fb;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          <tr>
            <td style="padding:20px 24px;background:#0ea5e9;color:#ffffff;">
              <h1 style="margin:0;font-size:18px;">WebProj</h1>
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
              © ${new Date().getFullYear()} WebProj
            </td>
          </tr>
        </table>
      </div>
    `;

    await sendEmail(email, subject, html);

    res.status(200).json({ 
      message: "Verification code sent to your email. Please check your inbox and verify your account.",
      email: email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// VERIFY EMAIL CODE
app.post("/verify-email", async (req, res) => {
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

    // Create the user account
    const hashedPassword = await bcrypt.hash(pending.password, 10);
    const newUser = new UserModel({
      username: pending.username,
      email: pending.email,
      password: hashedPassword,
      firstName: pending.firstName,
      lastName: pending.lastName,
      phoneNumber: pending.phoneNumber,
      dateOfBirth: pending.dateOfBirth ? new Date(pending.dateOfBirth) : undefined,
      address: pending.address,
      isEmailVerified: true,
    });

    const savedUser = await newUser.save();
    
    // Clean up pending verification
    pendingVerifications.delete(email);

    res.status(201).json({ 
      message: "Email verified and account created successfully", 
      data: { username: savedUser.username, email: savedUser.email, role: savedUser.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, req.ip);
      if (!isRecaptchaValid) {
        return res.status(400).json({ message: "reCAPTCHA verification failed" });
      }
    }

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn } as SignOptions);
    res
      .cookie("auth", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
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
});

// RESET PASSWORD
app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body as {
      email?: string;
      newPassword?: string;
    };

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "email and newPassword are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GOOGLE LOGIN
app.post("/google-login", async (req, res) => {
  try {
    console.log("Google login attempt received");
    
    if (!googleClient || !googleClientId) {
      console.error("Google auth not configured - missing client or clientId");
      return res.status(500).json({ 
        message: "Google auth not configured",
        details: "GOOGLE_CLIENT_ID environment variable is missing or invalid"
      });
    }

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

    let user = await UserModel.findOne({ email });
    if (!user) {
      console.log("Creating new user for Google account:", email);
      
      // Create user without password for Google accounts (no username for now)
      user = new UserModel({ 
        username: undefined, // Leave username blank for Google OAuth users
        email, 
        password: await bcrypt.hash("google_oauth_placeholder", 10),
        firstName: payload.given_name || email.split("@")[0],
        lastName: payload.family_name || "",
        isEmailVerified: true
      });
      
      await user.save();
      console.log("New user created with email:", user.email);
    } else {
      console.log("Existing user found:", user.email);
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn } as SignOptions);
    
    console.log("Google login successful for user:", user.email);
    
    return res
      .cookie("auth", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
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
});

// Auth middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.cookies?.auth as string | undefined;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const payload = jwt.verify(token, jwtSecret) as { sub: string; email: string; role?: string };
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Current user
app.get("/me", requireAuth, async (req, res) => {
  const payload = (req as any).user as { sub: string; email: string };
  const user = await UserModel.findById(payload.sub).select("username email role");
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  return res.json({ data: { username: user.username, email: user.email, role: user.role } });
});

// Get user profile (detailed information)
app.get("/profile", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string };
    const user = await UserModel.findById(payload.sub).select("-password -googleCalendarTokens");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    return res.json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
app.put("/profile", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string };
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      dateOfBirth, 
      address 
    } = req.body;

    const user = await UserModel.findById(payload.sub);
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
    const updatedUser = await UserModel.findById(payload.sub).select("-password -googleCalendarTokens");
    return res.json({ 
      message: "Profile updated successfully", 
      data: updatedUser 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
app.put("/profile/password", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string };
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    const user = await UserModel.findById(payload.sub);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
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
});

// Promote user to admin (for development/testing)
app.post("/promote-to-admin", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = "admin";
    await user.save();

    res.json({ 
      message: "User promoted to admin successfully", 
      data: { username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users (admin only)
app.get("/users", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const users = await UserModel.find({}).select("username email role createdAt");
    res.json({ data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// SET USERNAME (for Google OAuth users)
app.post("/set-username", requireAuth, async (req, res) => {
  try {
    const { username } = req.body;
    const payload = (req as any).user as { sub: string; email: string };

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
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Update the current user's username
    const user = await UserModel.findById(payload.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.username = username;
    await user.save();

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
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("auth", { httpOnly: true, secure: false, sameSite: "lax" }).json({ message: "Logged out" });
});

// -------------------- BOOKING ROUTES --------------------

// Get all bookings (admin only)
app.get("/bookings", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const bookings = await BookingModel.find({})
      .populate("user", "username email firstName lastName")
      .populate("room", "roomNumber roomType price")
      .sort({ createdAt: -1 });

    res.json({ data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get bookings for a specific user
app.get("/user-bookings", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string };
    
    const bookings = await BookingModel.find({ user: payload.sub })
      .populate("room", "roomNumber roomType price")
      .sort({ createdAt: -1 });

    res.json({ data: bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new booking
app.post("/bookings", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string };
    const { roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

    if (!roomId || !checkInDate || !checkOutDate || !numberOfGuests) {
      return res.status(400).json({ message: "Room ID, check-in date, check-out date, and number of guests are required" });
    }

    // Check if room exists and is available
    const room = await RoomModel.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.isAvailable) {
      return res.status(400).json({ message: "Room is not available" });
    }

    // Check for date conflicts
    const conflictingBooking = await BookingModel.findOne({
      room: roomId,
      status: { $in: ["confirmed", "checked-in"] },
      $or: [
        {
          checkInDate: { $lte: new Date(checkOutDate) },
          checkOutDate: { $gte: new Date(checkInDate) }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: "Room is not available for the selected dates" });
    }

    // Calculate total amount
    const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = room.price * nights;

    const booking = new BookingModel({
      user: payload.sub,
      room: roomId,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      numberOfGuests,
      totalAmount,
      specialRequests
    });

    const savedBooking = await booking.save();
    await savedBooking.populate("room", "roomNumber roomType price");

    res.status(201).json({ 
      message: "Booking created successfully", 
      data: savedBooking 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update booking status (admin only)
app.put("/bookings/:id/status", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status, adminNotes } = req.body;
    const bookingId = req.params.id;

    if (!status || !["pending", "confirmed", "checked-in", "checked-out", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;
    if (adminNotes) {
      booking.adminNotes = adminNotes;
    }
    booking.updatedAt = new Date();

    await booking.save();
    await booking.populate("user", "username email firstName lastName");
    await booking.populate("room", "roomNumber roomType price");

    res.json({ 
      message: "Booking status updated successfully", 
      data: booking 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Check-in/Check-out booking
app.put("/bookings/:id/checkin", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const bookingId = req.params.id;
    const booking = await BookingModel.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Only confirmed bookings can be checked in" });
    }

    booking.status = "checked-in";
    booking.updatedAt = new Date();

    await booking.save();
    await booking.populate("user", "username email firstName lastName");
    await booking.populate("room", "roomNumber roomType price");

    res.json({ 
      message: "Guest checked in successfully", 
      data: booking 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/bookings/:id/checkout", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const bookingId = req.params.id;
    const booking = await BookingModel.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "checked-in") {
      return res.status(400).json({ message: "Only checked-in bookings can be checked out" });
    }

    booking.status = "checked-out";
    booking.updatedAt = new Date();

    await booking.save();
    await booking.populate("user", "username email firstName lastName");
    await booking.populate("room", "roomNumber roomType price");

    res.json({ 
      message: "Guest checked out successfully", 
      data: booking 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- ROOM ROUTES --------------------

// Get all rooms
app.get("/rooms", async (req, res) => {
  try {
    const rooms = await RoomModel.find({ isAvailable: true });
    res.json({ data: rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get room availability for a specific date range or single date
app.get("/rooms/availability", async (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;
    
    // Handle single date request
    if (date) {
      const targetDate = new Date(date as string);
      const start = new Date(targetDate);
      const end = new Date(targetDate);
      end.setDate(end.getDate() + 1); // Next day to check availability
      
      // Get all rooms
      const rooms = await RoomModel.find({ isAvailable: true });

      // Get bookings that overlap with the target date
      const bookings = await BookingModel.find({
        status: { $in: ["confirmed", "checked-in"] },
        $or: [
          {
            checkInDate: { $lte: end },
            checkOutDate: { $gte: start }
          }
        ]
      }).populate("room", "roomNumber roomType").populate("user", "firstName lastName");

      // Create availability data for the specific date
      const availability = rooms.map(room => {
        const roomBookings = bookings.filter(booking => 
          booking.room._id.toString() === room._id.toString()
        );

        const isAvailable = roomBookings.length === 0;
        const booking = roomBookings.length > 0 ? roomBookings[0] : null;

        return {
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          isAvailable,
          booking: booking ? {
            guestName: `${(booking.user as any).firstName} ${(booking.user as any).lastName}`,
            status: booking.status,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate
          } : null
        };
      });

      return res.json({ 
        success: true, 
        data: availability,
        date: targetDate.toISOString().split('T')[0]
      });
    }
    
    // Handle date range request (existing functionality)
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required, or provide a single date parameter" });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get all rooms
    const rooms = await RoomModel.find({ isAvailable: true });

    // Get bookings that overlap with the date range
    const bookings = await BookingModel.find({
      status: { $in: ["confirmed", "checked-in"] },
      $or: [
        {
          checkInDate: { $lte: end },
          checkOutDate: { $gte: start }
        }
      ]
    }).populate("room", "roomNumber roomType");

    // Create availability map
    const availability = rooms.map(room => {
      const roomBookings = bookings.filter(booking => 
        booking.room._id.toString() === room._id.toString()
      );

      return {
        room: {
          _id: room._id,
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          price: room.price,
          capacity: room.capacity,
          amenities: room.amenities,
          description: room.description
        },
        isAvailable: roomBookings.length === 0,
        bookings: roomBookings.map(booking => ({
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          status: booking.status
        }))
      };
    });

    res.json({ data: availability });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get room availability calendar data
app.get("/rooms/calendar", async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const monthNum = parseInt(month as string);
    const yearNum = parseInt(year as string);
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    // Get all rooms
    const rooms = await RoomModel.find({ isAvailable: true });

    // Get bookings for the month
    const bookings = await BookingModel.find({
      status: { $in: ["confirmed", "checked-in"] },
      $or: [
        {
          checkInDate: { $lte: endDate },
          checkOutDate: { $gte: startDate }
        }
      ]
    }).populate("room", "roomNumber roomType");

    // Create calendar data
    const calendarData = [];
    const daysInMonth = endDate.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(yearNum, monthNum - 1, day);
      const dayData = {
        date: currentDate,
        day: day,
        rooms: rooms.map(room => {
          const roomBookings = bookings.filter(booking => 
            booking.room._id.toString() === room._id.toString() &&
            currentDate >= new Date(booking.checkInDate) &&
            currentDate < new Date(booking.checkOutDate)
          );

          return {
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            isAvailable: roomBookings.length === 0,
            booking: roomBookings.length > 0 ? roomBookings[0] : null
          };
        })
      };
      calendarData.push(dayData);
    }

    res.json({ data: calendarData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Google Calendar API endpoints

// Get Google Calendar authorization URL
app.get("/google-calendar/auth-url", requireAuth, async (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ authUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Handle Google Calendar OAuth callback
app.post("/google-calendar/callback", requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (!code) {
      return res.status(400).json({ message: "Authorization code is required" });
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens to user
    await UserModel.findByIdAndUpdate(payload.sub, {
      googleCalendarTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });

    res.json({ message: "Google Calendar connected successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's Google Calendar events
app.get("/google-calendar/events", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    const user = await UserModel.findById(payload.sub);
    
    if (!user || !user.googleCalendarTokens?.accessToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    // Set credentials from stored tokens
    oauth2Client.setCredentials({
      access_token: user.googleCalendarTokens.accessToken,
      refresh_token: user.googleCalendarTokens.refreshToken,
      expiry_date: user.googleCalendarTokens.expiryDate?.getTime()
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const { timeMin, timeMax, maxResults = 10 } = req.query;
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin as string || new Date().toISOString(),
      timeMax: timeMax as string,
      maxResults: parseInt(maxResults as string),
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json({ events: response.data.items || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create Google Calendar event for booking
app.post("/google-calendar/create-event", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    const { bookingId, title, description, startTime, endTime, roomNumber } = req.body;
    
    const user = await UserModel.findById(payload.sub);
    
    if (!user || !user.googleCalendarTokens?.accessToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    // Set credentials from stored tokens
    oauth2Client.setCredentials({
      access_token: user.googleCalendarTokens.accessToken,
      refresh_token: user.googleCalendarTokens.refreshToken,
      expiry_date: user.googleCalendarTokens.expiryDate?.getTime()
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: title || `Hotel Booking - Room ${roomNumber}`,
      description: description || `Hotel booking for Room ${roomNumber}`,
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Update booking with Google Calendar event ID
    if (bookingId) {
      await BookingModel.findByIdAndUpdate(bookingId, {
        googleCalendarEventId: response.data.id
      });
    }

    res.json({ 
      message: "Event created successfully", 
      eventId: response.data.id,
      event: response.data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Sync booking with Google Calendar
app.post("/google-calendar/sync-booking/:bookingId", requireAuth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    const booking = await BookingModel.findById(bookingId)
      .populate('room', 'roomNumber roomType')
      .populate('user', 'firstName lastName email');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const user = await UserModel.findById(payload.sub);
    
    if (!user || !user.googleCalendarTokens?.accessToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    // Set credentials from stored tokens
    oauth2Client.setCredentials({
      access_token: user.googleCalendarTokens.accessToken,
      refresh_token: user.googleCalendarTokens.refreshToken,
      expiry_date: user.googleCalendarTokens.expiryDate?.getTime()
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: `Hotel Booking - Room ${(booking.room as any).roomNumber}`,
      description: `Hotel booking for ${(booking.room as any).roomType} room ${(booking.room as any).roomNumber}\nGuest: ${(booking.user as any).firstName} ${(booking.user as any).lastName}\nStatus: ${booking.status}`,
      start: {
        dateTime: booking.checkInDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: booking.checkOutDate.toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Update booking with Google Calendar event ID
    await BookingModel.findByIdAndUpdate(bookingId, {
      googleCalendarEventId: response.data.id
    });

    res.json({ 
      message: "Booking synced with Google Calendar", 
      eventId: response.data.id,
      event: response.data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new room (admin only)
app.post("/rooms", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { 
      roomNumber, 
      roomType, 
      price, 
      capacity, 
      amenities, 
      description, 
      images 
    } = req.body;

    // Validate required fields
    if (!roomNumber || !roomType || !price || !capacity) {
      return res.status(400).json({ 
        message: "Room number, type, price, and capacity are required" 
      });
    }

    // Validate room type
    const validRoomTypes = ["Standard", "Deluxe", "Suite", "Presidential"];
    if (!validRoomTypes.includes(roomType)) {
      return res.status(400).json({ 
        message: "Invalid room type. Must be one of: " + validRoomTypes.join(", ") 
      });
    }

    // Check if room number already exists
    const existingRoom = await RoomModel.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: "Room number already exists" });
    }

    // Validate price and capacity
    if (price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    if (capacity <= 0) {
      return res.status(400).json({ message: "Capacity must be greater than 0" });
    }

    // Create new room
    const newRoom = new RoomModel({
      roomNumber,
      roomType,
      price,
      capacity,
      amenities: amenities || [],
      description: description || "",
      images: images || [],
      isAvailable: true
    });

    const savedRoom = await newRoom.save();

    res.status(201).json({ 
      message: "Room created successfully", 
      data: savedRoom 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a room (admin only)
app.put("/rooms/:id", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const roomId = req.params.id;
    const { 
      roomNumber, 
      roomType, 
      price, 
      capacity, 
      amenities, 
      description, 
      images,
      isAvailable 
    } = req.body;

    const room = await RoomModel.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Validate room type if provided
    if (roomType) {
      const validRoomTypes = ["Standard", "Deluxe", "Suite", "Presidential"];
      if (!validRoomTypes.includes(roomType)) {
        return res.status(400).json({ 
          message: "Invalid room type. Must be one of: " + validRoomTypes.join(", ") 
        });
      }
    }

    // Check if room number already exists (if changing room number)
    if (roomNumber && roomNumber !== room.roomNumber) {
      const existingRoom = await RoomModel.findOne({ roomNumber });
      if (existingRoom) {
        return res.status(400).json({ message: "Room number already exists" });
      }
    }

    // Update room fields
    if (roomNumber) room.roomNumber = roomNumber;
    if (roomType) room.roomType = roomType;
    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({ message: "Price must be greater than 0" });
      }
      room.price = price;
    }
    if (capacity !== undefined) {
      if (capacity <= 0) {
        return res.status(400).json({ message: "Capacity must be greater than 0" });
      }
      room.capacity = capacity;
    }
    if (amenities !== undefined) room.amenities = amenities;
    if (description !== undefined) room.description = description;
    if (images !== undefined) room.images = images;
    if (isAvailable !== undefined) room.isAvailable = isAvailable;
    
    room.updatedAt = new Date();

    const updatedRoom = await room.save();

    res.json({ 
      message: "Room updated successfully", 
      data: updatedRoom 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a room (admin only)
app.delete("/rooms/:id", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const roomId = req.params.id;
    const room = await RoomModel.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if room has any bookings
    const existingBookings = await BookingModel.find({ 
      room: roomId,
      status: { $in: ["confirmed", "checked-in"] }
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete room with active bookings. Please cancel bookings first." 
      });
    }

    await RoomModel.findByIdAndDelete(roomId);

    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all rooms (admin only - includes unavailable rooms)
app.get("/admin/rooms", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const rooms = await RoomModel.find({}).sort({ roomNumber: 1 });
    res.json({ data: rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create sample rooms (admin only)
app.post("/rooms/sample", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const sampleRooms = [
      {
        roomNumber: "101",
        roomType: "Standard",
        price: 100,
        capacity: 2,
        amenities: ["WiFi", "TV", "Air Conditioning"],
        description: "Comfortable standard room with basic amenities"
      },
      {
        roomNumber: "201",
        roomType: "Deluxe",
        price: 150,
        capacity: 3,
        amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar", "Balcony"],
        description: "Spacious deluxe room with premium amenities"
      },
      {
        roomNumber: "301",
        roomType: "Suite",
        price: 250,
        capacity: 4,
        amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar", "Balcony", "Jacuzzi"],
        description: "Luxurious suite with all premium amenities"
      },
      {
        roomNumber: "401",
        roomType: "Presidential",
        price: 500,
        capacity: 6,
        amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar", "Balcony", "Jacuzzi", "Butler Service"],
        description: "Presidential suite with exclusive amenities and services"
      }
    ];

    const createdRooms = await RoomModel.insertMany(sampleRooms);
    res.status(201).json({ 
      message: "Sample rooms created successfully", 
      data: createdRooms 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- REPORT ROUTES --------------------

// Get occupancy report (admin only)
app.get("/reports/occupancy", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { startDate, endDate, period = 'month' } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = {
        createdAt: { $gte: thirtyDaysAgo }
      };
    }

    // Get total rooms
    const totalRooms = await RoomModel.countDocuments({ isAvailable: true });
    
    // Get bookings for the period
    const bookings = await BookingModel.find({
      ...dateFilter,
      status: { $in: ["confirmed", "checked-in", "checked-out"] }
    }).populate("room", "roomNumber roomType");

    // Calculate occupancy metrics
    const totalBookings = bookings.length;
    const totalRoomNights = bookings.reduce((sum, booking) => {
      const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
      return sum + nights;
    }, 0);

    const daysInPeriod = startDate && endDate 
      ? Math.ceil((new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    const totalPossibleRoomNights = totalRooms * daysInPeriod;
    const occupancyRate = totalPossibleRoomNights > 0 ? (totalRoomNights / totalPossibleRoomNights) * 100 : 0;

    // Room type breakdown
    const roomTypeStats: { [key: string]: { bookings: number; revenue: number } } = {};
    bookings.forEach(booking => {
      const roomType = (booking.room as any).roomType;
      if (!roomTypeStats[roomType]) {
        roomTypeStats[roomType] = { bookings: 0, revenue: 0 };
      }
      roomTypeStats[roomType].bookings++;
      roomTypeStats[roomType].revenue += booking.totalAmount;
    });

    // Daily occupancy for the period
    const dailyOccupancy = [];
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayBookings = await BookingModel.find({
        status: { $in: ["confirmed", "checked-in", "checked-out"] },
        $or: [
          {
            checkInDate: { $lt: dayEnd },
            checkOutDate: { $gt: dayStart }
          }
        ]
      }).populate("room", "roomNumber roomType");

      const occupiedRooms = new Set(dayBookings.map(b => b.room._id.toString())).size;
      const dayOccupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      dailyOccupancy.push({
        date: dayStart.toISOString().split('T')[0],
        occupiedRooms,
        totalRooms,
        occupancyRate: dayOccupancyRate
      });
    }

    res.json({
      data: {
        summary: {
          totalRooms,
          totalBookings,
          totalRoomNights,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          period: {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            days: daysInPeriod
          }
        },
        roomTypeBreakdown: roomTypeStats,
        dailyOccupancy
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get revenue report (admin only)
app.get("/reports/revenue", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { startDate, endDate, period = 'month' } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = {
        createdAt: { $gte: thirtyDaysAgo }
      };
    }

    // Get all bookings for the period
    const bookings = await BookingModel.find({
      ...dateFilter,
      status: { $in: ["confirmed", "checked-in", "checked-out"] }
    }).populate("room", "roomNumber roomType price").populate("user", "firstName lastName email");

    // Calculate revenue metrics
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const totalBookings = bookings.length;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Revenue by room type
    const revenueByRoomType: { [key: string]: { revenue: number; bookings: number } } = {};
    bookings.forEach(booking => {
      const roomType = (booking.room as any).roomType;
      if (!revenueByRoomType[roomType]) {
        revenueByRoomType[roomType] = { revenue: 0, bookings: 0 };
      }
      revenueByRoomType[roomType].revenue += booking.totalAmount;
      revenueByRoomType[roomType].bookings++;
    });

    // Payment status breakdown
    const paymentStatusBreakdown = {
      paid: bookings.filter(b => b.paymentStatus === 'paid').length,
      pending: bookings.filter(b => b.paymentStatus === 'pending').length,
      refunded: bookings.filter(b => b.paymentStatus === 'refunded').length
    };

    // Daily revenue for the period
    const dailyRevenue = [];
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayBookings = await BookingModel.find({
        createdAt: {
          $gte: dayStart,
          $lt: dayEnd
        },
        status: { $in: ["confirmed", "checked-in", "checked-out"] }
      });

      const dayRevenue = dayBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      
      dailyRevenue.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue,
        bookings: dayBookings.length
      });
    }

    // Top customers by revenue
    const customerRevenue: { [key: string]: { name: string; email: string; totalSpent: number; bookings: number } } = {};
    bookings.forEach(booking => {
      const customerId = booking.user._id.toString();
      const customerName = `${(booking.user as any).firstName} ${(booking.user as any).lastName}`;
      if (!customerRevenue[customerId]) {
        customerRevenue[customerId] = {
          name: customerName,
          email: (booking.user as any).email,
          totalSpent: 0,
          bookings: 0
        };
      }
      customerRevenue[customerId].totalSpent += booking.totalAmount;
      customerRevenue[customerId].bookings++;
    });

    const topCustomers = Object.values(customerRevenue)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.json({
      data: {
        summary: {
          totalRevenue,
          totalBookings,
          averageBookingValue: Math.round(averageBookingValue * 100) / 100,
          period: {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
          }
        },
        revenueByRoomType,
        paymentStatusBreakdown,
        dailyRevenue,
        topCustomers
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get booking analytics report (admin only)
app.get("/reports/bookings", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { startDate, endDate, period = 'month' } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = {
        createdAt: { $gte: thirtyDaysAgo }
      };
    }

    // Get all bookings for the period
    const bookings = await BookingModel.find(dateFilter)
      .populate("room", "roomNumber roomType price")
      .populate("user", "firstName lastName email");

    // Booking status breakdown
    const statusBreakdown = {
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      'checked-in': bookings.filter(b => b.status === 'checked-in').length,
      'checked-out': bookings.filter(b => b.status === 'checked-out').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    };

    // Booking trends over time
    const bookingTrends = [];
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayBookings = await BookingModel.find({
        createdAt: {
          $gte: dayStart,
          $lt: dayEnd
        }
      });

      const dayStatusBreakdown = {
        pending: dayBookings.filter(b => b.status === 'pending').length,
        confirmed: dayBookings.filter(b => b.status === 'confirmed').length,
        'checked-in': dayBookings.filter(b => b.status === 'checked-in').length,
        'checked-out': dayBookings.filter(b => b.status === 'checked-out').length,
        cancelled: dayBookings.filter(b => b.status === 'cancelled').length
      };

      bookingTrends.push({
        date: dayStart.toISOString().split('T')[0],
        totalBookings: dayBookings.length,
        ...dayStatusBreakdown
      });
    }

    // Average booking duration
    const bookingDurations = bookings.map(booking => {
      const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
      return nights;
    });

    const averageDuration = bookingDurations.length > 0 
      ? bookingDurations.reduce((sum, duration) => sum + duration, 0) / bookingDurations.length 
      : 0;

    // Most popular room types
    const roomTypePopularity: { [key: string]: number } = {};
    bookings.forEach(booking => {
      const roomType = (booking.room as any).roomType;
      if (!roomTypePopularity[roomType]) {
        roomTypePopularity[roomType] = 0;
      }
      roomTypePopularity[roomType]++;
    });

    // Booking source analysis (if you have source tracking)
    const bookingSources = {
      direct: bookings.filter(b => !b.googleCalendarEventId).length,
      google_calendar: bookings.filter(b => b.googleCalendarEventId).length
    };

    // Guest demographics
    const guestStats = {
      totalGuests: new Set(bookings.map(b => b.user._id.toString())).size,
      repeatGuests: 0, // Would need to calculate based on multiple bookings
      newGuests: 0
    };

    res.json({
      data: {
        summary: {
          totalBookings: bookings.length,
          averageDuration: Math.round(averageDuration * 100) / 100,
          period: {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
          }
        },
        statusBreakdown,
        bookingTrends,
        roomTypePopularity,
        bookingSources,
        guestStats
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get comprehensive dashboard report (admin only)
app.get("/reports/dashboard", requireAuth, async (req, res) => {
  try {
    const payload = (req as any).user as { sub: string; email: string; role?: string };
    
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get current stats
    const totalRooms = await RoomModel.countDocuments({ isAvailable: true });
    const totalUsers = await UserModel.countDocuments();
    const totalBookings = await BookingModel.countDocuments();
    
    // Active bookings (confirmed or checked-in)
    const activeBookings = await BookingModel.countDocuments({
      status: { $in: ["confirmed", "checked-in"] }
    });

    // Today's check-ins and check-outs
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todaysCheckIns = await BookingModel.countDocuments({
      checkInDate: { $gte: todayStart, $lte: todayEnd },
      status: "confirmed"
    });

    const todaysCheckOuts = await BookingModel.countDocuments({
      checkOutDate: { $gte: todayStart, $lte: todayEnd },
      status: "checked-in"
    });

    // Recent bookings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentBookings = await BookingModel.find({
      createdAt: { $gte: sevenDaysAgo }
    }).populate("user", "firstName lastName").populate("room", "roomNumber roomType");

    // Revenue this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthlyBookings = await BookingModel.find({
      createdAt: { $gte: monthStart },
      status: { $in: ["confirmed", "checked-in", "checked-out"] }
    });

    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    res.json({
      data: {
        overview: {
          totalRooms,
          totalUsers,
          totalBookings,
          activeBookings,
          monthlyRevenue
        },
        today: {
          checkIns: todaysCheckIns,
          checkOuts: todaysCheckOuts
        },
        recentBookings: recentBookings.slice(0, 5).map(booking => ({
          id: booking._id,
          guestName: `${(booking.user as any).firstName} ${(booking.user as any).lastName}`,
          roomNumber: (booking.room as any).roomNumber,
          roomType: (booking.room as any).roomType,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          status: booking.status,
          totalAmount: booking.totalAmount
        }))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
