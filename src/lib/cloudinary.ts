import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxrtxojca',
  api_key: process.env.CLOUDINARY_API_KEY || '459296421142521',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ErJ_jGmUDh9UD7Ft6kG5T9kWKx0',
});

/**
 * Uploads an audio buffer directly to Cloudinary
 */
export async function uploadAudioBuffer(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'vet-klinika/audio',
        resource_type: 'video', // Cloudinary handles audio files under 'video' or 'auto' resource_type
        public_id: filename.replace(/\.[^/.]+$/, "")
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary audio upload error:', error);
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    ).end(buffer);
  });
}

/**
 * Uploads an image buffer to Cloudinary
 */
export async function uploadImageBuffer(buffer: Buffer, folder: string = 'vet-klinika/images'): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary image upload error:', error);
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    ).end(buffer);
  });
}

export default cloudinary;
