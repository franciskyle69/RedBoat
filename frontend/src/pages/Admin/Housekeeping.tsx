import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/main.css";
import { useNotifications } from "../../contexts/NotificationContext";

type HKStatus = 'clean' | 'dirty' | 'in-progress';

interface HKRoom {
  _id: string;
  roomNumber: string;
  roomType: string;
  housekeepingStatus?: HKStatus;
  lastCleanedAt?: string;
  assignedHousekeeper?: string;
}

function Housekeeping() {
  const { notify } = useNotifications();
  const [rooms, setRooms] = useState<HKRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<HKStatus | 'all'>('all');
  const [localAssigned, setLocalAssigned] = useState<Record<string, string>>({});
  const [isEditingAssigned, setIsEditingAssigned] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchHK();
  }, []);

  const fetchHK = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/rooms/housekeeping", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        const mapped = (data.data || []).map((r: any) => ({
          _id: r._id,
          roomNumber: r.roomNumber,
          roomType: r.roomType,
          housekeepingStatus: r.housekeepingStatus || 'clean',
          lastCleanedAt: r.lastCleanedAt,
          assignedHousekeeper: r.assignedHousekeeper,
        }));
        setRooms(mapped);
        // Initialize local input values so typing doesn't trigger saves
        const initialAssigned: Record<string, string> = {};
        const initialEditing: Record<string, boolean> = {};
        mapped.forEach((r: HKRoom) => {
          initialAssigned[r._id] = r.assignedHousekeeper || '';
          initialEditing[r._id] = false;
        });
        setLocalAssigned(initialAssigned);
        setIsEditingAssigned(initialEditing);
      } else {
        setMessage(data.message || "Failed to load housekeeping data");
      }
    } catch (e) {
      console.error(e);
      setMessage("Error loading housekeeping data");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (roomId: string, housekeepingStatus: HKStatus) => {
    setMessage("");
    try {
      const res = await fetch(`http://localhost:5000/rooms/housekeeping/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ housekeepingStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Housekeeping status updated');
        notify('Housekeeping status updated', 'success');
        await fetchHK();
      } else {
        const msg = data.message || 'Failed to update status';
        setMessage(msg);
        notify(msg, 'error');
      }
    } catch (e) {
      console.error(e);
      setMessage('Error updating status');
      notify('Error updating status', 'error');
    }
  };

  const assignHousekeeper = async (roomId: string, assignedHousekeeper: string) => {
    setMessage("");
    try {
      const res = await fetch(`http://localhost:5000/rooms/housekeeping/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignedHousekeeper }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Housekeeper assigned');
        notify('Housekeeper assigned', 'success');
        // Update local state only; avoid immediate full refetch while typing
        setRooms(prev => prev.map(r => r._id === roomId ? { ...r, assignedHousekeeper } : r));
      } else {
        const msg = data.message || 'Failed to assign housekeeper';
        setMessage(msg);
        notify(msg, 'error');
      }
    } catch (e) {
      console.error(e);
      setMessage('Error assigning housekeeper');
      notify('Error assigning housekeeper', 'error');
    }
  };

  const filteredRooms = useMemo(() => {
    if (filter === 'all') return rooms;
    return rooms.filter(r => (r.housekeepingStatus || 'clean') === filter);
  }, [rooms, filter]);

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2 className="admin-title">Housekeeping Management</h2>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/user-management" className="admin-nav-link">Users</Link>
          <Link to="/admin/room-management" className="admin-nav-link">Rooms</Link>
          <Link to="/admin/bookings" className="admin-nav-link">Bookings</Link>
          <Link to="/admin/calendar" className="admin-nav-link">Calendar</Link>
          <Link to="/admin/housekeeping" className="admin-nav-link active">Housekeeping</Link>
          <Link to="/admin/reports" className="admin-nav-link">Reports</Link>
          <Link to="/admin/settings" className="admin-nav-link">Settings</Link>
          <Link to="/" className="admin-logout" onClick={async (e) => {
            e.preventDefault();
            try { await fetch("http://localhost:5000/logout", { method: "POST", credentials: "include" }); } catch {}
            window.location.href = "/";
          }}>Logout</Link>
        </nav>
      </header>

      {message && (
        <div className={`message ${message.toLowerCase().includes('error') || message.toLowerCase().includes('fail') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="admin-content">
        <div className="admin-section">
          <div className="admin-section-header">
            <h3>Rooms Housekeeping</h3>
            <div className="filters">
              <label>Status:</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
                <option value="all">All</option>
                <option value="dirty">Dirty</option>
                <option value="in-progress">In Progress</option>
                <option value="clean">Clean</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading housekeeping...</div>
          ) : (
            <div className="rooms-grid">
              {filteredRooms.map((room) => (
                <div key={room._id} className="room-card">
                  <div className="room-header">
                    <h4>Room {room.roomNumber}</h4>
                    <span className={`room-status ${room.housekeepingStatus}`}>
                      {(room.housekeepingStatus || 'clean').replace('-', ' ')}
                    </span>
                  </div>
                  <div className="room-details">
                    <p><strong>Type:</strong> {room.roomType}</p>
                    {room.lastCleanedAt && (
                      <p><strong>Last cleaned:</strong> {new Date(room.lastCleanedAt).toLocaleString()}</p>
                    )}
                    <div className="form-group">
                      <label>Assigned housekeeper</label>
                      {isEditingAssigned[room._id] ? (
                        <>
                          <input
                            type="text"
                            value={localAssigned[room._id] ?? ''}
                            onChange={(e) => setLocalAssigned(prev => ({ ...prev, [room._id]: e.target.value }))}
                            placeholder="Enter name"
                          />
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                            <button
                              className="admin-button small success"
                              onClick={async () => {
                                await assignHousekeeper(room._id, localAssigned[room._id] ?? '');
                                setIsEditingAssigned(prev => ({ ...prev, [room._id]: false }));
                              }}
                              type="button"
                            >
                              Save
                            </button>
                            <button
                              className="admin-button small secondary"
                              onClick={() => {
                                // Reset to current room value and exit edit mode
                                setLocalAssigned(prev => ({ ...prev, [room._id]: room.assignedHousekeeper || '' }));
                                setIsEditingAssigned(prev => ({ ...prev, [room._id]: false }));
                              }}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ color: '#374151', fontSize: '14px' }}>
                            {room.assignedHousekeeper && room.assignedHousekeeper.trim().length > 0 ? room.assignedHousekeeper : '—'}
                          </div>
                          <button
                            className="admin-button small"
                            onClick={() => setIsEditingAssigned(prev => ({ ...prev, [room._id]: true }))}
                            type="button"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="room-actions">
                    <button className="admin-button small" onClick={() => updateStatus(room._id, 'dirty')}>Mark Dirty</button>
                    <button className="admin-button small warning" onClick={() => updateStatus(room._id, 'in-progress')}>In Progress</button>
                    <button className="admin-button small success" onClick={() => updateStatus(room._id, 'clean')}>Mark Clean</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Housekeeping;
