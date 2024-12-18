import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
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
  }

  async upload(file: Express.Multer.File): Promise<any> {
    try {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: 'movies', // Folder name on Cloudinary
        resource_type: 'auto', // Automatically detect the file type
        public_id: path.parse(file.originalname).name, // Use file name without extension
      });

      // Delete the local file after successful upload
      fs.unlinkSync(file.path);
      return uploadResult;
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error}`);
    }
  }

  // Stream a movie by file path
  async streamMovie(
    filePath: string,
    res: Response,
    range: string,
  ): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Movie file not found');
    }

    const movieStats = fs.statSync(filePath);
    const fileSize = movieStats.size;

    if (range) {
      // Parse the Range header to determine the chunk to send
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        throw new NotFoundException('Invalid range');
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      // Send the partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      fileStream.pipe(res);
    } else {
      // Send the entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  }
}
