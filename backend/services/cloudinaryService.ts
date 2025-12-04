import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
}

/**
 * Upload a file buffer to Cloudinary
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'room-images'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
          });
        } else {
          reject(new Error('No result from Cloudinary'));
        }
      }
    ).end(fileBuffer);
  });
};

/**
 * Upload multiple files to Cloudinary
 */
export const uploadMultipleToCloudinary = async (
  files: { buffer: Buffer }[],
  folder: string = 'room-images'
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadToCloudinary(file.buffer, folder);
    results.push(result);
  }

  return results;
};

/**
 * Delete a file from Cloudinary by public ID
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

/**
 * Extract public ID from a Cloudinary URL
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  // URL format: https://res.cloudinary.com/CLOUD_NAME/image/upload/v1234567890/folder/filename.jpg
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
};
