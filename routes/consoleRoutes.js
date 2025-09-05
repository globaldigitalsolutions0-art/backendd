import express from 'express';
import { getSystemInfo, getLogs, getActiveConnections, restartServer } from '../controllers/consoleController.js';
import { consoleAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all console routes
router.use(consoleAuth);

// System information endpoint
router.get('/system-info', getSystemInfo);

// Server logs endpoint
router.get('/logs', getLogs);

// Active database connections
router.get('/connections', getActiveConnections);

// Server control endpoints
router.post('/restart', restartServer);

export default router;