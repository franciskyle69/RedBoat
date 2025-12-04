import { Response } from 'express';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import { AuthenticatedRequest } from '../middleware/auth';

// Import all models to backup
import { User } from '../models/User';
import { Room } from '../models/Room';
import { Booking } from '../models/Booking';
import { Notification } from '../models/Notification';
import { Feedback } from '../models/Feedback';
import { RoomReview } from '../models/RoomReview';
import { DeletedUser } from '../models/DeletedUser';

// Backup directory - external location for safety
const BACKUP_DIR = 'C:\\database_backup';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Collection names for backup
const COLLECTION_NAMES = ['users', 'rooms', 'bookings', 'notifications', 'feedback', 'roomReviews', 'deletedUsers'] as const;

// Helper to get model by name
function getModelByName(name: string) {
  switch (name) {
    case 'users': return User;
    case 'rooms': return Room;
    case 'bookings': return Booking;
    case 'notifications': return Notification;
    case 'feedback': return Feedback;
    case 'roomReviews': return RoomReview;
    case 'deletedUsers': return DeletedUser;
    default: return null;
  }
}

export class BackupController {
  // Create a full database backup as ZIP (superadmin only)
  static async createBackup(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
      }

      console.log('[Backup] Starting database backup...');

      // Generate timestamp for backup folder name
      const timestamp = Date.now();
      const backupName = `backup-${timestamp}`;
      const zipFilename = `${backupName}.zip`;
      const zipFilepath = path.join(BACKUP_DIR, zipFilename);

      // Fetch all data from each collection
      const collectionData: Record<string, any[]> = {};
      const metadata: Record<string, number> = {};

      for (const name of COLLECTION_NAMES) {
        const model = getModelByName(name);
        if (model) {
          const data = await (model as any).find({}).lean();
          collectionData[name] = data as any[];
          metadata[name] = data.length;
        }
      }

      // Create ZIP file
      const output = fs.createWriteStream(zipFilepath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      await new Promise<void>((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);

        archive.pipe(output);

        // Add metadata file
        const metadataContent = {
          createdAt: new Date().toISOString(),
          timestamp,
          version: '1.0',
          collections: metadata,
        };
        archive.append(JSON.stringify(metadataContent, null, 2), { name: 'metadata.json' });

        // Add each collection as separate JSON file
        for (const name of COLLECTION_NAMES) {
          const data = collectionData[name];
          archive.append(JSON.stringify(data, null, 2), { name: `${name}.json` });
        }

        archive.finalize();
      });

      const stats = fs.statSync(zipFilepath);

      console.log(`[Backup] Backup created successfully: ${zipFilename} (${stats.size} bytes)`);

      res.json({
        message: 'Backup created successfully',
        filename: zipFilename,
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0',
          collections: metadata,
        },
      });
    } catch (err) {
      console.error('[Backup] Failed to create backup:', err);
      res.status(500).json({
        message: 'Failed to create backup',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Download a backup file
  static async downloadBackup(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
      }

      const { filename } = req.params;
      
      if (!filename || !filename.endsWith('.zip')) {
        return res.status(400).json({ message: 'Invalid backup filename' });
      }

      const filepath = path.join(BACKUP_DIR, filename);

      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: 'Backup file not found' });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(filepath);
    } catch (err) {
      console.error('[Backup] Failed to download backup:', err);
      res.status(500).json({
        message: 'Failed to download backup',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // List all available backups
  static async listBackups(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
      }

      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.zip'))
        .map(filename => {
          const filepath = path.join(BACKUP_DIR, filename);
          const stats = fs.statSync(filepath);
          
          // Try to read metadata from the ZIP file
          let metadata = null;
          try {
            const zip = new AdmZip(filepath);
            const metadataEntry = zip.getEntry('metadata.json');
            if (metadataEntry) {
              const content = zip.readAsText(metadataEntry);
              metadata = JSON.parse(content);
            }
          } catch {
            // Ignore parse errors
          }

          return {
            filename,
            size: stats.size,
            createdAt: stats.birthtime,
            metadata,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ backups: files });
    } catch (err) {
      console.error('[Backup] Failed to list backups:', err);
      res.status(500).json({
        message: 'Failed to list backups',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Delete a backup file
  static async deleteBackup(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
      }

      const { filename } = req.params;
      
      if (!filename || !filename.endsWith('.zip')) {
        return res.status(400).json({ message: 'Invalid backup filename' });
      }

      const filepath = path.join(BACKUP_DIR, filename);

      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: 'Backup file not found' });
      }

      fs.unlinkSync(filepath);

      console.log(`[Backup] Backup deleted: ${filename}`);

      res.json({ message: 'Backup deleted successfully' });
    } catch (err) {
      console.error('[Backup] Failed to delete backup:', err);
      res.status(500).json({
        message: 'Failed to delete backup',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Restore database from a backup ZIP file (superadmin only)
  static async restoreBackup(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
      }

      const { filename } = req.params;
      
      if (!filename || !filename.endsWith('.zip')) {
        return res.status(400).json({ message: 'Invalid backup filename' });
      }

      const filepath = path.join(BACKUP_DIR, filename);

      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: 'Backup file not found' });
      }

      console.log(`[Backup] Starting restore from: ${filename}`);

      // Read ZIP file
      const zip = new AdmZip(filepath);
      const results: Record<string, { deleted: number; inserted: number }> = {};
      let backupMetadata = null;

      // Read metadata
      const metadataEntry = zip.getEntry('metadata.json');
      if (metadataEntry) {
        backupMetadata = JSON.parse(zip.readAsText(metadataEntry));
      }

      // Restore each collection from its JSON file
      for (const name of COLLECTION_NAMES) {
        const entry = zip.getEntry(`${name}.json`);
        if (entry) {
          const data = JSON.parse(zip.readAsText(entry));
          const model = getModelByName(name);
          if (Array.isArray(data) && model) {
            await (model as any).deleteMany({});
            if (data.length > 0) {
              await (model as any).insertMany(data);
            }
            results[name] = { deleted: -1, inserted: data.length };
          }
        }
      }

      console.log('[Backup] Restore completed successfully');

      res.json({
        message: 'Database restored successfully',
        restoredFrom: filename,
        originalBackupDate: backupMetadata?.createdAt,
        results,
      });
    } catch (err) {
      console.error('[Backup] Failed to restore backup:', err);
      res.status(500).json({
        message: 'Failed to restore backup',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Upload and restore from a backup ZIP file (multipart form data)
  static async uploadAndRestore(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user!;
      
      if (payload.role !== 'superadmin') {
        return res.status(403).json({ message: 'Superadmin access required' });
      }

      // Check if file was uploaded
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ message: 'No backup file uploaded' });
      }

      console.log('[Backup] Starting restore from uploaded file...');

      // Read ZIP from buffer
      const zip = new AdmZip(file.buffer);
      const results: Record<string, { deleted: number; inserted: number }> = {};
      let backupMetadata = null;

      // Read metadata
      const metadataEntry = zip.getEntry('metadata.json');
      if (metadataEntry) {
        backupMetadata = JSON.parse(zip.readAsText(metadataEntry));
      }

      // Restore each collection from its JSON file
      for (const name of COLLECTION_NAMES) {
        const entry = zip.getEntry(`${name}.json`);
        if (entry) {
          const data = JSON.parse(zip.readAsText(entry));
          const model = getModelByName(name);
          if (Array.isArray(data) && model) {
            await (model as any).deleteMany({});
            if (data.length > 0) {
              await (model as any).insertMany(data);
            }
            results[name] = { deleted: -1, inserted: data.length };
          }
        }
      }

      console.log('[Backup] Restore from upload completed successfully');

      res.json({
        message: 'Database restored successfully from uploaded file',
        originalBackupDate: backupMetadata?.createdAt,
        results,
      });
    } catch (err) {
      console.error('[Backup] Failed to restore from upload:', err);
      res.status(500).json({
        message: 'Failed to restore from uploaded backup',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
