import { API_BASE_URL } from '../config/api';

const BASE = API_BASE_URL;

export interface BackupMetadata {
  createdAt: string;
  version: string;
  collections: {
    users: number;
    rooms: number;
    bookings: number;
    notifications: number;
    feedback: number;
    roomReviews: number;
    deletedUsers: number;
  };
}

export interface BackupInfo {
  filename: string;
  size: number;
  createdAt: string;
  metadata: BackupMetadata | null;
}

// Create a new backup
export async function createBackup(): Promise<{ message: string; filename: string; metadata: BackupMetadata }> {
  const res = await fetch(`${BASE}/backup/create`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create backup');
  return await res.json();
}

// List all backups
export async function listBackups(): Promise<BackupInfo[]> {
  const res = await fetch(`${BASE}/backup`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to list backups');
  const json = await res.json();
  return json.backups || [];
}

// Download a backup file
export async function downloadBackup(filename: string): Promise<Blob> {
  const res = await fetch(`${BASE}/backup/download/${encodeURIComponent(filename)}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to download backup');
  return await res.blob();
}

// Restore from a backup file on server
export async function restoreBackup(filename: string): Promise<{ message: string; results: Record<string, { inserted: number }> }> {
  const res = await fetch(`${BASE}/backup/restore/${encodeURIComponent(filename)}`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to restore backup');
  return await res.json();
}

// Upload and restore from a backup ZIP file
export async function uploadAndRestore(file: File): Promise<{ message: string; results: Record<string, { inserted: number }> }> {
  const formData = new FormData();
  formData.append('backup', file);
  
  const res = await fetch(`${BASE}/backup/upload-restore`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to restore from uploaded backup');
  return await res.json();
}

// Delete a backup file
export async function deleteBackup(filename: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/backup/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete backup');
  return await res.json();
}

// Helper to trigger download of a blob as a file
export function downloadBlobAsFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

