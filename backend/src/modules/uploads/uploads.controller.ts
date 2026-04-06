import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@Controller('uploads')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload incident/conservation image to MongoDB GridFS' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  uploadImage(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.uploadsService.uploadImage(file, user._id || user.id);
  }

  @Get('images/:id')
  @ApiOperation({ summary: 'Download image by GridFS id' })
  @ApiResponse({ status: 200, description: 'Image stream' })
  async getImage(@Param('id') id: string, @Res() response: Response) {
    const { stream, file } = await this.uploadsService.getImageStream(id);

    response.setHeader('Content-Type', file.contentType || 'application/octet-stream');

    if (file.length) {
      response.setHeader('Content-Length', String(file.length));
    }

    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    stream.pipe(response);
  }

  @Delete('images/:id')
  @ApiOperation({ summary: 'Delete image from GridFS' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  deleteImage(@Param('id') id: string, @CurrentUser() user: any) {
    return this.uploadsService.deleteImage(id, {
      id: user._id || user.id,
      role: user.role,
    });
  }
}
