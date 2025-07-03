import express from 'express';
import authRoutes from './routes/authRoutes.mjs';
import moderatorRoutes from './routes/moderatorRoutes.mjs';
import moRoutes from './routes/moRoutes.mjs';
import ministrRoutes from './routes/ministrRoutes.mjs';

const app = express();
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/mo', moRoutes);
app.use('/api/ministr', ministrRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});