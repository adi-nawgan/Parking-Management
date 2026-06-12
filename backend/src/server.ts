import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './config/db';
import { notFound, errorHandler } from './middleware/errorMiddleware';
import { init } from './utils/socket';
import { startOverstayChecker } from './utils/overstayChecker';

import authRoutes from './routes/authRoutes';
import settingsRoutes from './routes/settingsRoutes';
import residentRoutes from './routes/residentRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import visitorRoutes from './routes/visitorRoutes';
import logRoutes from './routes/logRoutes';
import anprRoutes from './routes/anprRoutes';
import memberRoutes from './routes/memberRoutes';
import adminReportRoutes from './routes/adminReportRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import securityRoutes from './routes/securityRoutes';
import guardMgmtRoutes from './routes/guardMgmtRoutes';

connectDB();

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/anpr', anprRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/admin/security-guards', guardMgmtRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.send('SPMS API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

init(io);

server.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
  startOverstayChecker();
});
