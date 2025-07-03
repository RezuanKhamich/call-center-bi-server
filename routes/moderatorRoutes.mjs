import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.mjs';

const router = express.Router();

router.use(authenticateJWT, authorizeRoles('moderator'));

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Moderator dashboard' });
});

router.get('/reports', (req, res) => {
  res.json({ message: 'Moderator reports' });
});

router.get('/history', (req, res) => {
  res.json({ message: 'Moderator history' });
});

export default router;
