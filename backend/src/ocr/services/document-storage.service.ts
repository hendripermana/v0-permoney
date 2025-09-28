import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Express } from 'express';

@Injectable()
export class DocumentStorageService {
  private readonly logger = new Logger(DocumentStorageService.name);
  private readonly uploadPath: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads/documents');
    this.ensureUploadDirectory();
  }

  async storeDocument(file: Express.Multer.File, householdId: string): Promise<string> {
    this.logger.log(`Storing document for household: ${householdId}`);

    try {
      // Validate inputs
      if (!file || !file.buffer) {
        throw new Error('Invalid file: No file data provided');
      }

      if (!householdId || typeof householdId !== 'string') {
        throw new Error('Invalid household ID');
      }

      // Sanitize household ID to prevent path traversal
      const sanitizedHouseholdId = householdId.replace(/[^a-zA-Z0-9-]/g, '');
      if (sanitizedHouseholdId !== householdId) {
        throw new Error('Invalid household ID format');
      }

      // Generate secure filename
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const fileName = `${uuidv4()}${fileExtension}`;
      const householdDir = path.resolve(this.uploadPath, sanitizedHouseholdId);
      const filePath = path.join(householdDir, fileName);

      // Security check: Ensure the resolved path is within upload directory
      if (!filePath.startsWith(path.resolve(this.uploadPath))) {
        throw new Error('Invalid file path: Path traversal detected');
      }

      // Ensure household directory exists
      await this.ensureDirectory(householdDir);

      // Write file to disk with proper permissions
      await fs.writeFile(filePath, file.buffer, { mode: 0o644 });

      // Return storage URL (relative path for now, could be cloud URL in production)
      const storageUrl = `documents/${sanitizedHouseholdId}/${fileName}`;
      
      this.logger.log(`Document stored successfully: ${storageUrl}`);
      return storageUrl;
    } catch (error) {
      this.logger.error(`Failed to store document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDocument(storageUrl: string): Promise<Buffer> {
    this.logger.log(`Retrieving document: ${storageUrl}`);

    try {
      // Validate and sanitize storage URL
      if (!storageUrl || typeof storageUrl !== 'string') {
        throw new Error('Invalid storage URL');
      }

      // Prevent path traversal attacks
      if (storageUrl.includes('..') || storageUrl.includes('~') || path.isAbsolute(storageUrl)) {
        throw new Error('Invalid storage URL: Path traversal detected');
      }

      // Construct safe file path
      const filePath = path.resolve(this.uploadPath, '..', storageUrl);
      
      // Security check: Ensure the resolved path is within allowed directory
      const allowedBasePath = path.resolve(this.uploadPath, '..');
      if (!filePath.startsWith(allowedBasePath)) {
        throw new Error('Invalid file path: Access denied');
      }

      // Check if file exists before reading
      try {
        await fs.access(filePath, fs.constants.R_OK);
      } catch {
        throw new Error('File not found or access denied');
      }

      const fileBuffer = await fs.readFile(filePath);
      
      this.logger.log(`Document retrieved successfully: ${storageUrl}`);
      return fileBuffer;
    } catch (error) {
      this.logger.error(`Failed to retrieve document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteDocument(storageUrl: string): Promise<void> {
    this.logger.log(`Deleting document: ${storageUrl}`);

    try {
      const filePath = path.join(this.uploadPath, '..', storageUrl);
      await fs.unlink(filePath);
      
      this.logger.log(`Document deleted successfully: ${storageUrl}`);
    } catch (error) {
      this.logger.error(`Failed to delete document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDocumentMetadata(storageUrl: string): Promise<{
    size: number;
    mimeType: string;
    lastModified: Date;
  }> {
    this.logger.log(`Getting document metadata: ${storageUrl}`);

    try {
      const filePath = path.join(this.uploadPath, '..', storageUrl);
      const stats = await fs.stat(filePath);
      
      // Determine MIME type based on file extension
      const extension = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeTypeFromExtension(extension);

      return {
        size: stats.size,
        mimeType,
        lastModified: stats.mtime,
      };
    } catch (error) {
      this.logger.error(`Failed to get document metadata: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadPath}`);
    }
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}
