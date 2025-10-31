#!/usr/bin/env node
// PupFanz Platform Development Server
// FANZ Ecosystem - Creator Platform for Pup Play & Fetish Content

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5177;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'PupFanz Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ecosystem: 'FANZ',
    mode: 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>PupFanz - Pup Play & Fetish Platform</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a2e; color: #eee; }
            .container { max-width: 800px; margin: 0 auto; text-align: center; }
            .logo { font-size: 3em; font-weight: bold; color: #39ff14; margin-bottom: 20px; }
            .status { background: #16213e; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .feature { background: #0f1419; padding: 15px; margin: 10px; border-radius: 5px; }
            .warning { background: #ff174433; border: 1px solid #ff1744; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🐾 PupFanz</div>
            <h2>Pup Play & Fetish Creator Platform</h2>
            <div class="warning">
                <h4>⚠️ Development Mode</h4>
                <p>This is a simplified development server. Full database features are disabled.</p>
            </div>
            <div class="status">
                <h3>🚀 Service Status: ONLINE</h3>
                <p>Part of the FANZ Ecosystem</p>
                <p>Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}</p>
            </div>
            <div class="feature">
                <h4>🎭 Fetish & Kink Community</h4>
                <p>Safe space for pup play, BDSM, and alternative lifestyle creators</p>
            </div>
            <div class="feature">
                <h4>🛡️ Privacy Focused</h4>
                <p>Advanced privacy controls and community guidelines</p>
            </div>
            <div class="feature">
                <h4>💰 Creator Revenue</h4>
                <p>100% creator ownership with transparent monetization</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    platform: 'PupFanz',
    description: 'Pup Play & Fetish Creator Platform',
    ecosystem: 'FANZ',
    port: PORT,
    status: 'operational',
    mode: 'development',
    features: [
      'Fetish Content Management',
      'Pup Play Community',
      'BDSM Creator Tools', 
      'Alternative Lifestyle Support',
      'Privacy Controls'
    ]
  });
});

// Placeholder API routes
app.get('/api/creators', (req, res) => {
  res.json({
    message: 'Creator API endpoint - Database connection required for full functionality',
    development_note: 'This is a placeholder response in development mode'
  });
});

app.get('/api/content', (req, res) => {
  res.json({
    message: 'Content API endpoint - Database connection required for full functionality',
    development_note: 'This is a placeholder response in development mode'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🐾 PupFanz Platform running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚠️  Development mode - Database features disabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🐾 PupFanz Platform shutting down...');
  process.exit(0);
});