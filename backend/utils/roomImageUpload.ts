import multer from "multer";

// Use memory storage for Google Drive uploads
const roomImageStorage = multer.memoryStorage();

export const uploadRoomImages = multer({
  storage: roomImageStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
  limits: { 
    files: 5,
    fileSize: 10 * 1024 * 1024, // 10MB max per file
  },
});
