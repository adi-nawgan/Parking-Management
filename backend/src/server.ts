import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';

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

connectDB();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/anpr', anprRoutes);

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
