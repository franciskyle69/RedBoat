import { useState, useEffect } from "react";
import "../styles/calendar.css";
import { API_BASE_URL } from "../config/api";

interface RoomAvailability {
  roomNumber: string;
  roomType: string;
  isAvailable: boolean;
  booking: any;
}

interface CalendarDay {
  date: Date;
  day: number;
  rooms: RoomAvailability[];
}


interface RoomCalendarProps {
  onDateSelect?: (date: Date) => void;
  onRoomSelect?: (roomNumber: string, date: Date) => void;
}

function RoomCalendar({ onDateSelect, onRoomSelect }: RoomCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [selectedDateRooms, setSelectedDateRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.month-picker') && !target.closest('.year-picker') && 
          !target.closest('.calendar-title.clickable')) {
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await fetch(`${API_BASE_URL}/rooms/calendar?month=${month}&year=${year}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        // Ensure dates are properly converted to Date objects
        const processedData = (data.data || []).map((dayData: any) => {
          const date = new Date(dayData.date);
          // Validate that the date is valid
          if (isNaN(date.getTime())) {
            console.warn("Invalid date received:", dayData.date);
            return { ...dayData, date: new Date() }; // Fallback to current date
          }
          return { ...dayData, date };
        });
        setCalendarData(processedData);
      } else {
        console.warn("Failed to fetch calendar data:", response.status);
        setCalendarData([]);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setCalendarData([]);
    } finally {
      setLoading(false);
    }
  };





  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setShowYearPicker(false);
  };

  const getMonthName = (monthIndex: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= 2100; i++) {
      years.push(i);
    }
    return years;
  };

  const handleDateClick = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Don't allow clicking on past dates
    if (isPastDate(dateObj)) {
      return;
    }
    
    setSelectedDate(dateObj);
    setShowDateDetails(true);
    
    // Fetch room availability for the selected date
    fetchRoomsForDate(dateObj);
    
    onDateSelect?.(dateObj);
  };

  const handleRoomClick = (roomNumber: string, date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    setSelectedRoom(roomNumber);
    onRoomSelect?.(roomNumber, dateObj);
  };

  const getRoomTypeColor = (roomType: string) => {
    switch (roomType) {
      case "Standard": return "#10b981";
      case "Deluxe": return "#3b82f6";
      case "Suite": return "#8b5cf6";
      case "Presidential": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  const getAvailabilityColor = (isAvailable: boolean) => {
    return isAvailable ? "#10b981" : "#ef4444";
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return dateObj.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      console.warn("Error in formatDate:", error);
      return 'Invalid Date';
    }
  };

  const getDayOfWeek = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid';
      return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    } catch (error) {
      console.warn("Error in getDayOfWeek:", error);
      return 'Invalid';
    }
  };

  const isToday = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return false;
      const today = new Date();
      return dateObj.toDateString() === today.toDateString();
    } catch (error) {
      console.warn("Error in isToday:", error);
      return false;
    }
  };

  const isSelected = (date: Date | string) => {
    try {
      if (!selectedDate) return false;
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return false;
      return dateObj.toDateString() === selectedDate.toDateString();
    } catch (error) {
      console.warn("Error in isSelected:", error);
      return false;
    }
  };

  const isPastDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      dateObj.setHours(0, 0, 0, 0); // Reset time to start of day
      
      return dateObj < today;
    } catch (error) {
      console.warn("Error in isPastDate:", error);
      return false;
    }
  };


  const fetchRoomsForDate = async (date: Date) => {
    setLoadingRooms(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/rooms/availability?date=${dateString}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedDateRooms(data.data || []);
        } else {
          console.warn("API returned error:", data.message);
          setSelectedDateRooms([]);
        }
      } else {
        console.warn("Failed to fetch room availability:", response.status);
        setSelectedDateRooms([]);
      }
    } catch (error) {
      console.error("Error fetching room availability:", error);
      setSelectedDateRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const getRoomsForSelectedDate = () => {
    if (!selectedDate) return [];
    
    // First try to get from calendar data
    const dayData = calendarData.find(day => 
      day.date.toDateString() === selectedDate.toDateString()
    );
    
    if (dayData && dayData.rooms.length > 0) {
      return dayData.rooms;
    }
    
    // Fallback to selectedDateRooms if calendar data doesn't have room details
    return selectedDateRooms;
  };

  const getAvailableRooms = () => {
    return getRoomsForSelectedDate().filter(room => room.isAvailable);
  };

  const getOccupiedRooms = () => {
    return getRoomsForSelectedDate().filter(room => !room.isAvailable);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get the number of days in the month
    const daysInMonth = lastDay.getDate();
    
    // Get the number of days in the previous month
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    const days = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        day,
        date,
        isCurrentMonth: true
      });
    }
    
    // Add days from next month to fill the grid (6 weeks = 42 days)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="room-calendar-loading">
        <div className="loading-spinner"></div>
        <p>Loading calendar data...</p>
      </div>
    );
  }

  // Fallback for when no calendar data is available
  if (!calendarData || calendarData.length === 0) {
    return (
      <div className="room-calendar">
        <div className="calendar-header">
          <button 
            className="calendar-nav-btn"
            onClick={() => navigateMonth('prev')}
          >
            ←
          </button>
          <h3 className="calendar-title">{formatDate(currentDate)}</h3>
          <button 
            className="calendar-nav-btn"
            onClick={() => navigateMonth('next')}
          >
            →
          </button>
        </div>
        
        <div className="calendar-error">
          <p>No calendar data available for this month.</p>
          <button 
            className="btn btn-primary"
            onClick={fetchCalendarData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-calendar">
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn"
          onClick={() => navigateMonth('prev')}
        >
          ←
        </button>
        <div className="calendar-title-container">
          <h3 
            className="calendar-title clickable"
            onClick={() => {
              setShowMonthPicker(!showMonthPicker);
              setShowYearPicker(false);
            }}
          >
            {getMonthName(currentDate.getMonth())}
          </h3>
          <h3 
            className="calendar-title clickable"
            onClick={() => {
              setShowYearPicker(!showYearPicker);
              setShowMonthPicker(false);
            }}
          >
            {currentDate.getFullYear()}
          </h3>
        </div>
        <button 
          className="calendar-nav-btn"
          onClick={() => navigateMonth('next')}
        >
          →
        </button>
      </div>

      {/* Month Picker */}
      {showMonthPicker && (
        <div className="month-picker">
          <div className="picker-grid">
            {Array.from({ length: 12 }, (_, i) => (
              <button
                key={i}
                className={`picker-item ${i === currentDate.getMonth() ? 'selected' : ''}`}
                onClick={() => handleMonthSelect(i)}
              >
                {getMonthName(i)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Year Picker */}
      {showYearPicker && (
        <div className="year-picker">
          <div className="picker-grid">
            {getAvailableYears().map((year) => (
              <button
                key={year}
                className={`picker-item ${year === currentDate.getFullYear() ? 'selected' : ''}`}
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color occupied"></div>
          <span>Occupied</span>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-days-header">
          <div className="day-header">S</div>
          <div className="day-header">M</div>
          <div className="day-header">T</div>
          <div className="day-header">W</div>
          <div className="day-header">T</div>
          <div className="day-header">F</div>
          <div className="day-header">S</div>
        </div>

        {generateCalendarDays().map((dayData, index) => (
          <div 
            key={index}
            className={`day-cell ${dayData.isCurrentMonth ? '' : 'other-month'} ${isToday(dayData.date) ? 'today' : ''} ${isSelected(dayData.date) ? 'selected' : ''} ${isPastDate(dayData.date) ? 'past-date' : ''}`}
            onClick={() => handleDateClick(dayData.date)}
            title={isPastDate(dayData.date) ? 'Past dates are not available for booking' : `Click to view room availability for ${dayData.date.toLocaleDateString()}`}
          >
            <div className="day-number">{dayData.day}</div>
            <div className="day-of-week">{getDayOfWeek(dayData.date)}</div>
          </div>
        ))}
      </div>


      {/* Date Details Overlay */}
      {showDateDetails && selectedDate && (
        <div className="date-details-overlay">
          <div className="date-details-modal">
            <div className="date-details-header">
              <div className="header-content">
                <div className="header-icon">📅</div>
                <div className="header-text">
                  <h3>Room Availability</h3>
                  <span className="header-date">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
              <button 
                className="close-btn"
                onClick={() => setShowDateDetails(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="date-details-content">
              {loadingRooms ? (
                <div className="loading-rooms">
                  <div className="loading-spinner"></div>
                  <p>Loading room availability...</p>
                </div>
              ) : (
                <>
                  <div className="availability-summary">
                    <div className="summary-card available">
                      <div className="summary-icon-wrapper">
                        <span className="summary-icon">🛏️</span>
                      </div>
                      <div className="summary-info">
                        <span className="summary-count">{getAvailableRooms().length}</span>
                        <span className="summary-label">Available</span>
                      </div>
                    </div>
                    <div className="summary-card occupied">
                      <div className="summary-icon-wrapper">
                        <span className="summary-icon">🔒</span>
                      </div>
                      <div className="summary-info">
                        <span className="summary-count">{getOccupiedRooms().length}</span>
                        <span className="summary-label">Occupied</span>
                      </div>
                    </div>
                  </div>

                  <div className="rooms-details">
                    <div className="rooms-section available-section">
                      <div className="section-header">
                        <span className="section-icon">✓</span>
                        <h4>Available Rooms</h4>
                      </div>
                      <div className="rooms-list">
                        {getAvailableRooms().length > 0 ? (
                          getAvailableRooms().map((room) => (
                            <div key={room.roomNumber} className="room-card available">
                              <div className="room-info">
                                <span className="room-number">Room {room.roomNumber}</span>
                                <span className="room-type-badge">{room.roomType}</span>
                              </div>
                              <button 
                                className="book-btn"
                                onClick={() => {
                                  handleRoomClick(room.roomNumber, selectedDate);
                                  setShowDateDetails(false);
                                }}
                              >
                                <span>Book Now</span>
                                <span className="btn-arrow">→</span>
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="no-rooms-card">
                            <span className="no-rooms-icon">📭</span>
                            <p>No available rooms for this date</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rooms-section occupied-section">
                      <div className="section-header">
                        <span className="section-icon">✗</span>
                        <h4>Occupied Rooms</h4>
                      </div>
                      <div className="rooms-list">
                        {getOccupiedRooms().length > 0 ? (
                          getOccupiedRooms().map((room) => (
                            <div key={room.roomNumber} className="room-card occupied">
                              <div className="room-info">
                                <span className="room-number">Room {room.roomNumber}</span>
                                <span className="room-type-badge">{room.roomType}</span>
                              </div>
                              {room.booking && (
                                <div className="guest-info">
                                  <span className="guest-icon">👤</span>
                                  <span className="guest-name">{room.booking.guestName || 'Guest'}</span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="no-rooms-card success">
                            <span className="no-rooms-icon">🎉</span>
                            <p>All rooms are available!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="date-details-footer">
              <button 
                className="btn-close-modal"
                onClick={() => setShowDateDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomCalendar;
