import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import authRoutes from './routes/authRoutes.mjs';
import moderatorRoutes from './routes/moderatorRoutes.mjs';
import moRoutes from './routes/moRoutes.mjs';
import ministrRoutes from './routes/ministrRoutes.mjs';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
// app.use(cors({ origin: 'http://localhost:5173', credentials: false }));
// app.use(cors({ origin: 'https://call-center-bi-front.onrender.com', credentials: false }));

const allowedOrigins = ['https://call-center-bi-front.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
}));

app.options('*', cors());

app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/mo', moRoutes);
app.use('/api/ministr', ministrRoutes);

const allUsers = await prisma.users.findMany();
console.log('user', allUsers)
const PORT = process.env.PORT || 5009;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});