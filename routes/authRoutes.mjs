import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = express.Router()

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, password, remember } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Пароль или email не указаны' })
  }

  // 🔍 Находим пользователя по email
  const user = await prisma.users.findUnique({
    where: { email },
  })

  if (!user) {
    return res.status(401).json({ message: 'Пользователь не найден' })
  }

  // 🔐 Проверка пароля
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ message: 'Неверный пароль или email' })
  }

  // ⏱️ Проверка срока действия пароля
  const lastChange = new Date(user.password_created_at || user.last_login || 0)
  const now = new Date()
  const diffDays = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)

  if (diffDays > 90) {
    return res.status(403).json({ message: 'Пароль устарел. Требуется ввести новый пароль.' })
  }

  // 🎫 Генерация токена
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      moId: user.mo_id,
    },
    process.env.JWT_SECRET || 'secret',
    {
      expiresIn: remember ? '90d' : '2h',
    }
  )

  // ⏱️ Обновляем дату последнего входа
  await prisma.users.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  })

  res.json({
  token,
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
    moId: user.mo_id,
    fullName: user.full_name,
    lastLogin: user.last_login,
    passwordCreatedAt: user.password_created_at,
  }
 })
})

export default router
// TODO: написать функцию для автогенерации нового пароля через 3 месяца
// TODO: написать функцию для сервера для отправки нового пароля через 3 месяца на почту
