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
    role: 'moderator'
  },
  {
    id: 2,
    username: 'mo1',
    password: '$2b$10$xyz789...', // захешированный пароль
    role: 'mo'
  },
  {
    id: 3,
    username: 'ministr1',
    password: '$2b$10$xyz111...', // захешированный пароль
    role: 'ministr'
  }
];

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Найти пользователя
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
  }

  // Проверить пароль
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
  }

  // Сгенерировать токен
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'mysecret',
    { expiresIn: '2h' }
  );

  res.json({ token });
});

export default router;
