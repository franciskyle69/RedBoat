import { Response } from 'express';
import { Room } from '../models/Room';
import { Booking } from '../models/Booking';
import { AuthenticatedRequest } from '../middleware/auth';

export class RoomController {
  // Get all rooms
  static async getAllRooms(req: any, res: Response) {
    try {
      const rooms = await Room.find({ isAvailable: true });
      res.json({ data: rooms });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get room availability for a specific date range or single date
  static async getRoomAvailability(req: any, res: Response) {
    try {
      const { startDate, endDate, date } = req.query;
      
      // Handle single date request
      if (date) {
        const targetDate = new Date(date as string);
        const start = new Date(targetDate);
        const end = new Date(targetDate);
        end.setDate(end.getDate() + 1); // Next day to check availability
        
        // Get all rooms
        const rooms = await Room.find({ isAvailable: true });

        // Get bookings that overlap with the target date
        const bookings = await Booking.find({
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
            (booking.room as any)._id.toString() === (room._id as any).toString()
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
      const rooms = await Room.find({ isAvailable: true });

      // Get bookings that overlap with the date range
      const bookings = await Booking.find({
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
          (booking.room as any)._id.toString() === (room._id as any).toString()
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
  }

  // Get room availability calendar data
  static async getRoomCalendar(req: any, res: Response) {
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
      const rooms = await Room.find({ isAvailable: true });

      // Get bookings for the month
      const bookings = await Booking.find({
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
              (booking.room as any)._id.toString() === (room._id as any).toString() &&
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
  }

  // Create a new room (admin only)
  static async createRoom(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
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
      const existingRoom = await Room.findOne({ roomNumber });
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
      const newRoom = new Room({
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
  }

  // Update a room (admin only)
  static async updateRoom(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
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

      const room = await Room.findById(roomId);
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
        const existingRoom = await Room.findOne({ roomNumber });
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
  }

  // Delete a room (admin only)
  static async deleteRoom(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const roomId = req.params.id;
      const room = await Room.findById(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Check if room has any bookings
      const existingBookings = await Booking.find({ 
        room: roomId,
        status: { $in: ["confirmed", "checked-in"] }
      });

      if (existingBookings.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete room with active bookings. Please cancel bookings first." 
        });
      }

      await Room.findByIdAndDelete(roomId);

      res.json({ message: "Room deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get all rooms (admin only - includes unavailable rooms)
  static async getAllRoomsAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const rooms = await Room.find({}).sort({ roomNumber: 1 });
      res.json({ data: rooms });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Create sample rooms (admin only)
  static async createSampleRooms(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
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

      const createdRooms = await Room.insertMany(sampleRooms);
      res.status(201).json({ 
        message: "Sample rooms created successfully", 
        data: createdRooms 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}
