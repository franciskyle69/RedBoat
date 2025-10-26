import { Response } from 'express';
import { Booking } from '../models/Booking';
import { Room } from '../models/Room';
import { AuthenticatedRequest } from '../middleware/auth';

export class BookingController {
  // Get all bookings (admin only)
  static async getAllBookings(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookings = await Booking.find({})
        .populate("user", "username email firstName lastName")
        .populate("room", "roomNumber roomType price")
        .sort({ createdAt: -1 });

      res.json({ data: bookings });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get bookings for a specific user
  static async getUserBookings(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      const bookings = await Booking.find({ user: payload.sub })
        .populate("room", "roomNumber roomType price")
        .sort({ createdAt: -1 });

      res.json({ data: bookings });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Create a new booking
  static async createBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      const { roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

      if (!roomId || !checkInDate || !checkOutDate || !numberOfGuests) {
        return res.status(400).json({ message: "Room ID, check-in date, check-out date, and number of guests are required" });
      }

      // Check if room exists and is available
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (!room.isAvailable) {
        return res.status(400).json({ message: "Room is not available" });
      }

      // Check for date conflicts
      const conflictingBooking = await Booking.findOne({
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

      const booking = new Booking({
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
  }

  // Update booking status (admin only)
  static async updateBookingStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status, adminNotes } = req.body;
      const bookingId = req.params.id;

      if (!status || !["pending", "confirmed", "checked-in", "checked-out", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Valid status is required" });
      }

      const booking = await Booking.findById(bookingId);
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
  }

  // Check-in booking
  static async checkInBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = req.params.id;
      const booking = await Booking.findById(bookingId);
      
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
  }

  // Check-out booking
  static async checkOutBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = req.params.id;
      const booking = await Booking.findById(bookingId);
      
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
  }
}
