import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { SecurityAlertService } from './SecurityAlertService';

const execAsync = promisify(exec);

// Scan result types
export type ScanStatus = 'clean' | 'infected' | 'suspicious' | 'quarantined' | 'error';

export interface ScanResult {
  status: ScanStatus;
  fileHash: string;
  fileName: string;
  fileSize: number;
  threats: string[];
  scanEngine: string[];
  timestamp: Date;
  quarantined: boolean;
  quarantinePath?: string;
  platform: string;
  metadata: {
    mimeType?: string;
    fileType?: string;
    uploadedBy?: string;
    ipAddress?: string;
  };
  details?: {
    clamav?: ClamAVResult;
    virusTotal?: VirusTotalResult;
    signatureAnalysis?: SignatureAnalysisResult;
    codeAnalysis?: CodeAnalysisResult;
  };
}

interface ClamAVResult {
  infected: boolean;
  viruses: string[];
  scanTime: number;
}

interface VirusTotalResult {
  positives: number;
  total: number;
  detections: string[];
  permalink?: string;
}

interface SignatureAnalysisResult {
  suspicious: boolean;
  patterns: string[];
  riskScore: number;
}

interface CodeAnalysisResult {
  hasObfuscation: boolean;
  hasDangerousFunctions: boolean;
  suspiciousPatterns: string[];
  riskScore: number;
}

export class FileSecurityScanner {
  private quarantineDir: string;
  private virusTotalApiKey?: string;
  private scanLogs: ScanResult[] = [];
  private maxLogSize = 10000;
  private platform: string;
  private alertService: SecurityAlertService;

  // Malicious file signatures (magic bytes and patterns)
  private readonly maliciousSignatures = [
    { pattern: /exec\s*\(.*eval/gi, description: 'Code execution pattern' },
    { pattern: /base64_decode.*eval/gi, description: 'Obfuscated PHP code' },
    { pattern: /<script[^>]*>.*document\.cookie/gi, description: 'Cookie stealing XSS' },
    { pattern: /\$_(GET|POST|REQUEST)\[.*\].*eval/gi, description: 'Remote code execution' },
    { pattern: /system\s*\(.*\$_(GET|POST)/gi, description: 'System command injection' },
    { pattern: /\bpassthru\b|\bshell_exec\b|\bproc_open\b/gi, description: 'Shell execution functions' },
    { pattern: /FromBase64String.*Invoke-Expression/gi, description: 'PowerShell obfuscation' },
    { pattern: /<iframe[^>]*src=["']https?:\/\/(?!.*yourdomain\.com)/gi, description: 'Suspicious iframe' },
    { pattern: /document\.write.*unescape/gi, description: 'JavaScript obfuscation' },
    { pattern: /\.htaccess.*RewriteRule.*base64/gi, description: 'Malicious .htaccess' },
  ];

  // Dangerous functions in code files
  private readonly dangerousFunctions = [
    'eval', 'exec', 'system', 'passthru', 'shell_exec', 'proc_open',
    'popen', 'curl_exec', 'curl_multi_exec', 'parse_str', 'assert',
    'create_function', 'file_get_contents', 'file_put_contents',
    'fopen', 'readfile', 'require', 'require_once', 'include', 'include_once',
    'unserialize', 'child_process', 'vm.runInNewContext', 'Function(',
    '__import__', 'execfile', 'compile', 'globals', 'locals'
  ];

  // Phishing indicators
  private readonly phishingPatterns = [
    { pattern: /paypal.*verify.*account/gi, description: 'PayPal phishing' },
    { pattern: /suspended.*account.*click/gi, description: 'Account suspension scam' },
    { pattern: /urgent.*password.*expire/gi, description: 'Password expiry scam' },
    { pattern: /verify.*identity.*immediately/gi, description: 'Identity verification scam' },
    { pattern: /claim.*prize.*winner/gi, description: 'Prize scam' },
    { pattern: /bitcoin.*wallet.*transfer/gi, description: 'Crypto scam' },
  ];

  constructor(options: {
    quarantineDir?: string;
    virusTotalApiKey?: string;
    platform?: string;
  } = {}) {
    this.quarantineDir = options.quarantineDir || join(process.cwd(), 'quarantine');
    this.virusTotalApiKey = options.virusTotalApiKey || process.env.VIRUSTOTAL_API_KEY;
    this.platform = options.platform || 'unknown';
    this.alertService = new SecurityAlertService();
    this.ensureQuarantineDir();
  }

  private async ensureQuarantineDir(): Promise<void> {
    try {
      await fs.mkdir(this.quarantineDir, { recursive: true });
      await fs.chmod(this.quarantineDir, 0o700);
    } catch (error) {
      console.error('[FileSecurityScanner] Failed to create quarantine directory:', error);
    }
  }

  /**
   * Main scanning method - orchestrates all scanning engines
   */
  async scanFile(
    filePath: string,
    metadata: {
      fileName?: string;
      mimeType?: string;
      uploadedBy?: string;
      ipAddress?: string;
    } = {}
  ): Promise<ScanResult> {
    const startTime = Date.now();
    console.log(`[FileSecurityScanner][${this.platform}] Starting scan for: ${filePath}`);

    try {
      const fileHash = await this.calculateFileHash(filePath);
      const stats = await fs.stat(filePath);
      const fileName = metadata.fileName || filePath.split('/').pop() || 'unknown';

      const result: ScanResult = {
        status: 'clean',
        fileHash,
        fileName,
        fileSize: stats.size,
        threats: [],
        scanEngine: [],
        timestamp: new Date(),
        quarantined: false,
        platform: this.platform,
        metadata: {
          mimeType: metadata.mimeType,
          fileType: this.detectFileType(fileName),
          uploadedBy: metadata.uploadedBy,
          ipAddress: metadata.ipAddress,
        },
        details: {},
      };

      // Run all scanning engines in parallel
      const [clamavResult, signatureResult, codeResult] = await Promise.allSettled([
        this.scanWithClamAV(filePath),
        this.analyzeFileSignatures(filePath),
        this.analyzeCode(filePath, fileName),
      ]);

      // Process ClamAV results
      if (clamavResult.status === 'fulfilled' && clamavResult.value) {
        result.details!.clamav = clamavResult.value;
        result.scanEngine.push('ClamAV');
        if (clamavResult.value.infected) {
          result.status = 'infected';
          result.threats.push(...clamavResult.value.viruses);
        }
      }

      // Process signature analysis results
      if (signatureResult.status === 'fulfilled' && signatureResult.value) {
        result.details!.signatureAnalysis = signatureResult.value;
        result.scanEngine.push('Signature Analysis');
        if (signatureResult.value.suspicious) {
          if (result.status === 'clean') result.status = 'suspicious';
          result.threats.push(...signatureResult.value.patterns);
        }
      }

      // Process code analysis results
      if (codeResult.status === 'fulfilled' && codeResult.value) {
        result.details!.codeAnalysis = codeResult.value;
        result.scanEngine.push('Code Analysis');
        if (codeResult.value.riskScore > 7) {
          result.status = 'infected';
          result.threats.push(...codeResult.value.suspiciousPatterns);
        } else if (codeResult.value.riskScore > 4) {
          if (result.status === 'clean') result.status = 'suspicious';
          result.threats.push(...codeResult.value.suspiciousPatterns);
        }
      }

      // If infected or highly suspicious, quarantine the file
      if (result.status === 'infected' || (result.status === 'suspicious' && result.threats.length > 3)) {
        await this.quarantineFile(filePath, fileHash);
        result.quarantined = true;
        result.status = 'quarantined';
        result.quarantinePath = join(this.quarantineDir, `${fileHash}_${fileName}`);

        // TRIGGER EMERGENCY ALERT
        await this.alertService.sendSecurityAlert({
          severity: 'critical',
          platform: this.platform,
          threatType: 'file_infection',
          fileName,
          fileHash,
          threats: result.threats,
          uploadedBy: metadata.uploadedBy || 'unknown',
          ipAddress: metadata.ipAddress || 'unknown',
          timestamp: new Date(),
        });
      }

      // Run VirusTotal scan asynchronously for additional verification (non-blocking)
      if (this.virusTotalApiKey && (result.status === 'suspicious' || result.status === 'quarantined')) {
        this.scanWithVirusTotal(filePath, fileHash)
          .then(vtResult => {
            if (vtResult) {
              result.details!.virusTotal = vtResult;
              result.scanEngine.push('VirusTotal');
              if (vtResult.positives > 0) {
                result.threats.push(...vtResult.detections);
              }
            }
          })
          .catch(err => console.error('[FileSecurityScanner] VirusTotal scan error:', err));
      }

      // Log the scan
      this.addScanLog(result);

      // Send alert for suspicious files too (lower priority)
      if (result.status === 'suspicious') {
        await this.alertService.sendSecurityAlert({
          severity: 'warning',
          platform: this.platform,
          threatType: 'suspicious_file',
          fileName,
          fileHash,
          threats: result.threats,
          uploadedBy: metadata.uploadedBy || 'unknown',
          ipAddress: metadata.ipAddress || 'unknown',
          timestamp: new Date(),
        });
      }

      const scanTime = Date.now() - startTime;
      console.log(`[FileSecurityScanner][${this.platform}] Scan completed in ${scanTime}ms - Status: ${result.status}`);

      return result;
    } catch (error) {
      console.error('[FileSecurityScanner] Scan error:', error);
      return {
        status: 'error',
        fileHash: '',
        fileName: metadata.fileName || 'unknown',
        fileSize: 0,
        threats: [`Scan error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        scanEngine: ['Error Handler'],
        timestamp: new Date(),
        quarantined: false,
        platform: this.platform,
        metadata,
      };
    }
  }

  private async scanWithClamAV(filePath: string): Promise<ClamAVResult | null> {
    try {
      const startTime = Date.now();
      try {
        const { stdout } = await execAsync(`clamdscan --no-summary "${filePath}"`);
        const scanTime = Date.now() - startTime;
        const infected = stdout.includes('FOUND');
        const viruses: string[] = [];
        if (infected) {
          const matches = stdout.match(/:\s+(.+?)\s+FOUND/g);
          if (matches) {
            matches.forEach(match => {
              const virus = match.replace(/:\s+(.+?)\s+FOUND/, '$1').trim();
              viruses.push(virus);
            });
          }
        }
        return { infected, viruses, scanTime };
      } catch (clamdError) {
        const { stdout } = await execAsync(`clamscan --no-summary "${filePath}"`);
        const scanTime = Date.now() - startTime;
        const infected = stdout.includes('FOUND');
        const viruses: string[] = [];
        if (infected) {
          const matches = stdout.match(/:\s+(.+?)\s+FOUND/g);
          if (matches) {
            matches.forEach(match => {
              const virus = match.replace(/:\s+(.+?)\s+FOUND/, '$1').trim();
              viruses.push(virus);
            });
          }
        }
        return { infected, viruses, scanTime };
      }
    } catch (error) {
      console.warn('[FileSecurityScanner] ClamAV scan failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  private async scanWithVirusTotal(filePath: string, fileHash: string): Promise<VirusTotalResult | null> {
    if (!this.virusTotalApiKey) return null;
    try {
      const reportResponse = await axios.get(
        `https://www.virustotal.com/vtapi/v2/file/report`,
        { params: { apikey: this.virusTotalApiKey, resource: fileHash } }
      );
      if (reportResponse.data.response_code === 1) {
        return {
          positives: reportResponse.data.positives,
          total: reportResponse.data.total,
          detections: this.extractVirusTotalDetections(reportResponse.data.scans),
          permalink: reportResponse.data.permalink,
        };
      }
      const fileBuffer = await fs.readFile(filePath);
      const formData = new FormData();
      formData.append('apikey', this.virusTotalApiKey);
      formData.append('file', new Blob([fileBuffer]), fileHash);
      await axios.post('https://www.virustotal.com/vtapi/v2/file/scan', formData);
      return null;
    } catch (error) {
      console.error('[FileSecurityScanner] VirusTotal scan error:', error);
      return null;
    }
  }

  private extractVirusTotalDetections(scans: any): string[] {
    const detections: string[] = [];
    if (scans) {
      Object.keys(scans).forEach(engine => {
        if (scans[engine].detected) {
          detections.push(`${engine}: ${scans[engine].result}`);
        }
      });
    }
    return detections;
  }

  private async analyzeFileSignatures(filePath: string): Promise<SignatureAnalysisResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      const patterns: string[] = [];
      let riskScore = 0;
      this.maliciousSignatures.forEach(sig => {
        if (sig.pattern.test(content)) {
          patterns.push(sig.description);
          riskScore += 3;
        }
      });
      this.phishingPatterns.forEach(pattern => {
        if (pattern.pattern.test(content)) {
          patterns.push(`Phishing: ${pattern.description}`);
          riskScore += 2;
        }
      });
      const urlPattern = /https?:\/\/[^\s<>"]+/gi;
      const urls = content.match(urlPattern) || [];
      const suspiciousUrls = urls.filter(url =>
        url.includes('.tk') || url.includes('.ml') ||
        url.includes('bit.ly') || url.includes('tinyurl') ||
        url.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)
      );
      if (suspiciousUrls.length > 0) {
        patterns.push(`Suspicious URLs: ${suspiciousUrls.length} found`);
        riskScore += suspiciousUrls.length;
      }
      if (content.includes('base64') && content.length > 1000) {
        const base64Ratio = (content.match(/[A-Za-z0-9+/=]{20,}/g) || []).length / content.length;
        if (base64Ratio > 0.3) {
          patterns.push('High base64 encoding detected (possible obfuscation)');
          riskScore += 2;
        }
      }
      return { suspicious: patterns.length > 0, patterns, riskScore: Math.min(riskScore, 10) };
    } catch (error) {
      return { suspicious: false, patterns: [], riskScore: 0 };
    }
  }

  private async analyzeCode(filePath: string, fileName: string): Promise<CodeAnalysisResult | null> {
    const codeExtensions = ['.js', '.ts', '.php', '.py', '.rb', '.sh', '.bash', '.ps1', '.java', '.jsx', '.tsx'];
    const isCodeFile = codeExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    if (!isCodeFile) return null;
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const suspiciousPatterns: string[] = [];
      let riskScore = 0;
      const dangerousFunctionsFound = this.dangerousFunctions.filter(func => {
        const pattern = new RegExp(`\\b${func}\\b`, 'gi');
        return pattern.test(content);
      });
      if (dangerousFunctionsFound.length > 0) {
        suspiciousPatterns.push(`Dangerous functions: ${dangerousFunctionsFound.join(', ')}`);
        riskScore += dangerousFunctionsFound.length;
      }
      const hasObfuscation = /\\x[0-9a-f]{2}|\\u[0-9a-f]{4}|\\[0-7]{3}/gi.test(content) ||
                           (content.match(/[^a-zA-Z0-9\s]{10,}/g) || []).length > 5;
      if (hasObfuscation) {
        suspiciousPatterns.push('Code obfuscation detected');
        riskScore += 3;
      }
      if (/fetch\(|axios\.|http\.request|urllib|requests\.get/gi.test(content)) {
        const externalCalls = (content.match(/https?:\/\//gi) || []).length;
        if (externalCalls > 5) {
          suspiciousPatterns.push(`Multiple external network calls: ${externalCalls}`);
          riskScore += 2;
        }
      }
      if (/coinhive|cryptonight|webminer/gi.test(content)) {
        suspiciousPatterns.push('Crypto mining script detected');
        riskScore += 5;
      }
      return {
        hasObfuscation,
        hasDangerousFunctions: dangerousFunctionsFound.length > 0,
        suspiciousPatterns,
        riskScore: Math.min(riskScore, 10),
      };
    } catch (error) {
      return null;
    }
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async quarantineFile(filePath: string, fileHash: string): Promise<void> {
    try {
      const fileName = filePath.split('/').pop() || 'unknown';
      const quarantinePath = join(this.quarantineDir, `${fileHash}_${fileName}`);
      await fs.rename(filePath, quarantinePath);
      await fs.chmod(quarantinePath, 0o400);
      const metadataPath = `${quarantinePath}.meta.json`;
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          originalPath: filePath,
          quarantineDate: new Date().toISOString(),
          fileHash,
          platform: this.platform,
        }, null, 2)
      );
      console.log(`[FileSecurityScanner][${this.platform}] File quarantined: ${quarantinePath}`);
    } catch (error) {
      console.error('[FileSecurityScanner] Failed to quarantine file:', error);
      throw error;
    }
  }

  private detectFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const typeMap: { [key: string]: string } = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
      mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
      mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio',
      pdf: 'document', doc: 'document', docx: 'document', txt: 'document',
      xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
      zip: 'archive', tar: 'archive', gz: 'archive', '7z': 'archive',
      js: 'code', ts: 'code', jsx: 'code', tsx: 'code', py: 'code', php: 'code',
    };
    return typeMap[ext] || 'unknown';
  }

  private addScanLog(result: ScanResult): void {
    this.scanLogs.push(result);
    if (this.scanLogs.length > this.maxLogSize) {
      this.scanLogs.shift();
    }
  }

  getScanLogs(filter?: {
    status?: ScanStatus;
    uploadedBy?: string;
    startDate?: Date;
    endDate?: Date;
  }): ScanResult[] {
    let logs = [...this.scanLogs];
    if (filter) {
      if (filter.status) logs = logs.filter(log => log.status === filter.status);
      if (filter.uploadedBy) logs = logs.filter(log => log.metadata.uploadedBy === filter.uploadedBy);
      if (filter.startDate) logs = logs.filter(log => log.timestamp >= filter.startDate!);
      if (filter.endDate) logs = logs.filter(log => log.timestamp <= filter.endDate!);
    }
    return logs;
  }

  getStatistics(): {
    totalScans: number;
    cleanFiles: number;
    infectedFiles: number;
    suspiciousFiles: number;
    quarantinedFiles: number;
    errorScans: number;
  } {
    return {
      totalScans: this.scanLogs.length,
      cleanFiles: this.scanLogs.filter(log => log.status === 'clean').length,
      infectedFiles: this.scanLogs.filter(log => log.status === 'infected').length,
      suspiciousFiles: this.scanLogs.filter(log => log.status === 'suspicious').length,
      quarantinedFiles: this.scanLogs.filter(log => log.quarantined).length,
      errorScans: this.scanLogs.filter(log => log.status === 'error').length,
    };
  }

  async releaseFromQuarantine(fileHash: string, fileName: string, destinationPath: string): Promise<void> {
    const quarantinePath = join(this.quarantineDir, `${fileHash}_${fileName}`);
    try {
      await fs.chmod(quarantinePath, 0o644);
      await fs.rename(quarantinePath, destinationPath);
      const metadataPath = `${quarantinePath}.meta.json`;
      await fs.unlink(metadataPath).catch(() => {});
      console.log(`[FileSecurityScanner][${this.platform}] File released from quarantine: ${destinationPath}`);
    } catch (error) {
      console.error('[FileSecurityScanner] Failed to release file from quarantine:', error);
      throw error;
    }
  }
}
