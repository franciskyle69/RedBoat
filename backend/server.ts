import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import roomRoutes from "./routes/roomRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import reportRoutes from "./routes/reportRoutes";
import googleCalendarRoutes from "./routes/googleCalendarRoutes";
import notificationRoutes from "./routes/notificationRoutes";

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(cors({ 
  origin: [clientOrigin, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// API Routes
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/rooms", roomRoutes);
app.use("/bookings", bookingRoutes);
app.use("/reports", reportRoutes);
app.use("/google-calendar", googleCalendarRoutes);
app.use("/notifications", notificationRoutes);

// Test email endpoint (keeping for backward compatibility)
app.post("/test-email", async (req, res) => {
  try {
    const { sendEmail } = await import("./emailService");
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

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});