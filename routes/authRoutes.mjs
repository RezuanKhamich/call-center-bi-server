import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = express.Router()

const MAX_ATTEMPTS = 5
const BLOCK_TIME_MINUTES = 15

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, password, remember } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Пароль или email не указаны' })
  }

  const user = await prisma.users.findUnique({
    where: { email },
  })

  if (!user) {
    return res.status(401).json({ message: 'Неверный пароль или email' })
  }

  const now = new Date()

  // Проверка блокировки по попыткам
  if (user.login_attempts >= MAX_ATTEMPTS && user.last_attempt_at) {
    const minutesSinceLastAttempt = (now.getTime() - user.last_attempt_at.getTime()) / (1000 * 60)
    if (minutesSinceLastAttempt < BLOCK_TIME_MINUTES) {
      return res.status(429).json({
        message: `Слишком много неудачных попыток. Попробуйте через ${Math.ceil(BLOCK_TIME_MINUTES - minutesSinceLastAttempt)} минут.`,
      })
    } else {
      // сбросим попытки после блокировки
      await prisma.users.update({
        where: { id: user.id },
        data: {
          login_attempts: 0,
          last_attempt_at: null,
        },
      })
    }
  }

  const valid = await bcrypt.compare(password, user.password_hash)

  if (!valid) {
    await prisma.users.update({
      where: { id: user.id },
      data: {
        login_attempts: { increment: 1 },
        last_attempt_at: now,
      },
    })

    return res.status(401).json({ message: 'Неверный пароль или email' })
  }

  // успешный вход — сбрасываем счётчик
  await prisma.users.update({
    where: { id: user.id },
    data: {
      login_attempts: 0,
      last_attempt_at: null,
      last_login: now,
    },
  })

  const passwordAgeDays =
    (now.getTime() - new Date(user.password_created_at || user.last_login || 0).getTime()) / (1000 * 60 * 60 * 24)

  if (passwordAgeDays > 90) {
    return res.status(403).json({ message: 'Пароль устарел. Требуется ввести новый пароль.' })
  }

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

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      moId: user.mo_id,
      fullName: user.full_name,
      lastLogin: now,
      passwordCreatedAt: user.password_created_at,
    },
  })
})

export default router
// TODO: написать функцию для автогенерации нового пароля через 3 месяца
// TODO: написать функцию для сервера для отправки нового пароля через 3 месяца на почту
