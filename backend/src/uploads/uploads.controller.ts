import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { imageFilenameSchema } from '../common/image-url.schema';
import { MAX_IMAGE_BYTES, UploadsService } from './uploads.service';

@Controller('uploads/images')
@UseGuards(AdminJwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0, parts: 2 },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    return this.uploadsService.upload(file);
  }

  @Delete(':filename')
  delete(@Param('filename', { schema: imageFilenameSchema }) filename: string) {
    return this.uploadsService.delete(filename);
  }
}
