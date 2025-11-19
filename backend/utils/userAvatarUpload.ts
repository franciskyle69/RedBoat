import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

export const AVATAR_DIR = "uploads/avatars";

if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Always store avatars as optimized JPEGs
    cb(null, unique + ".jpg");
  },
});

export const uploadUserAvatar = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
  limits: { files: 1 },
});

export const optimizeAvatarImage = async (filename: string) => {
  const filePath = path.join(AVATAR_DIR, filename);
  const tempPath = `${filePath}.tmp`;

  try {
    await sharp(filePath)
      .resize(256, 256, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toFile(tempPath);

    await fs.promises.rename(tempPath, filePath);
  } catch (err) {
    console.error("Failed to optimize avatar image", err);
    // best-effort optimization; keep original file if optimization fails
    if (fs.existsSync(tempPath)) {
      try {
        await fs.promises.unlink(tempPath);
      } catch {
        // ignore cleanup errors
      }
    }
  }
};
