import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Types, type Connection } from 'mongoose';
import { GridFSBucket, type Db } from 'mongodb';
import { Readable } from 'stream';
import { UserRole } from '@schemas/user.schema';

const IMAGE_BUCKET = 'images';

@Injectable()
export class UploadsService {
  private readonly bucket: GridFSBucket;

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.bucket = new GridFSBucket(this.getDatabase(), {
      bucketName: IMAGE_BUCKET,
    });
  }

  async uploadImage(file: Express.Multer.File, uploaderId: string) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }

    const uploadStream = this.bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: {
        uploadedBy: new Types.ObjectId(uploaderId),
        uploadedAt: new Date(),
        originalName: file.originalname,
        size: file.size,
      },
    });

    await new Promise<void>((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => resolve());
    });

    const uploadedId = uploadStream.id as Types.ObjectId;

    return {
      id: uploadedId.toString(),
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async getImageStream(fileId: string) {
    const objectId = this.parseObjectId(fileId);
    const db = this.getDatabase();

    const file = await db.collection(`${IMAGE_BUCKET}.files`).findOne({ _id: objectId });

    if (!file) {
      throw new NotFoundException('Image not found');
    }

    const stream = this.bucket.openDownloadStream(objectId);

    return {
      file,
      stream,
    };
  }

  async deleteImage(fileId: string, actor: { id: string; role?: string }) {
    const objectId = this.parseObjectId(fileId);
    const db = this.getDatabase();

    const file = await db.collection(`${IMAGE_BUCKET}.files`).findOne({ _id: objectId });

    if (!file) {
      throw new NotFoundException('Image not found');
    }

    const uploadedBy = file.metadata?.uploadedBy?.toString();
    const canDeleteAny =
      actor.role === UserRole.NATIONAL_ADMIN || actor.role === UserRole.STATE_ADMIN;

    if (!canDeleteAny && uploadedBy !== actor.id) {
      throw new ForbiddenException('You can only delete images uploaded by you');
    }

    await this.bucket.delete(objectId);

    return {
      success: true,
    };
  }

  private parseObjectId(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid image id');
    }

    return new Types.ObjectId(value);
  }

  private getDatabase(): Db {
    if (!this.connection.db) {
      throw new InternalServerErrorException('Database connection is not initialized');
    }

    return this.connection.db;
  }
}
