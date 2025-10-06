import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import authRoutes from './routes/authRoutes.mjs';
import moderatorRoutes from './routes/moderatorRoutes.mjs';
import moRoutes from './routes/moRoutes.mjs';
import ministerRoutes from './routes/ministerRoutes.mjs';
import agecyModeratorRoutes from './routes/agencyModeratorRoutes.mjs';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
app.use(cors({ origin: 'http://localhost:5173', credentials: false }));
// app.use(cors({ origin: 'https://call-center-bi-front.onrender.com', credentials: false }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API is working' });
});

app.use('/api', authRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/agency-moderator', agecyModeratorRoutes);
app.use('/api/mo', moRoutes);
app.use('/api/minister', ministerRoutes);

const PORT = process.env.PORT || 5009;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});