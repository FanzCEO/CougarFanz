# Security Package Documentation

This platform now includes comprehensive virus scanning and malware detection.

## Features

- Multi-engine scanning (ClamAV + VirusTotal)
- Malware and phishing detection
- Automatic quarantine
- Emergency alerts (email, push, dashboard)
- Centralized logging

## Setup

1. Install ClamAV (recommended):
   ```bash
   brew install clamav         # macOS
   sudo apt-get install clamav # Ubuntu
   ```

2. Configure alerts in `.env`:
   ```bash
   cp .env.security.example .env.security
   # Edit .env.security with your configuration
   source .env.security
   ```

3. The security middleware is automatically integrated

## Documentation

See: `/Users/joshuastone/FANZ-Unified-Ecosystem/fanzdash/FILE_SECURITY_SYSTEM.md`

## Support

For issues: security@fanz.network
