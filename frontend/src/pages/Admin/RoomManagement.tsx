import { useState, useEffect } from "react";
import "../../styles/main.css";
import { useNotifications } from "../../contexts/NotificationContext";
import AdminLayout from "../../components/AdminLayout";
import { confirmDialog } from "../../utils/adminSwal";
import WalkInBookingModal from "../../components/admin/WalkInBookingModal";
import { createBooking } from "../../api/bookings";
import { alerts, showError, showSuccess } from "../../utils/alerts";
import { API_BASE_URL } from "../../config/api";

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
      return `${API_BASE_URL}${normalized}`;
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
          height: 220,
          borderRadius: '10px 10px 0 0',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
}

// Format price with comma separators for consistency
const formatPrice = (price: number) => {
  return price.toLocaleString('en-PH');
};

const getRoomTypeColor = (roomType: string) => {
  switch (roomType) {
    case "Standard":
      return "#10b981";
    case "Deluxe":
      return "#3b82f6";
    case "Suite":
      return "#8b5cf6";
    case "Presidential":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
};

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
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);
  const [savingRoom, setSavingRoom] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const roomTypes = ["Standard", "Deluxe", "Suite", "Presidential"];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/admin`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data || []);
      } else if (response.status === 403) {
        console.warn("Failed to fetch rooms: insufficient permissions (403)");
        setRooms([]);
        setMessage("You do not have permission to manage rooms.");
        notify("You do not have permission to manage rooms", "error");
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

    if (savingRoom) {
      return;
    }
    setSavingRoom(true);

    try {
      const isEdit = Boolean(editingRoom);
      const url = isEdit ? `${API_BASE_URL}/rooms/${editingRoom!._id}` : `${API_BASE_URL}/rooms`;
      const method = isEdit ? "PUT" : "POST";

      let response: Response;
      if (isEdit) {
        // Edit: keep using JSON body
        const roomData = {
          ...formData,
          price: parseFloat(formData.price),
          capacity: parseInt(formData.capacity)
        };
        response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(roomData),
        });
      } else {
        // Create: use multipart/form-data and send images along with fields
        const fd = new FormData();
        fd.append("roomNumber", formData.roomNumber);
        fd.append("roomType", formData.roomType);
        fd.append("price", formData.price);
        fd.append("capacity", formData.capacity);
        fd.append("description", formData.description || "");
        fd.append("amenities", JSON.stringify(formData.amenities || []));

        if (imageFiles && imageFiles.length > 0) {
          if (imageFiles.length > 5) {
            notify("Please select up to 5 images", "error");
            return;
          }
          Array.from(imageFiles).forEach((file) => fd.append("images", file));
        }

        response = await fetch(url, {
          method,
          credentials: "include",
          body: fd,
        });
      }

      const result = await response.json();

      if (response.ok) {
        setShowAddForm(false);
        setEditingRoom(null);
        resetForm();
        fetchRooms();
        if (editingRoom) {
          await alerts.roomUpdated();
        } else {
          await alerts.roomCreated();
        }
      } else {
        showError("Error", result.message || "Error saving room");
      }
    } catch (error) {
      console.error("Error saving room:", error);
      showError("Error", "Error saving room");
    } finally {
      setSavingRoom(false);
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
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        fetchRooms();
        await alerts.roomDeleted();
      } else {
        showError("Error", result.message || "Error deleting room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      showError("Error", "Error deleting room");
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

    if (imageFiles.length > 5) {
      notify("Please select up to 5 images", "error");
      return;
    }

    if (uploadingImages) {
      return;
    }

    setUploadingImages(true);

    const formDataUpload = new FormData();
    Array.from(imageFiles).forEach((file) => {
      formDataUpload.append("images", file);
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/rooms/${editingRoom._id}/images`,
        {
          method: "POST",
          credentials: "include",
          body: formDataUpload,
        }
      );

      const result = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          images: result.data?.images || [],
        }));
        setImageFiles(null);
        fetchRooms();
        await alerts.roomImagesUpdated();
      } else {
        showError("Upload Failed", result.message || "Failed to upload images");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      showError("Upload Failed", "Error uploading images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleBookRoom = (room: Room) => {
    setSelectedRoomForBooking(room);
    setShowWalkInModal(true);
  };

  const handleCreateWalkInBooking = async (data: {
    roomId: string;
    guestName: string;
    contactNumber: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    specialRequests?: string;
  }) => {
    try {
      await createBooking(data);
      setShowWalkInModal(false);
      setSelectedRoomForBooking(null);
      await showSuccess("Walk-in Booking Created!", "The booking has been created successfully.");
    } catch (error) {
      console.error("Error creating walk-in booking:", error);
      const message = error instanceof Error ? error.message : "Failed to create booking";
      showError("Booking Failed", message);
      throw error;
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
      const response = await fetch(`${API_BASE_URL}/rooms/${room._id}`, {
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
        fetchRooms();
        await showSuccess(
          `Room ${!room.isAvailable ? 'Activated' : 'Deactivated'}`,
          `Room ${room.roomNumber} has been ${!room.isAvailable ? 'activated' : 'deactivated'}.`
        );
      } else {
        const result = await response.json();
        showError("Error", result.message || "Error updating room");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      showError("Error", "Error updating room");
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

      <div className="admin-content rooms-management">
        <div className="rooms-page-header">
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
                        <label style={{ marginTop: "8px" }}>
                          {editingRoom
                            ? "Upload new images (1-5). After selecting files, click the button below to save them."
                            : "Select images (up to 5). They will be uploaded when you create the room."}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => setImageFiles(e.target.files)}
                        />
                        {editingRoom && (
                          <button
                            type="button"
                            className="admin-button primary"
                            style={{ marginTop: "8px" }}
                            onClick={handleUploadImages}
                            disabled={uploadingImages || !imageFiles || imageFiles.length === 0}
                          >
                            {uploadingImages ? "Uploading..." : "Upload selected images"}
                          </button>
                        )}
                      </div>

                      <div className="form-actions">
                        <button
                          type="submit"
                          className="admin-button primary"
                          disabled={savingRoom}
                        >
                          {savingRoom
                            ? (editingRoom ? 'Updating...' : 'Creating...')
                            : (editingRoom ? 'Update Room' : 'Create Room')}
                        </button>
                        <button 
                          type="button" 
                          className="admin-button secondary"
                          disabled={savingRoom}
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

          {rooms.length === 0 ? (
            <div className="no-rooms">
              <p>No rooms found. Create your first room!</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className={`room-card ${!room.isAvailable ? "unavailable" : ""}`}
                >
                  <div className="room-header">
                    <div className="room-number">Room {room.roomNumber}</div>
                    <div
                      className="room-type-badge"
                      style={{ backgroundColor: getRoomTypeColor(room.roomType) }}
                    >
                      {room.roomType}
                    </div>
                  </div>

                  <RoomImageStrip
                    roomNumber={room.roomNumber}
                    images={room.images || []}
                  />

                  <div className="room-details">
                    <div className="room-price">
                      ₱{formatPrice(room.price)}/night
                    </div>

                    <div className="room-badges">
                      <span
                        className={`room-status ${
                          room.isAvailable ? "available" : "unavailable"
                        }`}
                      >
                        {room.isAvailable ? "Available" : "Unavailable"}
                      </span>
                      <span
                        className={`room-status ${room.housekeepingStatus || "clean"}`}
                      >
                        {(room.housekeepingStatus || "clean").replace("-", " ")}
                      </span>
                    </div>

                    <div className="room-capacity">
                      Up to {room.capacity} guests
                    </div>

                    {room.description && (
                      <div className="room-description">{room.description}</div>
                    )}

                    {room.amenities.length > 0 && (
                      <div className="room-amenities">
                        <h4>Amenities:</h4>
                        <div className="amenities-list">
                          {room.amenities.map((amenity, index) => (
                            <span key={index} className="amenity-tag">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="room-actions">
                    {room.isAvailable && (
                      <button
                        className="admin-button primary"
                        onClick={() => handleBookRoom(room)}
                      >
                        Book
                      </button>
                    )}
                    <button
                      className="admin-button secondary"
                      onClick={() => handleEdit(room)}
                    >
                      Edit
                    </button>
                    <button
                      className={`admin-button ${
                        room.isAvailable ? "warning" : "success"
                      }`}
                      onClick={() => toggleRoomAvailability(room)}
                    >
                      {room.isAvailable ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="admin-button danger"
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

      {/* Walk-in Booking Modal */}
      {showWalkInModal && (
        <WalkInBookingModal
          onSubmit={handleCreateWalkInBooking}
          onClose={() => {
            setShowWalkInModal(false);
            setSelectedRoomForBooking(null);
          }}
          preselectedRoomId={selectedRoomForBooking?._id}
        />
      )}
    </AdminLayout>
  );
}

export default RoomManagement;
