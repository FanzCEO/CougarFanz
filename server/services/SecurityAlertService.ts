import nodemailer from 'nodemailer';
import { WebSocket } from 'ws';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface SecurityAlert {
  severity: 'critical' | 'warning' | 'info';
  platform: string;
  threatType: 'file_infection' | 'suspicious_file' | 'multiple_failures' | 'quarantine_full' | 'scan_error';
  fileName: string;
  fileHash: string;
  threats: string[];
  uploadedBy: string;
  ipAddress: string;
  timestamp: Date;
  id?: string;
}

export class SecurityAlertService {
  private emailTransporter: nodemailer.Transporter | null = null;
  private wsClients: Set<WebSocket> = new Set();
  private alertHistory: SecurityAlert[] = [];
  private maxAlertHistory = 1000;
  private alertLogPath: string;

  // Emergency contacts (configured via environment variables)
  private emergencyEmails: string[];
  private emergencySMS: string[];

  constructor() {
    this.emergencyEmails = (process.env.SECURITY_ALERT_EMAILS || '').split(',').filter(e => e.trim());
    this.emergencySMS = (process.env.SECURITY_ALERT_SMS || '').split(',').filter(s => s.trim());
    this.alertLogPath = process.env.SECURITY_ALERT_LOG_PATH || join(process.cwd(), 'security-alerts.log');

    // Initialize email transporter
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter(): void {
    try {
      // Support multiple email providers
      const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

      if (emailProvider === 'smtp') {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else if (emailProvider === 'sendgrid') {
        this.emailTransporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        });
      } else if (emailProvider === 'ses') {
        // AWS SES
        const aws = require('@aws-sdk/client-ses');
        const ses = new aws.SES({
          region: process.env.AWS_REGION || 'us-east-1',
        });
        this.emailTransporter = nodemailer.createTransport({
          SES: { ses, aws },
        });
      }

      console.log('[SecurityAlertService] Email transporter initialized');
    } catch (error) {
      console.error('[SecurityAlertService] Failed to initialize email transporter:', error);
    }
  }

  /**
   * Register WebSocket client for real-time dashboard alerts
   */
  registerWebSocketClient(ws: WebSocket): void {
    this.wsClients.add(ws);
    console.log(`[SecurityAlertService] WebSocket client registered. Total clients: ${this.wsClients.size}`);

    ws.on('close', () => {
      this.wsClients.delete(ws);
      console.log(`[SecurityAlertService] WebSocket client disconnected. Total clients: ${this.wsClients.size}`);
    });
  }

  /**
   * Send comprehensive security alert via all channels
   */
  async sendSecurityAlert(alert: SecurityAlert): Promise<void> {
    // Generate unique alert ID
    alert.id = `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Add to history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory.shift();
    }

    // Log to file
    await this.logAlert(alert);

    // Send to all channels in parallel
    await Promise.allSettled([
      this.sendEmailAlert(alert),
      this.sendPushNotification(alert),
      this.sendDashboardAlert(alert),
      this.logToDatabase(alert),
    ]);

    console.log(`[SecurityAlertService] Alert sent: ${alert.id} - ${alert.severity} - ${alert.platform} - ${alert.threatType}`);
  }

  /**
   * Send email alert to emergency contacts
   */
  private async sendEmailAlert(alert: SecurityAlert): Promise<void> {
    if (!this.emailTransporter || this.emergencyEmails.length === 0) {
      console.warn('[SecurityAlertService] Email alerts not configured');
      return;
    }

    try {
      const subject = this.getEmailSubject(alert);
      const html = this.generateEmailHTML(alert);

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'security@fanz.network',
        to: this.emergencyEmails.join(','),
        subject,
        html,
        priority: alert.severity === 'critical' ? 'high' : 'normal',
      });

      console.log(`[SecurityAlertService] Email alert sent to ${this.emergencyEmails.length} recipients`);
    } catch (error) {
      console.error('[SecurityAlertService] Failed to send email alert:', error);
    }
  }

  private getEmailSubject(alert: SecurityAlert): string {
    const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
    const platformUpper = alert.platform.toUpperCase();

    if (alert.severity === 'critical') {
      return `${emoji} CRITICAL SECURITY ALERT - ${platformUpper} - MALWARE DETECTED`;
    } else if (alert.severity === 'warning') {
      return `${emoji} Security Warning - ${platformUpper} - Suspicious File Detected`;
    } else {
      return `${emoji} Security Notice - ${platformUpper} - ${alert.threatType}`;
    }
  }

  private generateEmailHTML(alert: SecurityAlert): string {
    const severityColor = alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6';
    const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .detail-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
    .detail-label { font-weight: bold; color: #6b7280; }
    .detail-value { color: #111827; margin-top: 4px; }
    .threats { background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; }
    .threats ul { margin: 5px 0; padding-left: 20px; }
    .footer { background: #111827; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background: white; color: ${severityColor}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} Security Alert - ${alert.platform.toUpperCase()}</h1>
    </div>
    <div class="content">
      <div class="detail-row">
        <div class="detail-label">Severity</div>
        <div class="detail-value" style="color: ${severityColor}; font-weight: bold; text-transform: uppercase;">${alert.severity}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Threat Type</div>
        <div class="detail-value">${alert.threatType.replace(/_/g, ' ').toUpperCase()}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">File Name</div>
        <div class="detail-value">${alert.fileName}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">File Hash (SHA-256)</div>
        <div class="detail-value" style="font-family: monospace; font-size: 11px;">${alert.fileHash}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Uploaded By</div>
        <div class="detail-value">${alert.uploadedBy}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">IP Address</div>
        <div class="detail-value">${alert.ipAddress}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Timestamp</div>
        <div class="detail-value">${alert.timestamp.toLocaleString()}</div>
      </div>
      ${alert.threats.length > 0 ? `
      <div class="threats">
        <strong style="color: #dc2626;">⚠️ Detected Threats:</strong>
        <ul>
          ${alert.threats.map(threat => `<li>${threat}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
        <strong>⚡ Immediate Actions Taken:</strong>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>File has been quarantined and isolated</li>
          <li>Upload rejected and user notified</li>
          <li>Security team alerted across all channels</li>
          <li>Incident logged for forensic analysis</li>
        </ul>
      </div>
      <a href="${process.env.DASHBOARD_URL || 'https://fanzdash.fanz.network'}/file-security-dashboard" class="button">
        View Security Dashboard →
      </a>
    </div>
    <div class="footer">
      <strong>FANZ Unified Ecosystem Security System</strong><br>
      This is an automated security alert. Do not reply to this email.<br>
      For support, contact: security@fanz.network
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send push notification (Web Push API / Firebase / OneSignal)
   */
  private async sendPushNotification(alert: SecurityAlert): Promise<void> {
    try {
      // Support multiple push notification providers
      const pushProvider = process.env.PUSH_PROVIDER || 'none';

      if (pushProvider === 'onesignal') {
        await this.sendOneSignalPush(alert);
      } else if (pushProvider === 'firebase') {
        await this.sendFirebasePush(alert);
      } else if (pushProvider === 'webpush') {
        await this.sendWebPush(alert);
      } else {
        console.log('[SecurityAlertService] Push notifications not configured');
      }
    } catch (error) {
      console.error('[SecurityAlertService] Failed to send push notification:', error);
    }
  }

  private async sendOneSignalPush(alert: SecurityAlert): Promise<void> {
    if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
      return;
    }

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: process.env.ONESIGNAL_APP_ID,
          included_segments: ['Security Team', 'Admins'],
          headings: { en: `🚨 Security Alert - ${alert.platform.toUpperCase()}` },
          contents: { en: `${alert.threatType.replace(/_/g, ' ')} detected: ${alert.fileName}` },
          data: { alertId: alert.id, severity: alert.severity, platform: alert.platform },
          priority: 10,
          ttl: 86400,
        }),
      });

      if (response.ok) {
        console.log('[SecurityAlertService] OneSignal push notification sent');
      }
    } catch (error) {
      console.error('[SecurityAlertService] OneSignal push failed:', error);
    }
  }

  private async sendFirebasePush(alert: SecurityAlert): Promise<void> {
    // Firebase Cloud Messaging implementation
    console.log('[SecurityAlertService] Firebase push notifications not yet implemented');
  }

  private async sendWebPush(alert: SecurityAlert): Promise<void> {
    // Web Push API implementation
    console.log('[SecurityAlertService] Web Push notifications not yet implemented');
  }

  /**
   * Send real-time alert to connected dashboard clients
   */
  private async sendDashboardAlert(alert: SecurityAlert): Promise<void> {
    if (this.wsClients.size === 0) {
      console.log('[SecurityAlertService] No dashboard clients connected');
      return;
    }

    const message = JSON.stringify({
      type: 'security_alert',
      alert: {
        ...alert,
        timestamp: alert.timestamp.toISOString(),
      },
    });

    let sentCount = 0;
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          sentCount++;
        } catch (error) {
          console.error('[SecurityAlertService] Failed to send WebSocket message:', error);
        }
      }
    });

    console.log(`[SecurityAlertService] Dashboard alert sent to ${sentCount} clients`);
  }

  /**
   * Log alert to database for persistence
   */
  private async logToDatabase(alert: SecurityAlert): Promise<void> {
    try {
      // This will integrate with the FANZ database
      // For now, we'll use the centralized logging
      const dbLogPath = process.env.DATABASE_ALERT_LOG || '/Users/joshuastone/FANZ-Unified-Ecosystem/database/security_alerts.log';

      const logEntry = {
        id: alert.id,
        severity: alert.severity,
        platform: alert.platform,
        threat_type: alert.threatType,
        file_name: alert.fileName,
        file_hash: alert.fileHash,
        threats: alert.threats,
        uploaded_by: alert.uploadedBy,
        ip_address: alert.ipAddress,
        timestamp: alert.timestamp.toISOString(),
      };

      await fs.appendFile(dbLogPath, JSON.stringify(logEntry) + '\n');
      console.log('[SecurityAlertService] Alert logged to database');
    } catch (error) {
      console.error('[SecurityAlertService] Failed to log to database:', error);
    }
  }

  /**
   * Log alert to file system
   */
  private async logAlert(alert: SecurityAlert): Promise<void> {
    try {
      const logEntry = `[${alert.timestamp.toISOString()}] [${alert.severity.toUpperCase()}] [${alert.platform}] ${alert.threatType} - ${alert.fileName} (${alert.fileHash}) - Uploaded by: ${alert.uploadedBy} from ${alert.ipAddress} - Threats: ${alert.threats.join(', ')}\n`;

      await fs.appendFile(this.alertLogPath, logEntry);
    } catch (error) {
      console.error('[SecurityAlertService] Failed to log alert to file:', error);
    }
  }

  /**
   * Get alert history
   */
  getAlertHistory(filter?: {
    severity?: SecurityAlert['severity'];
    platform?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): SecurityAlert[] {
    let alerts = [...this.alertHistory];

    if (filter) {
      if (filter.severity) alerts = alerts.filter(a => a.severity === filter.severity);
      if (filter.platform) alerts = alerts.filter(a => a.platform === filter.platform);
      if (filter.startDate) alerts = alerts.filter(a => a.timestamp >= filter.startDate!);
      if (filter.endDate) alerts = alerts.filter(a => a.timestamp <= filter.endDate!);
      if (filter.limit) alerts = alerts.slice(-filter.limit);
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get alert statistics
   */
  getStatistics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): {
    total: number;
    critical: number;
    warning: number;
    info: number;
    byPlatform: { [platform: string]: number };
    byThreatType: { [type: string]: number };
  } {
    const now = Date.now();
    const ranges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const rangeMs = ranges[timeRange];
    const recentAlerts = this.alertHistory.filter(a => now - a.timestamp.getTime() < rangeMs);

    const byPlatform: { [platform: string]: number } = {};
    const byThreatType: { [type: string]: number } = {};

    recentAlerts.forEach(alert => {
      byPlatform[alert.platform] = (byPlatform[alert.platform] || 0) + 1;
      byThreatType[alert.threatType] = (byThreatType[alert.threatType] || 0) + 1;
    });

    return {
      total: recentAlerts.length,
      critical: recentAlerts.filter(a => a.severity === 'critical').length,
      warning: recentAlerts.filter(a => a.severity === 'warning').length,
      info: recentAlerts.filter(a => a.severity === 'info').length,
      byPlatform,
      byThreatType,
    };
  }
}

// Export singleton instance
export const securityAlertService = new SecurityAlertService();
