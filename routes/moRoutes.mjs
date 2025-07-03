import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.mjs';

const router = express.Router();

router.use(authenticateJWT, authorizeRoles('mo'));

router.get('/dashboard', (req, res) => {
  res.json({ message: 'MO dashboard' });
});

export default router;
