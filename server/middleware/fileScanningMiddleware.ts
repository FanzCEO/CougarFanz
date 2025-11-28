import { Request, Response, NextFunction } from 'express';
import { fileSecurityScanner, ScanResult } from '../services/FileSecurityScanner';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Middleware to scan uploaded files for viruses and malware
 * Works with both multer memory storage and disk storage
 */
export async function scanUploadedFiles(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filesToScan: { file: Express.Multer.File; scanResult?: ScanResult }[] = [];

    // Collect all files from request
    if (req.file) {
      filesToScan.push({ file: req.file });
    }
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(file => filesToScan.push({ file }));
      } else {
        Object.values(req.files).forEach(fileArray => {
          if (Array.isArray(fileArray)) {
            fileArray.forEach(file => filesToScan.push({ file }));
          }
        });
      }
    }

    // If no files, continue
    if (filesToScan.length === 0) {
      return next();
    }

    console.log(`[FileScanningMiddleware] Scanning ${filesToScan.length} file(s)`);

    // Scan all files
    const scanPromises = filesToScan.map(async ({ file }) => {
      let tempFilePath: string | null = null;
      let shouldDeleteTemp = false;

      try {
        // If file is in memory, write to temp file for scanning
        if (file.buffer) {
          tempFilePath = path.join(os.tmpdir(), `scan_${Date.now()}_${file.originalname}`);
          await fs.writeFile(tempFilePath, file.buffer);
          shouldDeleteTemp = true;
        } else if (file.path) {
          // File is already on disk
          tempFilePath = file.path;
        }

        if (!tempFilePath) {
          throw new Error('No file path available for scanning');
        }

        // Scan the file
        const scanResult = await fileSecurityScanner.scanFile(tempFilePath, {
          fileName: file.originalname,
          mimeType: file.mimetype,
          uploadedBy: (req as any).user?.id || 'anonymous',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        });

        // Clean up temp file if needed (unless quarantined)
        if (shouldDeleteTemp && !scanResult.quarantined) {
          await fs.unlink(tempFilePath).catch(() => {});
        }

        return { file, scanResult };
      } catch (error) {
        console.error('[FileScanningMiddleware] Scan error:', error);

        // Clean up temp file on error
        if (tempFilePath && shouldDeleteTemp) {
          await fs.unlink(tempFilePath).catch(() => {});
        }

        return {
          file,
          scanResult: {
            status: 'error' as const,
            fileHash: '',
            fileName: file.originalname,
            fileSize: file.size,
            threats: [`Scan error: ${error instanceof Error ? error.message : 'Unknown error'}`],
            scanEngine: ['Error Handler'],
            timestamp: new Date(),
            quarantined: false,
            metadata: {
              mimeType: file.mimetype,
              uploadedBy: (req as any).user?.id || 'anonymous',
              ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            },
          },
        };
      }
    });

    const scanResults = await Promise.all(scanPromises);

    // Check if any files are infected or quarantined
    const infectedFiles = scanResults.filter(
      result => result.scanResult.status === 'infected' ||
                result.scanResult.status === 'quarantined'
    );

    if (infectedFiles.length > 0) {
      // Log the threat
      console.error('[FileScanningMiddleware] THREAT DETECTED:', {
        count: infectedFiles.length,
        files: infectedFiles.map(f => ({
          name: f.file.originalname,
          threats: f.scanResult.threats,
          status: f.scanResult.status,
        })),
        user: (req as any).user?.id || 'anonymous',
        ip: req.ip || req.socket.remoteAddress,
      });

      // Delete non-quarantined infected files
      for (const { file, scanResult } of infectedFiles) {
        if (file.path && !scanResult.quarantined) {
          await fs.unlink(file.path).catch(() => {});
        }
      }

      // Return error response
      return res.status(400).json({
        error: 'File security scan failed',
        message: 'One or more uploaded files contain threats and have been blocked',
        threats: infectedFiles.map(f => ({
          fileName: f.file.originalname,
          status: f.scanResult.status,
          threats: f.scanResult.threats,
          quarantined: f.scanResult.quarantined,
        })),
      });
    }

    // Check for suspicious files (warn but allow with caution)
    const suspiciousFiles = scanResults.filter(
      result => result.scanResult.status === 'suspicious'
    );

    if (suspiciousFiles.length > 0) {
      console.warn('[FileScanningMiddleware] SUSPICIOUS FILES DETECTED:', {
        count: suspiciousFiles.length,
        files: suspiciousFiles.map(f => ({
          name: f.file.originalname,
          threats: f.scanResult.threats,
        })),
        user: (req as any).user?.id || 'anonymous',
        ip: req.ip || req.socket.remoteAddress,
      });

      // Attach warning to request for logging
      (req as any).fileSecurityWarnings = suspiciousFiles.map(f => ({
        fileName: f.file.originalname,
        threats: f.scanResult.threats,
      }));
    }

    // Attach scan results to request for audit logging
    (req as any).fileScanResults = scanResults.map(r => r.scanResult);

    // All files clean or acceptable, continue
    next();
  } catch (error) {
    console.error('[FileScanningMiddleware] Middleware error:', error);
    return res.status(500).json({
      error: 'File scanning failed',
      message: 'Unable to scan uploaded files for security threats',
    });
  }
}

/**
 * Create a multer middleware with integrated file scanning
 * This wraps multer and adds automatic scanning
 */
export function createSecureUploadMiddleware(multerConfig: multer.Options) {
  const upload = multer(multerConfig);

  return {
    single: (fieldName: string) => {
      return [
        upload.single(fieldName),
        scanUploadedFiles,
      ];
    },
    array: (fieldName: string, maxCount?: number) => {
      return [
        upload.array(fieldName, maxCount),
        scanUploadedFiles,
      ];
    },
    fields: (fields: multer.Field[]) => {
      return [
        upload.fields(fields),
        scanUploadedFiles,
      ];
    },
    any: () => {
      return [
        upload.any(),
        scanUploadedFiles,
      ];
    },
    none: () => {
      return upload.none();
    },
  };
}

/**
 * Scan file buffer directly (for API uploads without multer)
 */
export async function scanFileBuffer(
  buffer: Buffer,
  fileName: string,
  metadata: {
    mimeType?: string;
    uploadedBy?: string;
    ipAddress?: string;
  } = {}
): Promise<ScanResult> {
  const tempFilePath = path.join(os.tmpdir(), `scan_${Date.now()}_${fileName}`);

  try {
    // Write buffer to temp file
    await fs.writeFile(tempFilePath, buffer);

    // Scan the file
    const scanResult = await fileSecurityScanner.scanFile(tempFilePath, {
      fileName,
      ...metadata,
    });

    // Clean up temp file (unless quarantined)
    if (!scanResult.quarantined) {
      await fs.unlink(tempFilePath).catch(() => {});
    }

    return scanResult;
  } catch (error) {
    // Clean up temp file on error
    await fs.unlink(tempFilePath).catch(() => {});
    throw error;
  }
}

/**
 * Validate scan result and throw error if threats found
 */
export function validateScanResult(scanResult: ScanResult): void {
  if (scanResult.status === 'infected' || scanResult.status === 'quarantined') {
    throw new Error(
      `File security threat detected: ${scanResult.threats.join(', ')}`
    );
  }

  if (scanResult.status === 'error') {
    throw new Error('File security scan failed');
  }
}
