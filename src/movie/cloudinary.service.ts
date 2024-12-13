import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

@Injectable()
export class CloudinaryService {
  public storage: CloudinaryStorage;

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });

    this.storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'movies', // The folder in Cloudinary where uploads will be stored
        allowed_formats: ['jpg', 'jpeg', 'png', 'mp4', 'mkv'], // Allowed file formats
        public_id: (req, file) => file.originalname.split('.')[0], // File name without extension
      },
    });
  }

  async upload(file: any) {
    // Implement the upload logic here if needed
  }
}
