import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { exec } from 'child_process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Log file path
const logFilePath = path.join(rootDir, 'server.log');

// Create log file if it doesn't exist
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, 'Server log initialized\n');
}

// Custom logger that writes to console and file
export const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [INFO] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFilePath, logMessage);
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const errorStack = error ? `\n${error.stack}` : '';
    const logMessage = `[${timestamp}] [ERROR] ${message}${errorStack}\n`;
    console.error(message, error || '');
    fs.appendFileSync(logFilePath, logMessage);
  }
};

/**
 * Get system information
 */
export const getSystemInfo = async (req, res) => {
  try {
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
      uptime: Math.floor(os.uptime() / 3600) + ' hours ' + Math.floor((os.uptime() % 3600) / 60) + ' minutes',
      nodeVersion: process.version,
      mongoVersion: mongoose.version,
      processId: process.pid,
      env: process.env.NODE_ENV || 'development'
    };
    
    res.json(systemInfo);
    logger.log(`System info accessed by ${req.ip}`);
  } catch (error) {
    logger.error('Error getting system info', error);
    res.status(500).json({ error: 'Failed to get system information' });
  }
};

/**
 * Get server logs
 */
export const getLogs = async (req, res) => {
  try {
    const { lines = 100 } = req.query;
    
    if (!fs.existsSync(logFilePath)) {
      // Create an empty log file if it doesn't exist
      fs.writeFileSync(logFilePath, 'Server log initialized\n');
      return res.json({ logs: ['Server log initialized'] });
    }
    
    try {
      // Read the last N lines of the log file
      const data = fs.readFileSync(logFilePath, 'utf8');
      const logLines = data.split('\n').filter(line => line.trim() !== '');
      const lastLines = logLines.slice(-Math.min(parseInt(lines), logLines.length));
      
      res.json({ logs: lastLines });
      logger.log(`Logs accessed by ${req.ip}, showing last ${lines} lines`);
    } catch (readError) {
      // If there's an error reading the file, return an empty log array
      logger.error('Error reading log file', readError);
      res.json({ logs: ['Unable to read log file'] });
    }
  } catch (error) {
    logger.error('Error processing logs request', error);
    res.status(500).json({ error: 'Failed to process logs request' });
  }
};

/**
 * Get active database connections
 */
export const getActiveConnections = async (req, res) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Get connection stats
    const stats = {
      state: states[connectionState] || 'unknown',
      host: mongoose.connection.host || 'Not connected',
      name: mongoose.connection.name || 'Not connected',
      collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections).length : 0,
      models: mongoose.models ? Object.keys(mongoose.models).map(model => ({
        name: model,
        collection: mongoose.models[model].collection ? mongoose.models[model].collection.name : 'unknown'
      })) : []
    };
    
    res.json(stats);
    logger.log(`Database connection info accessed by ${req.ip}`);
  } catch (error) {
    logger.error('Error getting database connection info', error);
    res.status(500).json({ error: 'Failed to get database connection information' });
  }
};

/**
 * Restart the server
 * Note: This will only work if the server is run with a process manager like PM2
 */
export const restartServer = async (req, res) => {
  try {
    // Send response before restarting
    res.json({ message: 'Server restart initiated' });
    logger.log(`Server restart initiated by ${req.ip}`);
    
    // Wait a moment to ensure response is sent
    setTimeout(() => {
      // If using PM2, this would restart the process
      if (process.env.PM2_HOME) {
        exec('pm2 restart all', (error) => {
          if (error) {
            logger.error('Error restarting server with PM2', error);
          }
        });
      } else {
        logger.log('Server will exit. Process manager should restart it.');
        process.exit(0);
      }
    }, 1000);
  } catch (error) {
    logger.error('Error during server restart', error);
    res.status(500).json({ error: 'Failed to restart server' });
  }
};