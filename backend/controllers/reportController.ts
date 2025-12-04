import { Response } from 'express';
import { Booking } from '../models/Booking';
import { Room } from '../models/Room';
import { User } from '../models/User';
import { PDFService } from '../services/pdfService';
import { AuthenticatedRequest } from '../middleware/auth';

const pdfService = PDFService.getInstance();

export class ReportController {
  // Get occupancy report (admin only)
  static async getOccupancyReport(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
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
      const totalRooms = await Room.countDocuments({ isAvailable: true });
      
      // Get bookings for the period
      const bookings = await Booking.find({
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
        
        const dayBookings = await Booking.find({
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
      console.error('[PDF][occupancy] generation failed:', err);
      res.status(500).json({ 
        message: "Failed to generate occupancy PDF",
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }

  // Get revenue report (admin only)
  static async getRevenueReport(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
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
      const bookings = await Booking.find({
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
        
        const dayBookings = await Booking.find({
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
      console.error('[PDF][occupancy] generation failed:', err);
      res.status(500).json({ 
        message: 'Failed to generate occupancy PDF',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }

  // Get booking analytics report (admin only)
  static async getBookingAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
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
      const bookings = await Booking.find(dateFilter)
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
        
        const dayBookings = await Booking.find({
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
  }

  // Get comprehensive dashboard report (admin only)
  static async getDashboardReport(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get current stats
      const totalRooms = await Room.countDocuments({});
      const totalUsers = await User.countDocuments();
      const totalBookings = await Booking.countDocuments();

      // Today's check-ins and check-outs
      const today = new Date();
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todaysCheckIns = await Booking.countDocuments({
        checkInDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["confirmed", "checked-in"] }
      });

      const todaysCheckOuts = await Booking.countDocuments({
        checkOutDate: { $gte: todayStart, $lte: todayEnd },
        status: "checked-in"
      });

      // Compute currently occupied rooms (bookings overlapping today)
      const occupiedToday = await Booking.countDocuments({
        status: { $in: ["confirmed", "checked-in"] },
        checkInDate: { $lte: todayEnd },
        checkOutDate: { $gte: todayStart }
      });

      // Rooms needing cleaning (dirty)
      const roomsNeedingCleaning = await Room.countDocuments({ housekeepingStatus: 'dirty' });

      // Recent bookings (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentBookings = await Booking.find({
        createdAt: { $gte: sevenDaysAgo }
      }).populate("user", "firstName lastName").populate("room", "roomNumber roomType");

      // Revenue this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthlyBookings = await Booking.find({
        createdAt: { $gte: monthStart },
        status: { $in: ["confirmed", "checked-in", "checked-out"] }
      });

      const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

      // Revenue today (sum of bookings marked paid today)
      const paidToday = await Booking.find({
        paymentStatus: 'paid',
        updatedAt: { $gte: todayStart, $lte: todayEnd }
      }).select('totalAmount');
      const revenueToday = paidToday.reduce((sum, b) => sum + b.totalAmount, 0);

      res.json({
        data: {
          overview: {
            totalRooms,
            totalUsers,
            totalBookings,
            occupiedToday,
            roomsNeedingCleaning,
            monthlyRevenue,
            revenueToday
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
  }

  // Generate PDF for occupancy report
  static async generateOccupancyPDF(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Get the same data as the regular occupancy report
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const rooms = await Room.find({ isAvailable: true });
      const bookings = await Booking.find({
        $or: [
          { checkInDate: { $gte: start, $lte: end } },
          { checkOutDate: { $gte: start, $lte: end } },
          { checkInDate: { $lte: start }, checkOutDate: { $gte: end } }
        ]
      }).populate("user", "firstName lastName").populate("room", "roomNumber roomType price");

      const totalRooms = rooms.length;
      const totalBookings = bookings.length;
      const totalRoomNights = bookings.reduce((sum, booking) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }, 0);

      const occupancyRate = totalRooms > 0 ? ((totalRoomNights / (totalRooms * Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))) * 100).toFixed(1) : 0;

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

      // Daily occupancy
      const dailyOccupancy = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const dayBookings = await Booking.find({
          $or: [
            { checkInDate: { $gte: dayStart, $lte: dayEnd } },
            { checkOutDate: { $gte: dayStart, $lte: dayEnd } },
            { checkInDate: { $lte: dayStart }, checkOutDate: { $gte: dayEnd } }
          ]
        });

        const occupiedRooms = new Set(dayBookings.map(booking => booking.room.toString())).size;
        const dayOccupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

        dailyOccupancy.push({
          date: d.toISOString().split('T')[0],
          occupiedRooms,
          totalRooms,
          occupancyRate: parseFloat(String(dayOccupancyRate))
        });
      }

      const reportData = {
        summary: {
          totalRooms,
          totalBookings,
          totalRoomNights,
          occupancyRate: parseFloat(String(occupancyRate))
        },
        roomTypeBreakdown: roomTypeStats,
        dailyOccupancy
      };

      const pdfBuffer = await pdfService.generateReportPDF('occupancy', reportData, {
        startDate: String(startDate),
        endDate: String(endDate)
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="occupancy-report-${String(startDate)}-to-${String(endDate)}.pdf"`);
      res.send(pdfBuffer);

    } catch (err) {
      console.error('[PDF][occupancy] generation failed:', err);
      res.status(500).json({ 
        message: 'Failed to generate occupancy PDF',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }

  // Generate PDF for revenue report
  static async generateRevenuePDF(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Get the same data as the regular revenue report
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const bookings = await Booking.find({
        createdAt: { $gte: start, $lte: end }
      }).populate("user", "firstName lastName email").populate("room", "roomNumber roomType price");

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

      // Top customers
      const customerRevenue: { [key: string]: { name: string; email: string; totalSpent: number; bookings: number } } = {};
      bookings.forEach(booking => {
        const userId = booking.user._id.toString();
        if (!customerRevenue[userId]) {
          customerRevenue[userId] = {
            name: `${(booking.user as any).firstName} ${(booking.user as any).lastName}`,
            email: (booking.user as any).email,
            totalSpent: 0,
            bookings: 0
          };
        }
        customerRevenue[userId].totalSpent += booking.totalAmount;
        customerRevenue[userId].bookings++;
      });

      const topCustomers = Object.values(customerRevenue)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      const reportData = {
        summary: {
          totalRevenue,
          totalBookings,
          averageBookingValue
        },
        revenueByRoomType,
        paymentStatusBreakdown,
        topCustomers
      };

      const pdfBuffer = await pdfService.generateReportPDF('revenue', reportData, {
        startDate: String(startDate),
        endDate: String(endDate)
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="revenue-report-${String(startDate)}-to-${String(endDate)}.pdf"`);
      res.send(pdfBuffer);

    } catch (err) {
      console.error('[PDF][revenue] generation failed:', err);
      res.status(500).json({ 
        message: 'Failed to generate revenue PDF',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }

  // Generate PDF for bookings report
  static async generateBookingsPDF(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== "admin" && payload.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Get the same data as the regular bookings report
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      const bookings = await Booking.find({
        createdAt: { $gte: start, $lte: end }
      }).populate("user", "firstName lastName").populate("room", "roomNumber roomType");

      const totalBookings = bookings.length;
      const totalDuration = bookings.reduce((sum, booking) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      const averageDuration = totalBookings > 0 ? (totalDuration / totalBookings).toFixed(1) : 0;

      // Status breakdown
      const statusBreakdown: { [key: string]: number } = {};
      bookings.forEach(booking => {
        statusBreakdown[booking.status] = (statusBreakdown[booking.status] || 0) + 1;
      });

      // Room type popularity
      const roomTypePopularity: { [key: string]: number } = {};
      bookings.forEach(booking => {
        const roomType = (booking.room as any).roomType;
        roomTypePopularity[roomType] = (roomTypePopularity[roomType] || 0) + 1;
      });

      // Booking sources
      const bookingSources = {
        direct: bookings.filter(b => !b.googleCalendarEventId).length,
        google_calendar: bookings.filter(b => b.googleCalendarEventId).length
      };

      const reportData = {
        summary: {
          totalBookings,
          averageDuration: parseFloat(String(averageDuration))
        },
        statusBreakdown,
        roomTypePopularity,
        bookingSources
      };

      const pdfBuffer = await pdfService.generateReportPDF('bookings', reportData, {
        startDate: String(startDate),
        endDate: String(endDate)
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bookings-report-${String(startDate)}-to-${String(endDate)}.pdf"`);
      res.send(pdfBuffer);

    } catch (err) {
      console.error('[PDF][bookings] generation failed:', err);
      res.status(500).json({ 
        message: 'Failed to generate bookings PDF',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }
}
