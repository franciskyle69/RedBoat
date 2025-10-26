export class DataPreprocessor {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private static formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private static calculateDateRange(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  public static preprocessOccupancyData(rawData: any, dateRange: { startDate: string; endDate: string }) {
    const { summary, roomTypeBreakdown, dailyOccupancy } = rawData;
    
    // Calculate insights
    const insights = [];
    if (summary.occupancyRate > 80) {
      insights.push("High occupancy rate indicates strong demand and potential for rate optimization");
    } else if (summary.occupancyRate < 50) {
      insights.push("Low occupancy rate suggests need for marketing and promotional strategies");
    }

    // Process room type breakdown
    const processedRoomTypes = Object.entries(roomTypeBreakdown).map(([roomType, stats]: [string, any]) => {
      const avgRevenuePerBooking = stats.bookings > 0 ? stats.revenue / stats.bookings : 0;
      const totalRevenue = Object.values(roomTypeBreakdown).reduce((sum: number, s: any) => sum + s.revenue, 0);
      const marketShare = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;
      
      return {
        [roomType]: {
          ...stats,
          avgRevenuePerBooking,
          marketShare: marketShare.toFixed(1),
          isTopPerformer: marketShare > 30,
          isLowPerformer: marketShare < 10
        }
      };
    }).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    // Process daily occupancy with trends
    const processedDailyOccupancy = dailyOccupancy.map((day: any, index: number) => {
      const prevDay = index > 0 ? dailyOccupancy[index - 1] : null;
      const trendUp = prevDay && day.occupancyRate > prevDay.occupancyRate;
      const trendDown = prevDay && day.occupancyRate < prevDay.occupancyRate;
      const trendPercentage = prevDay ? 
        Math.abs(((day.occupancyRate - prevDay.occupancyRate) / prevDay.occupancyRate) * 100).toFixed(1) : 0;

      return {
        ...day,
        trendUp,
        trendDown,
        trendPercentage
      };
    });

    return {
      title: "Occupancy Report",
      reportType: "Occupancy Analysis",
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      generatedAt: new Date(),
      generatedBy: "WebProj System",
      dateRange: this.calculateDateRange(dateRange.startDate, dateRange.endDate),
      summary: {
        ...summary,
        occupancyRate: summary.occupancyRate.toFixed(1)
      },
      roomTypeBreakdown: processedRoomTypes,
      dailyOccupancy: processedDailyOccupancy,
      insights,
      helpers: {
        formatCurrency: this.formatCurrency,
        formatDate: this.formatDate,
        formatDateTime: this.formatDateTime
      }
    };
  }

  public static preprocessRevenueData(rawData: any, dateRange: { startDate: string; endDate: string }) {
    const { summary, revenueByRoomType, paymentStatusBreakdown, topCustomers } = rawData;
    
    // Calculate insights
    const insights = [];
    if (summary.averageBookingValue > 200) {
      insights.push("High average booking value indicates premium positioning and strong customer spending");
    }
    if (paymentStatusBreakdown.pending > paymentStatusBreakdown.paid * 0.1) {
      insights.push("High pending payment ratio suggests need for payment follow-up processes");
    }

    // Process revenue by room type
    const totalRevenue = Object.values(revenueByRoomType).reduce((sum: number, r: any) => sum + r.revenue, 0);
    const processedRevenueByRoomType = Object.entries(revenueByRoomType).map(([roomType, stats]: [string, any]) => {
      const avgRevenuePerBooking = stats.bookings > 0 ? stats.revenue / stats.bookings : 0;
      const marketShare = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;
      
      return {
        [roomType]: {
          ...stats,
          avgRevenuePerBooking,
          marketShare: marketShare.toFixed(1)
        }
      };
    }).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    // Process payment status breakdown
    const totalPayments = Object.values(paymentStatusBreakdown).reduce((sum: number, count: any) => sum + count, 0);
    const processedPaymentStatus = Object.entries(paymentStatusBreakdown).map(([status, count]: [string, any]) => {
      const percentage = totalPayments > 0 ? ((count / totalPayments) * 100).toFixed(1) : 0;
      const totalAmount = count * (summary.averageBookingValue || 0); // Estimate
      
      return {
        [status]: {
          count,
          percentage,
          totalAmount,
          isPaid: status === 'paid',
          isPending: status === 'pending'
        }
      };
    }).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    // Process top customers
    const processedTopCustomers = topCustomers.map((customer: any, index: number) => {
      const avgPerBooking = customer.bookings > 0 ? customer.totalSpent / customer.bookings : 0;
      const isHighValue = customer.totalSpent > 1000;
      const isMediumValue = customer.totalSpent > 500 && customer.totalSpent <= 1000;
      
      return {
        ...customer,
        rank: index + 1,
        avgPerBooking,
        isHighValue,
        isMediumValue
      };
    });

    const dateRangeDays = this.calculateDateRange(dateRange.startDate, dateRange.endDate);
    const revenuePerDay = dateRangeDays > 0 ? summary.totalRevenue / dateRangeDays : 0;

    return {
      title: "Revenue Report",
      reportType: "Revenue Analysis",
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      generatedAt: new Date(),
      generatedBy: "WebProj System",
      dateRange: dateRangeDays,
      summary: {
        ...summary,
        revenuePerDay
      },
      revenueByRoomType: processedRevenueByRoomType,
      paymentStatusBreakdown: processedPaymentStatus,
      topCustomers: processedTopCustomers,
      insights,
      helpers: {
        formatCurrency: this.formatCurrency,
        formatDate: this.formatDate,
        formatDateTime: this.formatDateTime
      }
    };
  }

  public static preprocessBookingsData(rawData: any, dateRange: { startDate: string; endDate: string }) {
    const { summary, statusBreakdown, roomTypePopularity, bookingSources } = rawData;
    
    // Calculate insights
    const insights = [];
    if (summary.averageDuration > 3) {
      insights.push("Long average stay duration indicates strong customer satisfaction and repeat business potential");
    }
    if (bookingSources.direct > bookingSources.google_calendar * 2) {
      insights.push("Strong direct booking performance suggests effective marketing and brand recognition");
    }

    // Process status breakdown
    const totalBookings = Object.values(statusBreakdown).reduce((sum: number, count: any) => sum + count, 0);
    const processedStatusBreakdown = Object.entries(statusBreakdown).map(([status, count]: [string, any]) => {
      const percentage = totalBookings > 0 ? ((count / totalBookings) * 100).toFixed(1) : 0;
      
      return {
        [status]: {
          count,
          percentage,
          isConfirmed: status === 'confirmed',
          isPending: status === 'pending',
          isCheckedIn: status === 'checked-in',
          isCheckedOut: status === 'checked-out'
        }
      };
    }).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    // Process room type popularity
    const totalRoomBookings = Object.values(roomTypePopularity).reduce((sum: number, count: any) => sum + count, 0);
    const maxBookings = Math.max(...Object.values(roomTypePopularity).map(v => Number(v)));
    const minBookings = Math.min(...Object.values(roomTypePopularity).map(v => Number(v)));
    
    const processedRoomTypePopularity = Object.entries(roomTypePopularity).map(([roomType, count]: [string, any]) => {
      const popularity = totalRoomBookings > 0 ? ((count / totalRoomBookings) * 100).toFixed(1) : 0;
      const revenue = count * 150; // Estimate based on average room price
      
      return {
        [roomType]: {
          count,
          popularity,
          revenue,
          isMostPopular: count === maxBookings,
          isLeastPopular: count === minBookings
        }
      };
    }).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    // Process booking sources
    const totalSources = Object.values(bookingSources).reduce((sum: number, count: any) => sum + count, 0);
    const processedBookingSources = Object.entries(bookingSources).map(([source, count]: [string, any]) => {
      const percentage = totalSources > 0 ? ((count / totalSources) * 100).toFixed(1) : 0;
      const revenue = count * 150; // Estimate
      const avgValue = count > 0 ? revenue / count : 0;
      
      return {
        [source]: {
          count,
          percentage,
          revenue,
          avgValue
        }
      };
    }).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    const dateRangeDays = this.calculateDateRange(dateRange.startDate, dateRange.endDate);
    const totalRoomNights = summary.averageDuration * summary.totalBookings;
    const growthRate = 0; // Would need historical data to calculate

    return {
      title: "Booking Analytics Report",
      reportType: "Booking Analysis",
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      generatedAt: new Date(),
      generatedBy: "WebProj System",
      dateRange: dateRangeDays,
      summary: {
        ...summary,
        totalRoomNights,
        growthRate
      },
      statusBreakdown: processedStatusBreakdown,
      roomTypePopularity: processedRoomTypePopularity,
      bookingSources: processedBookingSources,
      insights,
      helpers: {
        formatCurrency: this.formatCurrency,
        formatDate: this.formatDate,
        formatDateTime: this.formatDateTime
      }
    };
  }
}
