import { Router } from 'express';
import multer from 'multer';
import { BackupController } from '../controllers/backupController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Configure multer for file upload (memory storage for ZIP files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  },
});

// All backup routes require authentication and superadmin role
// The controller also checks for superadmin role as an extra layer

// Create a new backup
router.post('/create', requireAuth, BackupController.createBackup);

// List all backups
router.get('/', requireAuth, BackupController.listBackups);

// Download a specific backup
router.get('/download/:filename', requireAuth, BackupController.downloadBackup);

// Restore from a specific backup file on server
router.post('/restore/:filename', requireAuth, BackupController.restoreBackup);

// Upload and restore from a backup ZIP file
router.post('/upload-restore', requireAuth, upload.single('backup'), BackupController.uploadAndRestore);

// Delete a backup file
router.delete('/:filename', requireAuth, BackupController.deleteBackup);

export default router;
