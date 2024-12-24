import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import { Response } from 'express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Readable } from 'stream';

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

  async upload(file: Express.Multer.File, folder: string): Promise<any> {
    console.log('Cloudinary Received File:', file); // Log the received file

    const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'video'; // Determine the resource type

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType }, // Explicitly set resource type
        (error, result) => {
          if (error) {
            console.log('Cloudinary Upload Error:', error); // Log the upload error

            return reject(error);
          }
          resolve(result);
        },
      );

      console.log('Upload stream:', uploadStream); // Log the upload stream
      const bufferStream = new Readable();
      console.log('File buffer:', file.buffer); // Log the file buffer Before
      bufferStream.push(file.buffer);
      bufferStream.push(null); // End the stream
      bufferStream.pipe(uploadStream);
      console.log('Buffer stream:', bufferStream); // Log the buffer stream After
    });
  }

  // Stream a movie by file path
  async streamMovie(
    filePath: string,
    res: Response,
    range: string,
  ): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Movie not found');
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
