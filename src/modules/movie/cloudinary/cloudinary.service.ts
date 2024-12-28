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
import { pipeline, Readable } from 'stream';
import { promisify } from 'util';

// const pipelineAsync = promisify(pipeline);
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
    existingUrls: { poster?: string; video?: string },
    files: { poster?: Express.Multer.File; video?: Express.Multer.File },
  ): Promise<{ poster?: string; video?: string }> {
    const updates: { poster?: string; video?: string } = {};

    try {
      if (files.poster) {
        if (existingUrls.poster) {
          const posterPublicId = this.extractPublicId(existingUrls.poster);
          await this.delete(posterPublicId, 'image');
        }
        const posterUpload = await this.upload(files.poster, 'posters');
        updates.poster = posterUpload.secure_url;
      }

      if (files.video) {
        if (existingUrls.video) {
          const videoPublicId = this.extractPublicId(existingUrls.video);
          await this.delete(videoPublicId, 'video');
        }
        const videoUpload = await this.upload(files.video, 'videos');
        updates.video = videoUpload.secure_url;
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
    video: string,
    res: Response,
    range: string,
  ): Promise<void> {
    try {
      // Parse the range if available
      const headers: Record<string, string> = {};
      if (range) {
        headers.Range = range;
      }

      // Send a request to Cloudinary for the video stream
      const cloudinaryResponse = await fetch(video, { headers });

      if (!cloudinaryResponse.ok) {
        throw new NotFoundException('Failed to fetch video from Cloudinary');
      }

      // Forward headers from Cloudinary's response to the client
      const responseHeaders: Record<string, string> = {};
      cloudinaryResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Set response headers
      res.writeHead(cloudinaryResponse.status, responseHeaders);

      // Convert ReadableStream to Node.js Readable
      const reader = cloudinaryResponse.body.getReader();
      const stream = new Readable({
        async read() {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null); // End the stream
          } else {
            this.push(Buffer.from(value)); // Push chunks to the stream
          }
        },
      });

      // Pipe the converted stream to the response
      stream.pipe(res);
    } catch (error) {
      console.error('Error while streaming movie from Cloudinary:', error);
      throw new InternalServerErrorException('Failed to stream movie');
    }
  }

  async cleanDB() {
    console.log('Environment:', process.env.NODE_ENV);
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDB can only be run in test environment');
    }
    console.log('Cleaning Cloudinary resources...');

    try {
      // Delete all images in bulk
      const imageResources = await cloudinary.api.resources({
        resource_type: 'image',
        type: 'upload',
        max_results: 500,
      });
      const imageIds = imageResources.resources.map(
        (resource) => resource.public_id,
      );
      if (imageIds.length > 0) {
        await cloudinary.api.delete_resources(imageIds, {
          resource_type: 'image',
        });
      }

      // Delete all videos in bulk
      const videoResources = await cloudinary.api.resources({
        resource_type: 'video',
        type: 'upload',
        max_results: 500,
      });
      const videoIds = videoResources.resources.map(
        (resource) => resource.public_id,
      );
      if (videoIds.length > 0) {
        await cloudinary.api.delete_resources(videoIds, {
          resource_type: 'video',
        });
      }

      console.log('Cloudinary resources cleaned successfully.');
    } catch (error) {
      console.error('Cloudinary CleanDB Error:', error);
      throw new InternalServerErrorException(
        'Failed to clean Cloudinary resources',
      );
    }
  }
}
