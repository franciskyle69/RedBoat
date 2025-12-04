import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";
import { useNotifications } from "../../contexts/NotificationContext";
import * as FeedbackApi from "../../api/feedback";
import * as UsersApi from "../../api/users";
import StarRating from "../../components/StarRating";

function UserManagement() {
  const { notify } = useNotifications();
  const [feedback, setFeedback] = useState<FeedbackApi.FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<UsersApi.User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const data = await FeedbackApi.getAll();
        setFeedback(data);
      } catch (e) {
        console.error(e);
        notify("Failed to load feedback.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [notify]);

  // Load current user role to know if we should show superadmin-only controls
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/me", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setCurrentUserRole(json?.data?.role);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

  const formatDateShort = (iso: string) => {
    return new Date(iso).toLocaleDateString();
  };

  const getUserName = (fb: FeedbackApi.FeedbackItem) => {
    const u = fb.user;
    if (!u) return "Unknown";
    if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
    return u.username || u.email || "Unknown";
  };

  const filteredFeedback = feedback.filter((fb) => {
    if (ratingFilter !== "all" && fb.rating !== Number(ratingFilter)) return false;
    return true;
  });

  const averageRating =
    filteredFeedback.length === 0
      ? 0
      : filteredFeedback.reduce((sum, fb) => sum + fb.rating, 0) / filteredFeedback.length;

  const handleManageUsers = async () => {
    if (!showUserList) {
      setUsersLoading(true);
      try {
        const data = await UsersApi.getAllUsers();
        setUsers(data);
      } catch (e) {
        console.error(e);
        notify("Failed to load users.", "error");
      } finally {
        setUsersLoading(false);
      }
    }
    setShowUserList(!showUserList);
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await UsersApi.updateUserRole(userId, newRole);
      notify(`User role updated to ${newRole}`, "success");
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
    } catch (e) {
      console.error(e);
      notify("Failed to update user role.", "error");
    }
  };

  const handlePermissionToggle = async (
    userId: string,
    key: keyof UsersApi.AdminPermissions,
    value: boolean
  ) => {
    try {
      const target = users.find(u => u._id === userId);
      if (!target) return;
      const current = target.adminPermissions || {};
      const nextPerms: UsersApi.AdminPermissions = {
        ...current,
        [key]: value,
      };
      await UsersApi.updateAdminPermissions(userId, nextPerms);
      setUsers(users.map(u => 
        u._id === userId ? { ...u, adminPermissions: nextPerms } : u
      ));
      notify("Admin permissions updated", "success");
    } catch (e) {
      console.error(e);
      notify("Failed to update admin permissions.", "error");
    }
  };

  return (
    <AdminLayout pageTitle="User Management">
      <section className="cards">
        <div className="card">
          <h2>User Login & Role Access</h2>
          <p>Manage user roles (Admin and standard users) to ensure secure system access.</p>
          <button className="btn primary" onClick={handleManageUsers}>
            {showUserList ? "Hide Users" : "Manage Users"}
          </button>
        </div>
        <div className="card">
          <h2>Feedback & Reviews</h2>
          <p>View feedback and reviews submitted by users about their stay.</p>
          <p>
            Total feedback: <strong>{filteredFeedback.length}</strong>
          </p>
          {filteredFeedback.length > 0 && (
            <div
              style={{
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <StarRating rating={averageRating} readonly size="medium" />
              <span>
                <strong>{averageRating.toFixed(1)}</strong>/5 ({filteredFeedback.length} review
                {filteredFeedback.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}
          <div className="filter-row">
            <label>
              Filter by rating:&nbsp;
              <select
                className="input"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="all">All ratings</option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Very Poor</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {showUserList && (
        <section className="table-section">
          <h3>All Users</h3>
          {usersLoading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div className="table-container">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Email Verified</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>{user.username || "—"}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: user.role === 'admin' ? '#ef4444' : user.role === 'superadmin' ? '#0f172a' : '#10b981',
                            color: 'white'
                          }}
                        >
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td>{user.phoneNumber || "—"}</td>
                      <td>{user.isEmailVerified ? "✓" : "✗"}</td>
                      <td>{formatDateShort(user.createdAt)}</td>
                      <td>
                        <div className="action-buttons" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value as 'user' | 'admin')}
                              className="input"
                              style={{ fontSize: '12px', padding: '4px' }}
                              disabled={user.role === 'superadmin' || currentUserRole !== 'superadmin'}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Link
                              to={`/admin/bookings?user=${encodeURIComponent(user.firstName + ' ' + user.lastName)}`}
                              className="btn-view"
                              style={{ marginLeft: '8px' }}
                            >
                              Bookings
                            </Link>
                          </div>

                          {currentUserRole === 'superadmin' && user.role === 'admin' && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                              {[
                                { key: 'manageBookings', label: 'Bookings' },
                                { key: 'manageRooms', label: 'Rooms' },
                                { key: 'manageHousekeeping', label: 'Housekeeping' },
                                { key: 'manageUsers', label: 'Users' },
                                { key: 'viewReports', label: 'Reports' },
                              ].map((perm) => (
                                <label
                                  key={perm.key}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px',
                                    background: '#f1f5f9',
                                    padding: '2px 6px',
                                    borderRadius: '999px',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={(user.adminPermissions && (user.adminPermissions as any)[perm.key]) !== false}
                                    onChange={(e) =>
                                      handlePermissionToggle(
                                        user._id,
                                        perm.key as keyof UsersApi.AdminPermissions,
                                        e.target.checked
                                      )
                                    }
                                  />
                                  {perm.label}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="table-section">
        {loading ? (
          <p>Loading feedback...</p>
        ) : filteredFeedback.length === 0 ? (
          <p>No feedback has been submitted yet.</p>
        ) : (
          <div className="table-container">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((fb) => {
                  const name = getUserName(fb);
                  return (
                  <tr key={fb._id}>
                    <td>
                      <Link
                        to={`/admin/bookings?user=${encodeURIComponent(name)}`}
                        className="link"
                      >
                        {name}
                      </Link>
                    </td>
                    <td>{fb.user?.email || "—"}</td>
                    <td>
                      <StarRating rating={fb.rating} readonly size="small" />
                    </td>
                    <td>{fb.comment}</td>
                    <td>{formatDate(fb.createdAt)}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}

export default UserManagement;
