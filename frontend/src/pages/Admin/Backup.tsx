import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Database, Download, RotateCcw, Trash2, RefreshCw, AlertTriangle, Upload } from "lucide-react";
import Swal from "sweetalert2";
import "../../styles/main.css";
import AdminLayout from "../../components/AdminLayout";
import { API_BASE_URL } from "../../config/api";
import {
  createBackup,
  listBackups,
  downloadBackup,
  restoreBackup,
  deleteBackup,
  uploadAndRestore,
  downloadBlobAsFile,
  BackupInfo,
} from "../../api/backup";

function AdminBackup() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user role on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data?.data?.role || null);
        }
      } catch {
        // ignore errors
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load backups when role is confirmed
  useEffect(() => {
    if (userRole === "superadmin") {
      loadBackups();
    }
  }, [userRole]);

  const loadBackups = async () => {
    try {
      const data = await listBackups();
      setBackups(data);
    } catch (err) {
      console.error("Failed to load backups:", err);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await createBackup();
      await loadBackups();
      Swal.fire({
        icon: "success",
        title: "Backup Created",
        text: `Backup created successfully: ${result.filename}`,
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Backup Failed",
        text: err instanceof Error ? err.message : "Failed to create backup",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const blob = await downloadBackup(filename);
      downloadBlobAsFile(blob, filename);
      Swal.fire({
        icon: "success",
        title: "Download Started",
        text: "Your backup file is downloading.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: err instanceof Error ? err.message : "Failed to download backup",
      });
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Restore Backup?",
      html: `<p>This will <strong>replace ALL current data</strong> with the backup from:</p><p><code>${filename}</code></p><p>This action cannot be undone!</p>`,
      showCancelButton: true,
      confirmButtonText: "Yes, Restore",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    setBackupLoading(true);
    try {
      await restoreBackup(filename);
      Swal.fire({
        icon: "success",
        title: "Database Restored",
        text: "Database restored successfully! You may need to log in again.",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Restore Failed",
        text: err instanceof Error ? err.message : "Failed to restore backup",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Backup?",
      html: `<p>Are you sure you want to delete this backup?</p><p><code>${filename}</code></p><p>This action cannot be undone!</p>`,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    setBackupLoading(true);
    try {
      await deleteBackup(filename);
      await loadBackups();
      Swal.fire({
        icon: "success",
        title: "Backup Deleted",
        text: "Backup deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err instanceof Error ? err.message : "Failed to delete backup",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please select a ZIP backup file",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Restore from Upload?",
      html: `<p>This will <strong>replace ALL current data</strong> with the uploaded backup:</p><p><code>${file.name}</code></p><p>This action cannot be undone!</p>`,
      showCancelButton: true,
      confirmButtonText: "Yes, Restore",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setBackupLoading(true);
    try {
      await uploadAndRestore(file);
      await loadBackups();
      Swal.fire({
        icon: "success",
        title: "Database Restored",
        text: "Database restored from uploaded file! You may need to log in again.",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Restore Failed",
        text: err instanceof Error ? err.message : "Failed to restore from file",
      });
    } finally {
      setBackupLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const extractBackupId = (filename: string) => {
    // Extract timestamp portion from filename like "backup-1733123456789.zip"
    return filename.replace("backup-", "").replace(".zip", "");
  };

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (userRole !== "superadmin") return <Navigate to="/admin" replace />;

  return (
    <AdminLayout pageTitle="Backup & Restore">
      <div className="backup-page">
        {/* Header */}
        <div className="backup-header">
          <h1>Backup & Restore</h1>
          <p>Create and manage database backups stored locally.</p>
        </div>

        {/* Warning Banner */}
        <div className="backup-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Important Information</strong>
            <p>Restoring a backup will replace ALL current data. Always create a new backup before restoring to prevent data loss.</p>
          </div>
        </div>

        {/* Create Backup Section */}
        <div className="backup-section">
          <h2><Database size={20} /> Create New Backup</h2>
          <p>Creates a complete backup of all collections as a ZIP file: bookings, users, rooms, and more. Stored in C:\database_backup.</p>
          <div className="backup-actions-row">
            <button
              className="backup-create-btn"
              onClick={handleCreateBackup}
              disabled={backupLoading}
            >
              <Database size={18} />
              {backupLoading ? "Creating Backup..." : "Create Backup Now"}
            </button>
            <input
              type="file"
              accept=".zip"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: "none" }}
              id="backup-file-input"
            />
            <button
              className="backup-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={backupLoading}
            >
              <Upload size={18} />
              Upload & Restore
            </button>
          </div>
        </div>

        {/* Backup History Section */}
        <div className="backup-section">
          <div className="backup-history-header">
            <h2><Database size={20} /> Backup History</h2>
            <button className="backup-refresh-btn" onClick={loadBackups} disabled={backupLoading}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {backups.length === 0 ? (
            <div className="backup-empty">
              <p>No backups available. Create your first backup above.</p>
            </div>
          ) : (
            <div className="backup-table-container">
              <table className="backup-table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Size</th>
                    <th>Records</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.filename}>
                      <td>
                        <div className="backup-date">
                          <strong>{formatDate(backup.createdAt)}</strong>
                          <span className="backup-id">{extractBackupId(backup.filename)}</span>
                        </div>
                      </td>
                      <td>{formatFileSize(backup.size)}</td>
                      <td>
                        {backup.metadata ? (
                          <span className="backup-records">
                            {backup.metadata.collections.users} users, {backup.metadata.collections.rooms} rooms, {backup.metadata.collections.bookings} bookings
                          </span>
                        ) : (
                          <span className="backup-records">-</span>
                        )}
                      </td>
                      <td>
                        <div className="backup-actions">
                          <button
                            className="backup-action-btn restore"
                            onClick={() => handleRestoreBackup(backup.filename)}
                            disabled={backupLoading}
                          >
                            <RotateCcw size={14} /> Restore
                          </button>
                          <button
                            className="backup-action-btn download"
                            onClick={() => handleDownloadBackup(backup.filename)}
                            disabled={backupLoading}
                          >
                            <Download size={14} /> Download
                          </button>
                          <button
                            className="backup-action-btn delete"
                            onClick={() => handleDeleteBackup(backup.filename)}
                            disabled={backupLoading}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .backup-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .backup-header {
          margin-bottom: 1.5rem;
        }

        .backup-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-primary, #1a1a1a);
        }

        .backup-header p {
          color: var(--text-secondary, #666);
        }

        .backup-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          color: #92400e;
        }

        .backup-warning svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .backup-warning strong {
          display: block;
          margin-bottom: 0.25rem;
          color: #78350f;
        }

        .backup-warning p {
          margin: 0;
          font-size: 0.9rem;
        }

        .backup-message {
          padding: 1rem 1.25rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .backup-message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #10b981;
        }

        .backup-message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #ef4444;
        }

        .backup-section {
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .backup-section h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary, #1a1a1a);
        }

        .backup-section > p {
          color: var(--text-secondary, #666);
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .backup-actions-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .backup-create-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .backup-create-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .backup-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .backup-upload-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .backup-upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .backup-create-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .backup-history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .backup-history-header h2 {
          margin-bottom: 0;
        }

        .backup-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-secondary, #f3f4f6);
          color: var(--text-secondary, #666);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .backup-refresh-btn:hover:not(:disabled) {
          background: var(--bg-hover, #e5e7eb);
        }

        .backup-empty {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary, #666);
        }

        .backup-table-container {
          overflow-x: auto;
        }

        .backup-table {
          width: 100%;
          border-collapse: collapse;
        }

        .backup-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary, #666);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .backup-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          vertical-align: middle;
        }

        .backup-table tr:last-child td {
          border-bottom: none;
        }

        .backup-table tr:hover {
          background: var(--bg-hover, #f9fafb);
        }

        .backup-date {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .backup-date strong {
          color: var(--text-primary, #1a1a1a);
        }

        .backup-id {
          font-size: 0.75rem;
          color: var(--text-tertiary, #999);
          font-family: monospace;
        }

        .backup-records {
          font-size: 0.85rem;
          color: var(--text-secondary, #666);
        }

        .backup-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .backup-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .backup-action-btn.restore {
          background: #fef3c7;
          color: #92400e;
        }

        .backup-action-btn.restore:hover:not(:disabled) {
          background: #fde68a;
        }

        .backup-action-btn.download {
          background: var(--bg-secondary, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .backup-action-btn.download:hover:not(:disabled) {
          background: var(--bg-hover, #e5e7eb);
        }

        .backup-action-btn.delete {
          background: #fee2e2;
          color: #991b1b;
        }

        .backup-action-btn.delete:hover:not(:disabled) {
          background: #fecaca;
        }

        .backup-action-btn.confirm {
          background: #fef3c7;
          color: #92400e;
        }

        .backup-action-btn.confirm-delete {
          background: #ef4444;
          color: white;
        }

        .backup-action-btn.cancel {
          background: var(--bg-secondary, #f3f4f6);
          color: var(--text-secondary, #666);
        }

        .backup-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Dark mode support */
        [data-theme="dark"] .backup-warning {
          background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
          border-color: #b45309;
          color: #fef3c7;
        }

        [data-theme="dark"] .backup-warning strong {
          color: #fde68a;
        }

        [data-theme="dark"] .backup-action-btn.restore {
          background: #78350f;
          color: #fef3c7;
        }

        [data-theme="dark"] .backup-action-btn.delete {
          background: #7f1d1d;
          color: #fecaca;
        }
      `}</style>
    </AdminLayout>
  );
}

export default AdminBackup;
