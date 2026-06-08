require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const socketUtil = require('./utils/socket');
const { startOverstayChecker } = require('./utils/overstayChecker');

// Route files
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const residentRoutes = require('./routes/residentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const logRoutes = require('./routes/logRoutes');
const anprRoutes = require('./routes/anprRoutes');

// Connect to Database
connectDB();

const app = express();

// Enable CORS
app.use(cors({
  origin: '*', // In production, specify the frontend domain URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Body parser
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/anpr', anprRoutes);

// Base route for sanity check
app.get('/', (req, res) => {
  res.send('SPMS API is running...');
});

// Error handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Bind socket utility
socketUtil.init(io);

// Start Server and Cron Monitor
server.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
  
  // Start background monitoring for overstay alerts
  startOverstayChecker();
});
