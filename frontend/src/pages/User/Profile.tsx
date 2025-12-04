import { useState, useEffect } from "react";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";
import defaultAvatar from "../../assets/redBoat.png";
import { API_BASE_URL } from "../../config/api";

interface UserProfile {
  _id: string;
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
}

function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    }
  });
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        setFormData({
          firstName: data.data.firstName || "",
          lastName: data.data.lastName || "",
          phoneNumber: data.data.phoneNumber || "",
          dateOfBirth: data.data.dateOfBirth ? data.data.dateOfBirth.split('T')[0] : "",
          address: {
            street: data.data.address?.street || "",
            city: data.data.address?.city || "",
            state: data.data.address?.state || "",
            zipCode: data.data.address?.zipCode || "",
            country: data.data.address?.country || ""
          }
        });
      } else {
        console.warn("Failed to fetch profile:", response.status);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Profile updated successfully!");
        setEditing(false);
        fetchProfile();
      } else {
        setMessage(result.message || "Error updating profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage("");
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage("Profile picture updated successfully!");
        await fetchProfile();
      } else {
        setMessage(result.message || "Error updating profile picture");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setMessage("Error updating profile picture");
    } finally {
      setAvatarUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString();
  };

  const formatAddress = (address: any) => {
    if (!address) return "Not provided";
    const parts = [address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Not provided";
  };

  if (loading) {
    return (
      <UserLayout pageTitle="Profile">
        <div className="loading">Loading profile...</div>
      </UserLayout>
    );
  }

  if (!profile) {
    return (
      <UserLayout pageTitle="Profile">
        <div className="error">Failed to load profile</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout pageTitle="Profile">
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-section">
          <div className="profile-header">
            <h3>Profile Picture</h3>
          </div>
          <div className="profile-avatar-section">
            <div className="avatar-preview">
              <img
                src={profile.profilePicture && (profile.profilePicture.startsWith("http://") || profile.profilePicture.startsWith("https://"))
                  ? profile.profilePicture
                  : profile.profilePicture && (profile.profilePicture.startsWith("/uploads") || profile.profilePicture.startsWith("uploads/"))
                    ? `${API_BASE_URL}${profile.profilePicture.startsWith("/") ? profile.profilePicture : `/${profile.profilePicture}`}`
                    : defaultAvatar}
                alt="Profile avatar"
                style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover" }}
              />
            </div>
            <div className="avatar-actions">
              <label className="user-button secondary" style={{ display: "inline-block", cursor: "pointer" }}>
                {avatarUploading ? "Uploading..." : "Change Picture"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                  disabled={avatarUploading}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-header">
            <h3>Personal Information</h3>
            {!editing && (
              <button 
                className="user-button primary"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <div className="address-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="street">Street</label>
                      <input
                        type="text"
                        id="street"
                        value={formData.address.street}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, street: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, city: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="state">State</label>
                      <input
                        type="text"
                        id="state"
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, state: e.target.value}
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="zipCode">ZIP Code</label>
                      <input
                        type="text"
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({
                          ...formData, 
                          address: {...formData.address, zipCode: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      value={formData.address.country}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, country: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="user-button primary">
                  Save Changes
                </button>
                <button 
                  type="button" 
                  className="user-button secondary"
                  onClick={() => {
                    setEditing(false);
                    fetchProfile();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-grid">
                <div className="info-item">
                  <label>Username:</label>
                  <span>{profile.username || "Not set"}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{profile.email}</span>
                </div>
                <div className="info-item">
                  <label>Name:</label>
                  <span>{profile.firstName} {profile.lastName}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{profile.phoneNumber || "Not provided"}</span>
                </div>
                <div className="info-item">
                  <label>Date of Birth:</label>
                  <span>{profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not provided"}</span>
                </div>
                <div className="info-item">
                  <label>Address:</label>
                  <span>{formatAddress(profile.address)}</span>
                </div>
                <div className="info-item">
                  <label>Email Verified:</label>
                  <span className={profile.isEmailVerified ? "verified" : "not-verified"}>
                    {profile.isEmailVerified ? "✅ Verified" : "❌ Not verified"}
                  </span>
                </div>
                <div className="info-item">
                  <label>Member Since:</label>
                  <span>{formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account security and password changes are now managed from the Settings page */}
      </div>
    </UserLayout>
  );
}

export default Profile;
