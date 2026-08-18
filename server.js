import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import testRoutes from './src/routes/testRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';

// Load environment variables
dotenv.config();

const app = reportAppServer();

function reportAppServer() {
  const server = express();
  server.use(cors());
  server.use(express.json());
  return server;
}

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach Socket.io instance to app for controller access
app.set('io', io);

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on('update-location', async ({ mltId, orderId, lat, lng }) => {
    console.log(`Location update from MLT ${mltId}: ${lat}, ${lng} (Active Order: ${orderId})`);
    
    try {
      const MLT = (await import('./src/models/MLT.js')).default;
      await MLT.findByIdAndUpdate(mltId, {
        'location.coordinates': [lng, lat], // GeoJSON is [lng, lat]
        isOnline: true
      });
    } catch (err) {
      console.error('Error updating MLT location via WS:', err.message);
    }

    if (orderId) {
      io.to(`order_${orderId}`).emit('location-broadcast', { lat, lng, timestamp: Date.now() });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Database connection
connectDB();

// API Routes
import partnerRoutes from './src/routes/partnerRoutes.js';
import certificateRoutes from './src/routes/certificateRoutes.js';
import dispatchRoutes from './src/routes/dispatchRoutes.js';
app.use('/api/partners', partnerRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/auth', authRoutes);   // ← FIX: was imported but never mounted
app.use('/api', testRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Harsha Diagnostics Server is healthy' });
});

const PORT = process.env.PORT || 5005;

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️  Port ${PORT} is already in use by another running Node process.`);
    console.error(`💡  To free port ${PORT}, run: npm run kill-ports\n`);
    process.exit(1);
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log('Server running'); // ready signal for integration tests
});

// Global error handlers to surface issues in mock mode
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
