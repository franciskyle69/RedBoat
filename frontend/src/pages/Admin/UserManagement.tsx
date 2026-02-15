import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";
import { useNotifications } from "../../contexts/NotificationContext";
import * as FeedbackApi from "../../api/feedback";
import * as UsersApi from "../../api/users";
import * as RolesApi from "../../api/roles";
import type { RolePermissions } from "../../api/roles";
import StarRating from "../../components/StarRating";

const PERM_LABELS: { key: keyof RolePermissions; label: string }[] = [
  { key: "manageBookings", label: "Bookings" },
  { key: "manageRooms", label: "Rooms" },
  { key: "manageHousekeeping", label: "Housekeeping" },
  { key: "manageUsers", label: "Users" },
  { key: "viewReports", label: "Reports" },
];

function UserManagement() {
  const { notify } = useNotifications();
  const [feedback, setFeedback] = useState<FeedbackApi.FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<UsersApi.User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>(undefined);
  const [roles, setRoles] = useState<RolesApi.Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePerms, setNewRolePerms] = useState<RolePermissions>({
    manageBookings: true,
    manageRooms: true,
    manageHousekeeping: true,
    manageUsers: true,
    viewReports: true,
  });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRolePerms, setEditRolePerms] = useState<RolePermissions>({});

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

  // Load current user role and assignable roles (for superadmin dropdown)
  useEffect(() => {
    (async () => {
      try {
        const { API_BASE_URL } = await import("../../config/api");
        const res = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setCurrentUserRole(json?.data?.role);
        }
        const rolesRes = await RolesApi.getRoles().catch(() => []);
        setRoles(Array.isArray(rolesRes) ? rolesRes : []);
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

  const assignableRoles = [
    { name: "user", label: "User" },
    { name: "admin", label: "Admin" },
    ...roles.filter((r) => !["user", "admin", "superadmin"].includes(r.name)).map((r) => ({ name: r.name, label: r.name })),
  ];

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const rolesRes = await RolesApi.getRoles().catch(() => []);
      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await UsersApi.updateUserRole(userId, newRole as 'user' | 'admin');
      notify(`User role updated to ${newRole}`, "success");
      setUsers(users.map(user =>
        user._id === userId ? { ...user, role: newRole } : user
      ));
    } catch (e) {
      console.error(e);
      notify((e as Error).message || "Failed to update user role.", "error");
    }
  };

  const handleBlockUnblock = async (userId: string, block: boolean) => {
    try {
      if (block) await UsersApi.blockUser(userId);
      else await UsersApi.unblockUser(userId);
      notify(block ? 'User blocked' : 'User unblocked', 'success');
      setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: !!block, blockedAt: block ? new Date().toISOString() : undefined } : u));
    } catch (e) {
      console.error(e);
      notify(block ? 'Failed to block user.' : 'Failed to unblock user.', 'error');
    }
  };

  const togglePerm = (perms: RolePermissions, key: keyof RolePermissions, value: boolean) =>
    ({ ...perms, [key]: value });

  const handleManageRoles = async () => {
    if (!showRoles) await loadRoles();
    setShowRoles(!showRoles);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      notify("Role name is required.", "error");
      return;
    }
    try {
      await RolesApi.createRole(newRoleName.trim(), newRolePerms);
      notify("Role created.", "success");
      setNewRoleName("");
      setNewRolePerms({
        manageBookings: true,
        manageRooms: true,
        manageHousekeeping: true,
        manageUsers: true,
        viewReports: true,
      });
      await loadRoles();
    } catch (e) {
      console.error(e);
      notify((e as Error).message || "Failed to create role.", "error");
    }
  };

  const handleUpdateRole = async (roleId: string, permissions: RolePermissions) => {
    try {
      await RolesApi.updateRole(roleId, { permissions });
      notify("Role updated.", "success");
      setEditingRoleId(null);
      await loadRoles();
    } catch (e) {
      console.error(e);
      notify((e as Error).message || "Failed to update role.", "error");
    }
  };

  const handleDeleteRole = async (roleId: string, name: string) => {
    if (!window.confirm(`Delete role "${name}"? Users with this role will need to be reassigned.`)) return;
    try {
      await RolesApi.deleteRole(roleId);
      notify("Role deleted.", "success");
      await loadRoles();
    } catch (e) {
      console.error(e);
      notify((e as Error).message || "Failed to delete role.", "error");
    }
  };

  const isSuperadmin = currentUserRole === "superadmin";

  return (
    <AdminLayout pageTitle="User Management">
      <section className="cards">
        <div className="card">
          <h2>User Login & Role Access</h2>
          <p>Manage user roles (Admin and standard users) to ensure secure system access. Permissions are defined per role in Admin → Roles.</p>
          <button className="btn primary" onClick={handleManageUsers}>
            {showUserList ? "Hide Users" : "Manage Users"}
          </button>
        </div>
        {isSuperadmin && (
          <div className="card">
            <h2>Create role</h2>
            <p>Add a new role and set its permissions. Then assign it to users in the table below.</p>
            <form onSubmit={handleCreateRole} style={{ marginTop: "0.75rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Role name
                <input
                  type="text"
                  className="input"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. manager"
                  style={{ marginLeft: "0.5rem", width: "180px" }}
                />
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {PERM_LABELS.map(({ key, label }) => (
                  <label key={key} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={newRolePerms[key] !== false}
                      onChange={(e) => setNewRolePerms(togglePerm(newRolePerms, key, e.target.checked))}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <button type="submit" className="btn primary">Create role</button>
            </form>
          </div>
        )}
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

      {showRoles && (
        <section className="table-section">
          <h3>Roles</h3>
          <p style={{ marginBottom: "1rem", color: "var(--text-muted, #64748b)", fontSize: 14 }}>
            View and edit role permissions. Create new roles using the &quot;Create role&quot; card above. Assign a role to a user in the users table.
          </p>
          {rolesLoading ? (
            <p>Loading roles...</p>
          ) : (
            <div className="table-container">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Bookings</th>
                    <th>Rooms</th>
                    <th>Housekeeping</th>
                    <th>Users</th>
                    <th>Reports</th>
                    {isSuperadmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role._id}>
                      <td>
                        <strong>{role.name}</strong>
                        {role.isSystem && (
                          <span className="status-badge" style={{ marginLeft: 8, fontSize: "0.7rem", background: "#64748b", color: "#fff" }}>
                            System
                          </span>
                        )}
                      </td>
                      {editingRoleId === role._id ? (
                        <>
                          {PERM_LABELS.map(({ key }) => (
                            <td key={key}>
                              <input
                                type="checkbox"
                                checked={editRolePerms[key] !== false}
                                onChange={(e) => setEditRolePerms(togglePerm(editRolePerms, key, e.target.checked))}
                              />
                            </td>
                          ))}
                          <td>
                            <button type="button" className="btn-accept" style={{ marginRight: 8 }} onClick={() => handleUpdateRole(role._id, editRolePerms)}>Save</button>
                            <button type="button" className="admin-button secondary" onClick={() => setEditingRoleId(null)}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{role.permissions.manageBookings !== false ? "✓" : "—"}</td>
                          <td>{role.permissions.manageRooms !== false ? "✓" : "—"}</td>
                          <td>{role.permissions.manageHousekeeping !== false ? "✓" : "—"}</td>
                          <td>{role.permissions.manageUsers !== false ? "✓" : "—"}</td>
                          <td>{role.permissions.viewReports !== false ? "✓" : "—"}</td>
                          {isSuperadmin && (
                            <td>
                              {!role.isSystem && (
                                <>
                                  <button
                                    type="button"
                                    className="admin-button secondary"
                                    style={{ marginRight: 8 }}
                                    onClick={() => {
                                      setEditingRoleId(role._id);
                                      setEditRolePerms({ ...role.permissions });
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button type="button" className="btn-decline" onClick={() => handleDeleteRole(role._id, role.name)}>Delete</button>
                                </>
                              )}
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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
                    <th>Status</th>
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
                      <td>
                        {user.isBlocked ? (
                          <span className="status-badge" style={{ background: '#dc2626', color: 'white' }}>Blocked</span>
                        ) : (
                          <span className="status-badge" style={{ background: '#22c55e', color: 'white' }}>Active</span>
                        )}
                      </td>
                      <td>{user.phoneNumber || "—"}</td>
                      <td>{user.isEmailVerified ? "✓" : "✗"}</td>
                      <td>{formatDateShort(user.createdAt)}</td>
                      <td>
                        <div className="action-buttons" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {user.role !== 'superadmin' && (currentUserRole === 'admin' || currentUserRole === 'superadmin') && (
                              user.isBlocked ? (
                                <button
                                  type="button"
                                  className="btn-accept"
                                  style={{ fontSize: '12px', padding: '4px 8px' }}
                                  onClick={() => handleBlockUnblock(user._id, false)}
                                >
                                  Unblock
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-decline"
                                  style={{ fontSize: '12px', padding: '4px 8px' }}
                                  onClick={() => handleBlockUnblock(user._id, true)}
                                >
                                  Block
                                </button>
                              )
                            )}
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="input"
                              style={{ fontSize: '12px', padding: '4px' }}
                              disabled={user.role === 'superadmin' || currentUserRole !== 'superadmin'}
                            >
                              {assignableRoles.map((r) => (
                                <option key={r.name} value={r.name}>{r.label}</option>
                              ))}
                            </select>
                            <Link
                              to={`/admin/bookings?user=${encodeURIComponent(user.firstName + ' ' + user.lastName)}`}
                              className="btn-view"
                              style={{ marginLeft: '8px' }}
                            >
                              Bookings
                            </Link>
                          </div>

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
