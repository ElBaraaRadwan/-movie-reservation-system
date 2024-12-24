import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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

  // Helper function to extract the public ID from a Cloudinary URL
  private extractPublicId(cloudinaryUrl: string): string {
    const urlParts = cloudinaryUrl.split('/');
    const fileName = urlParts.pop();
    const folder = urlParts.pop();
    const publicId = fileName.split('.')[0];
    return `${folder}/${publicId}`;
  }

  async upload(file: Express.Multer.File, folder: string): Promise<any> {
    const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'video';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        },
      );

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  }

  async delete(publicId: string, resourceType: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      console.error('Cloudinary Delete Error:', error);
      throw new InternalServerErrorException(
        'Failed to delete resource from Cloudinary',
      );
    }
  }

  async update(
    existingUrls: { poster?: string; videoUrl?: string },
    files: { poster?: Express.Multer.File; videoUrl?: Express.Multer.File },
  ): Promise<{ poster?: string; videoUrl?: string }> {
    const updates: { poster?: string; videoUrl?: string } = {};

    try {
      if (files.poster) {
        if (existingUrls.poster) {
          const posterPublicId = this.extractPublicId(existingUrls.poster);
          await this.delete(posterPublicId, 'image');
        }
        const posterUpload = await this.upload(files.poster, 'posters');
        updates.poster = posterUpload.secure_url;
      }

      if (files.videoUrl) {
        if (existingUrls.videoUrl) {
          const videoPublicId = this.extractPublicId(existingUrls.videoUrl);
          await this.delete(videoPublicId, 'video');
        }
        const videoUpload = await this.upload(files.videoUrl, 'videos');
        updates.videoUrl = videoUpload.secure_url;
      }

      return updates;
    } catch (error) {
      console.error('Cloudinary Update Error:', error);
      throw new InternalServerErrorException(
        'Failed to update Cloudinary resources',
      );
    }
  }

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

    try {
      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
          throw new NotFoundException('Invalid range');
        }

        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4',
        });

        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        });

        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      console.error('Error while streaming movie:', error);
      throw new InternalServerErrorException('Failed to stream movie');
    }
  }
}
