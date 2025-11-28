import { Router, Request, Response } from 'express';
import { fileSecurityScanner, ScanResult, ScanStatus } from '../services/FileSecurityScanner';
import { requireAuth, requireRole } from '../middleware/auth';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

/**
 * Get scan statistics
 * GET /api/file-security/statistics
 */
router.get('/statistics', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const stats = fileSecurityScanner.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('[FileSecurity] Failed to get statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve scan statistics' });
  }
});

/**
 * Get scan logs with optional filtering
 * GET /api/file-security/logs
 */
router.get('/logs', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const {
      status,
      uploadedBy,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = req.query;

    const filter: any = {};

    if (status) filter.status = status as ScanStatus;
    if (uploadedBy) filter.uploadedBy = uploadedBy as string;
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    let logs = fileSecurityScanner.getScanLogs(filter);

    // Paginate
    const total = logs.length;
    logs = logs.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      logs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total,
      },
    });
  } catch (error) {
    console.error('[FileSecurity] Failed to get logs:', error);
    res.status(500).json({ error: 'Failed to retrieve scan logs' });
  }
});

/**
 * Get quarantined files list
 * GET /api/file-security/quarantine
 */
router.get('/quarantine', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const quarantineDir = process.env.QUARANTINE_DIR || path.join(process.cwd(), 'quarantine');

    // Read quarantine directory
    const files = await fs.readdir(quarantineDir);

    // Filter out metadata files and get file info
    const quarantinedFiles = await Promise.all(
      files
        .filter(file => !file.endsWith('.meta.json'))
        .map(async (file) => {
          const filePath = path.join(quarantineDir, file);
          const metaPath = `${filePath}.meta.json`;

          try {
            const stats = await fs.stat(filePath);
            let metadata = {};

            try {
              const metaContent = await fs.readFile(metaPath, 'utf-8');
              metadata = JSON.parse(metaContent);
            } catch (e) {
              // Metadata file not found or invalid
            }

            return {
              fileName: file,
              filePath,
              size: stats.size,
              quarantineDate: stats.mtime,
              metadata,
            };
          } catch (e) {
            return null;
          }
        })
    );

    // Filter out null entries
    const validFiles = quarantinedFiles.filter(f => f !== null);

    res.json({
      count: validFiles.length,
      files: validFiles,
    });
  } catch (error) {
    console.error('[FileSecurity] Failed to get quarantine list:', error);
    res.status(500).json({ error: 'Failed to retrieve quarantined files' });
  }
});

/**
 * Get details of a specific quarantined file
 * GET /api/file-security/quarantine/:fileHash
 */
router.get('/quarantine/:fileHash', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { fileHash } = req.params;
    const quarantineDir = process.env.QUARANTINE_DIR || path.join(process.cwd(), 'quarantine');

    // Find file with this hash
    const files = await fs.readdir(quarantineDir);
    const matchingFile = files.find(file => file.startsWith(fileHash) && !file.endsWith('.meta.json'));

    if (!matchingFile) {
      return res.status(404).json({ error: 'Quarantined file not found' });
    }

    const filePath = path.join(quarantineDir, matchingFile);
    const metaPath = `${filePath}.meta.json`;

    const stats = await fs.stat(filePath);
    let metadata = {};

    try {
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      metadata = JSON.parse(metaContent);
    } catch (e) {
      // Metadata file not found or invalid
    }

    // Find corresponding scan log
    const scanLogs = fileSecurityScanner.getScanLogs();
    const scanLog = scanLogs.find(log => log.fileHash === fileHash);

    res.json({
      fileName: matchingFile,
      filePath,
      size: stats.size,
      quarantineDate: stats.mtime,
      metadata,
      scanResult: scanLog || null,
    });
  } catch (error) {
    console.error('[FileSecurity] Failed to get quarantine details:', error);
    res.status(500).json({ error: 'Failed to retrieve quarantined file details' });
  }
});

/**
 * Release file from quarantine (DANGER: Super admin only)
 * POST /api/file-security/quarantine/:fileHash/release
 */
router.post('/quarantine/:fileHash/release', requireAuth, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { fileHash } = req.params;
    const { destinationPath, fileName } = req.body;

    if (!destinationPath || !fileName) {
      return res.status(400).json({ error: 'Destination path and file name are required' });
    }

    // Verify user has super admin privileges (double check)
    const user = (req as any).user;
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions. Super admin access required.' });
    }

    await fileSecurityScanner.releaseFromQuarantine(fileHash, fileName, destinationPath);

    // Log the release action
    console.warn('[FileSecurity] QUARANTINE RELEASE:', {
      fileHash,
      fileName,
      destinationPath,
      releasedBy: user.id,
      ip: req.ip || req.socket.remoteAddress,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: 'File released from quarantine',
      destinationPath,
    });
  } catch (error) {
    console.error('[FileSecurity] Failed to release file from quarantine:', error);
    res.status(500).json({ error: 'Failed to release file from quarantine' });
  }
});

/**
 * Permanently delete quarantined file
 * DELETE /api/file-security/quarantine/:fileHash
 */
router.delete('/quarantine/:fileHash', requireAuth, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { fileHash } = req.params;
    const quarantineDir = process.env.QUARANTINE_DIR || path.join(process.cwd(), 'quarantine');

    // Find file with this hash
    const files = await fs.readdir(quarantineDir);
    const matchingFile = files.find(file => file.startsWith(fileHash) && !file.endsWith('.meta.json'));

    if (!matchingFile) {
      return res.status(404).json({ error: 'Quarantined file not found' });
    }

    const filePath = path.join(quarantineDir, matchingFile);
    const metaPath = `${filePath}.meta.json`;

    // Delete file and metadata
    await fs.unlink(filePath);
    await fs.unlink(metaPath).catch(() => {}); // Ignore if metadata doesn't exist

    // Log the deletion
    const user = (req as any).user;
    console.warn('[FileSecurity] QUARANTINE DELETE:', {
      fileHash,
      fileName: matchingFile,
      deletedBy: user.id,
      ip: req.ip || req.socket.remoteAddress,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: 'Quarantined file permanently deleted',
      fileName: matchingFile,
    });
  } catch (error) {
    console.error('[FileSecurity] Failed to delete quarantined file:', error);
    res.status(500).json({ error: 'Failed to delete quarantined file' });
  }
});

/**
 * Scan a file on demand (for testing or re-scanning)
 * POST /api/file-security/scan
 */
router.post('/scan', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Verify file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }

    const user = (req as any).user;
    const scanResult = await fileSecurityScanner.scanFile(filePath, {
      fileName: path.basename(filePath),
      uploadedBy: user.id,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    });

    res.json({
      message: 'File scan completed',
      result: scanResult,
    });
  } catch (error) {
    console.error('[FileSecurity] Failed to scan file:', error);
    res.status(500).json({ error: 'Failed to scan file' });
  }
});

/**
 * Get threat summary (for dashboard)
 * GET /api/file-security/threats/summary
 */
router.get('/threats/summary', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const stats = fileSecurityScanner.getStatistics();
    const logs = fileSecurityScanner.getScanLogs();

    // Get recent threats (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentThreats = logs.filter(
      log => log.timestamp >= last24Hours &&
             (log.status === 'infected' || log.status === 'suspicious' || log.status === 'quarantined')
    );

    // Get top threats
    const threatCounts: { [key: string]: number } = {};
    logs.forEach(log => {
      log.threats.forEach(threat => {
        threatCounts[threat] = (threatCounts[threat] || 0) + 1;
      });
    });

    const topThreats = Object.entries(threatCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([threat, count]) => ({ threat, count }));

    // Get threat timeline (last 7 days)
    const timeline: { [key: string]: { clean: number; infected: number; suspicious: number } } = {};
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    logs.filter(log => log.timestamp >= last7Days).forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = { clean: 0, infected: 0, suspicious: 0 };
      }
      if (log.status === 'clean') timeline[date].clean++;
      else if (log.status === 'infected' || log.status === 'quarantined') timeline[date].infected++;
      else if (log.status === 'suspicious') timeline[date].suspicious++;
    });

    res.json({
      statistics: stats,
      recentThreats: {
        count: recentThreats.length,
        items: recentThreats.slice(0, 20), // Last 20 threats
      },
      topThreats,
      timeline,
    });
  } catch (error) {
    console.error('[FileSecurity] Failed to get threat summary:', error);
    res.status(500).json({ error: 'Failed to retrieve threat summary' });
  }
});

/**
 * Export scan logs (for compliance/audit)
 * GET /api/file-security/export
 */
router.get('/export', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const filter: any = {};
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    const logs = fileSecurityScanner.getScanLogs(filter);

    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'Timestamp,File Name,File Hash,Status,Threats,File Size,Uploaded By,IP Address\n';
      const csvRows = logs.map(log =>
        `"${log.timestamp.toISOString()}","${log.fileName}","${log.fileHash}","${log.status}","${log.threats.join('; ')}",${log.fileSize},"${log.metadata.uploadedBy || 'unknown'}","${log.metadata.ipAddress || 'unknown'}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="scan-logs-${Date.now()}.csv"`);
      res.send(csvHeader + csvRows);
    } else {
      // Return as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="scan-logs-${Date.now()}.json"`);
      res.json(logs);
    }
  } catch (error) {
    console.error('[FileSecurity] Failed to export logs:', error);
    res.status(500).json({ error: 'Failed to export scan logs' });
  }
});

export default router;
