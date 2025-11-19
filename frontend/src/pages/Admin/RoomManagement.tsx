import { useState, useEffect } from "react";
import "../../styles/main.css";
import { useNotifications } from "../../contexts/NotificationContext";
import AdminLayout from "../../components/AdminLayout";
import { confirmDialog } from "../../utils/adminSwal";

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
  housekeepingStatus?: 'clean' | 'dirty' | 'in-progress';
  lastCleanedAt?: string;
  assignedHousekeeper?: string;
}

function RoomImageStrip({ roomNumber, images }: { roomNumber: string; images: string[] }) {
  const resolveSrc = (src: string) => {
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('/images') || src.startsWith('images/')) return src;

    if (src.startsWith('/uploads') || src.startsWith('uploads/')) {
      const normalized = src.startsWith('/') ? src : `/${src}`;
      return `http://localhost:5000${normalized}`;
    }

    return src;
  };

  const src = resolveSrc((images && images[0]) || '/room-placeholder.jpg');

  return (
    <div className="room-images-strip" style={{ width: '100%', marginBottom: '8px' }}>
      <img
        src={src}
        alt={`Room ${roomNumber} thumbnail`}
        style={{
          width: '100%',
          height: 180,
          borderRadius: '10px 10px 0 0',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
}

function RoomManagement() {
  const { notify } = useNotifications();
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
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState("");

  const roomTypes = ["Standard", "Deluxe", "Suite", "Presidential"];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/rooms/admin", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data || []);
      } else {
        console.warn("Failed to fetch rooms:", response.status);
        setRooms([]);
        notify("Failed to fetch rooms", "error");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
      notify("Error fetching rooms", "error");
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
        notify(editingRoom ? "Room updated successfully" : "Room created successfully", "success");
        setShowAddForm(false);
        setEditingRoom(null);
        resetForm();
        fetchRooms();
      } else {
        setMessage(result.message || "Error saving room");
        notify(result.message || "Error saving room", "error");
      }
    } catch (error) {
      console.error("Error saving room:", error);
      setMessage("Error saving room");
      notify("Error saving room", "error");
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
    const isConfirmed = await confirmDialog({
      title: "Delete this room?",
      text: "This will permanently remove the room from your inventory.",
      confirmText: "Yes, delete",
      icon: "warning",
    });

    if (!isConfirmed) {
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
        notify("Room deleted successfully", "success");
        fetchRooms();
      } else {
        setMessage(result.message || "Error deleting room");
        notify(result.message || "Error deleting room", "error");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      setMessage("Error deleting room");
      notify("Error deleting room", "error");
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
    setImageFiles(null);
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

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter(i => i !== image)
    });
  };

  const handleUploadImages = async () => {
    if (!editingRoom) {
      notify("You can only upload images when editing an existing room", "error");
      return;
    }
    if (!imageFiles || imageFiles.length === 0) {
      notify("Please select images to upload", "error");
      return;
    }

    if (imageFiles.length < 3 || imageFiles.length > 5) {
      notify("Please select between 3 and 5 images", "error");
      return;
    }

    const formDataUpload = new FormData();
    Array.from(imageFiles).forEach((file) => {
      formDataUpload.append("images", file);
    });

    try {
      const response = await fetch(
        `http://localhost:5000/rooms/${editingRoom._id}/images`,
        {
          method: "POST",
          credentials: "include",
          body: formDataUpload,
        }
      );

      const result = await response.json();

      if (response.ok) {
        notify("Room images updated", "success");
        setFormData((prev) => ({
          ...prev,
          images: result.data?.images || [],
        }));
        setImageFiles(null);
        fetchRooms();
      } else {
        notify(result.message || "Failed to upload images", "error");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      notify("Error uploading images", "error");
    }
  };

  const toggleRoomAvailability = async (room: Room) => {
    const isDeactivating = room.isAvailable;
    const actionLabel = isDeactivating ? "Deactivate" : "Activate";

    const isConfirmed = await confirmDialog({
      title: `${actionLabel} this room?`,
      text: isDeactivating
        ? `This will make Room ${room.roomNumber} unavailable for new bookings.`
        : `This will make Room ${room.roomNumber} available for bookings again.`,
      confirmText: `Yes, ${actionLabel.toLowerCase()}`,
      icon: "question",
    });

    if (!isConfirmed) return;

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
        notify(`Room ${!room.isAvailable ? 'activated' : 'deactivated'} successfully`, "success");
        fetchRooms();
      } else {
        const result = await response.json();
        setMessage(result.message || "Error updating room");
        notify(result.message || "Error updating room", "error");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      setMessage("Error updating room");
      notify("Error updating room", "error");
    }
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="Room Management">
        <div className="loading">Loading rooms...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Room Management">
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
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
                  <button
                    className="modal-close"
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingRoom(null);
                      resetForm();
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="admin-form-container">
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
                          <label htmlFor="price">Price per Night (₱) *</label>
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
                        <label>Images</label>
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
                        </div>
                        <label style={{ marginTop: "8px" }}>Upload new images (3-5)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => setImageFiles(e.target.files)}
                        />
                        <button
                          type="button"
                          className="admin-button small"
                          onClick={handleUploadImages}
                          disabled={!editingRoom || !imageFiles || imageFiles.length === 0}
                        >
                          Upload Images
                        </button>
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
                </div>
              </div>
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
                      <span 
                        className={`room-status ${room.housekeepingStatus || 'clean'}`}
                        title={`Housekeeping: ${(room.housekeepingStatus || 'clean').replace('-', ' ')}`}
                        style={{ marginLeft: '8px' }}
                      >
                        {(room.housekeepingStatus || 'clean').replace('-', ' ')}
                      </span>
                    </div>
                    <div className="room-details">
                      <RoomImageStrip roomNumber={room.roomNumber} images={room.images || []} />
                      <p><strong>Room:</strong> {room.roomNumber}</p>
                      <p><strong>Type:</strong> {room.roomType}</p>
                      <p><strong>Price:</strong> ₱{room.price}/night</p>
                      <p><strong>Capacity:</strong> {room.capacity} guests</p>
                      <p>
                        <strong>Housekeeping:</strong> {(room.housekeepingStatus || 'clean').replace('-', ' ')}
                        {room.assignedHousekeeper ? ` (Assigned: ${room.assignedHousekeeper})` : ''}
                        {room.lastCleanedAt ? ` • Last cleaned: ${new Date(room.lastCleanedAt).toLocaleString()}` : ''}
                      </p>
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
    </AdminLayout>
  );
}

export default RoomManagement;
