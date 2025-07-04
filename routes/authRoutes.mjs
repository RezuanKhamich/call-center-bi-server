import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const router = express.Router();

// Имитация базы данных пользователей
const users = [
  {
    id: 1,
    username: 'moderator1',
    password: '$2b$10$abc123', // захешированный пароль
    role: 'moderator',
    lastPasswordChange: '2024-04-01T12:00:00Z'
  },
  {
    id: 2,
    username: 'mo1',
    password: '$2b$10$xyz789...', // захешированный пароль
    role: 'mo',
    lastPasswordChange: '2024-04-01T12:00:00Z'
  },
  {
    id: 3,
    username: 'ministr1',
    password: '$2b$10$xyz111...', // захешированный пароль
    role: 'ministr',
    lastPasswordChange: '2024-04-01T12:00:00Z'
  }
];

// POST /api/login
router.post('/login', async (req, res) => {
  const { password, remember } = req.body;

  const user = users.find(u => u.role === role);
  const valid = await bcrypt.compare(password, user.password);

  if (!user || !valid) return res.status(401).json({ message: 'Ошибка авторизации' });

  // ⏱️ проверка срока действия пароля
  const lastChange = new Date(user.lastPasswordChange);
  const now = new Date();
  const diffDays = (now - lastChange) / (1000 * 60 * 60 * 24);

  if (diffDays > 90) {
    return res.status(403).json({ message: 'Пароль устарел. Требуется ввести новый пароль.' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    {
      expiresIn: remember ? '30d' : '2h'
    }
  );

  res.json({ token });
});


export default router;
