import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.mjs';

const router = express.Router();

router.use(authenticateJWT, authorizeRoles('ministr'));

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Ministr dashboard' });
});

export default router;
