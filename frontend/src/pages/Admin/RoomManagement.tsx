import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../styles/main.css";

interface Room {
  _id: string;
  roomNumber: string;
  roomType: string;
  price: number;
  capacity: number;
  amenities: string[];
  description: string;
  isAvailable: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomType: "Standard",
    price: "",
    capacity: "",
    amenities: [] as string[],
    description: "",
    images: [] as string[]
  });
  const [newAmenity, setNewAmenity] = useState("");
  const [newImage, setNewImage] = useState("");
  const [message, setMessage] = useState("");

  const roomTypes = ["Standard", "Deluxe", "Suite", "Presidential"];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/rooms", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data || []);
      } else {
        console.warn("Failed to fetch rooms:", response.status);
        setRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const roomData = {
        ...formData,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity)
      };

      const url = editingRoom 
        ? `http://localhost:5000/rooms/${editingRoom._id}`
        : "http://localhost:5000/rooms";
      
      const method = editingRoom ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(roomData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(editingRoom ? "Room updated successfully!" : "Room created successfully!");
        setShowAddForm(false);
        setEditingRoom(null);
        resetForm();
        fetchRooms();
      } else {
        setMessage(result.message || "Error saving room");
      }
    } catch (error) {
      console.error("Error saving room:", error);
      setMessage("Error saving room");
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price.toString(),
      capacity: room.capacity.toString(),
      amenities: room.amenities,
      description: room.description,
      images: room.images
    });
    setShowAddForm(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!window.confirm("Are you sure you want to delete this room?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/rooms/${roomId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Room deleted successfully!");
        fetchRooms();
      } else {
        setMessage(result.message || "Error deleting room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      setMessage("Error deleting room");
    }
  };

  const resetForm = () => {
    setFormData({
      roomNumber: "",
      roomType: "Standard",
      price: "",
      capacity: "",
      amenities: [],
      description: "",
      images: []
    });
    setNewAmenity("");
    setNewImage("");
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, newAmenity.trim()]
      });
      setNewAmenity("");
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(a => a !== amenity)
    });
  };

  const addImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, newImage.trim()]
      });
      setNewImage("");
    }
  };

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter(i => i !== image)
    });
  };

  const toggleRoomAvailability = async (room: Room) => {
    try {
      const response = await fetch(`http://localhost:5000/rooms/${room._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          isAvailable: !room.isAvailable
        }),
      });

      if (response.ok) {
        setMessage(`Room ${!room.isAvailable ? 'activated' : 'deactivated'} successfully!`);
        fetchRooms();
      } else {
        const result = await response.json();
        setMessage(result.message || "Error updating room");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      setMessage("Error updating room");
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2 className="admin-title">Room Management</h2>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/user-management" className="admin-nav-link">Users</Link>
          <Link to="/admin/room-management" className="admin-nav-link active">Rooms</Link>
          <Link to="/admin/bookings" className="admin-nav-link">Bookings</Link>
          <Link to="/admin/calendar" className="admin-nav-link">Calendar</Link>
          <Link to="/admin/housekeeping" className="admin-nav-link">Housekeeping</Link>
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
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="admin-content">
        <div className="admin-section">
          <div className="admin-section-header">
            <h3>Rooms</h3>
            <button 
              className="admin-button primary"
              onClick={() => {
                setShowAddForm(true);
                setEditingRoom(null);
                resetForm();
              }}
            >
              Add New Room
            </button>
          </div>

          {showAddForm && (
            <div className="admin-form-container">
              <h4>{editingRoom ? 'Edit Room' : 'Add New Room'}</h4>
              <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="roomNumber">Room Number *</label>
                    <input
                      type="text"
                      id="roomNumber"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="roomType">Room Type *</label>
                    <select
                      id="roomType"
                      value={formData.roomType}
                      onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                      required
                    >
                      {roomTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Price per Night ($) *</label>
                    <input
                      type="number"
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="capacity">Capacity *</label>
                    <input
                      type="number"
                      id="capacity"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Amenities</label>
                  <div className="amenities-container">
                    <div className="amenities-list">
                      {formData.amenities.map((amenity, index) => (
                        <span key={index} className="amenity-tag">
                          {amenity}
                          <button
                            type="button"
                            onClick={() => removeAmenity(amenity)}
                            className="remove-amenity"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="add-amenity">
                      <input
                        type="text"
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        placeholder="Add amenity"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                      />
                      <button type="button" onClick={addAmenity}>Add</button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Images (URLs)</label>
                  <div className="images-container">
                    <div className="images-list">
                      {formData.images.map((image, index) => (
                        <span key={index} className="image-tag">
                          {image}
                          <button
                            type="button"
                            onClick={() => removeImage(image)}
                            className="remove-image"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="add-image">
                      <input
                        type="url"
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        placeholder="Add image URL"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                      />
                      <button type="button" onClick={addImage}>Add</button>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="admin-button primary">
                    {editingRoom ? 'Update Room' : 'Create Room'}
                  </button>
                  <button 
                    type="button" 
                    className="admin-button secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingRoom(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rooms-list">
            {rooms.length === 0 ? (
              <div className="no-rooms">
                <p>No rooms found. Create your first room!</p>
              </div>
            ) : (
              <div className="rooms-grid">
                {rooms.map((room) => (
                  <div key={room._id} className={`room-card ${!room.isAvailable ? 'unavailable' : ''}`}>
                    <div className="room-header">
                      <h4>Room {room.roomNumber}</h4>
                      <span className={`room-status ${room.isAvailable ? 'available' : 'unavailable'}`}>
                        {room.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="room-details">
                      <p><strong>Type:</strong> {room.roomType}</p>
                      <p><strong>Price:</strong> ${room.price}/night</p>
                      <p><strong>Capacity:</strong> {room.capacity} guests</p>
                      {room.description && <p><strong>Description:</strong> {room.description}</p>}
                      {room.amenities.length > 0 && (
                        <div className="room-amenities">
                          <strong>Amenities:</strong>
                          <div className="amenities-tags">
                            {room.amenities.map((amenity, index) => (
                              <span key={index} className="amenity-tag">{amenity}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="room-actions">
                      <button 
                        className="admin-button small"
                        onClick={() => handleEdit(room)}
                      >
                        Edit
                      </button>
                      <button 
                        className={`admin-button small ${room.isAvailable ? 'warning' : 'success'}`}
                        onClick={() => toggleRoomAvailability(room)}
                      >
                        {room.isAvailable ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        className="admin-button small danger"
                        onClick={() => handleDelete(room._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomManagement;
