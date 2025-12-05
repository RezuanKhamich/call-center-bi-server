import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import crypto from "crypto";
import { sendMail } from '../utils/mailer.mjs';

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

  // Вернуть после добавления сброса пароля
  // const passwordAgeDays =
  //   (now.getTime() - new Date(user.password_created_at || user.last_login || 0).getTime()) / (1000 * 60 * 60 * 24)

  // if (passwordAgeDays > 90) {
  //   return res.status(403).json({ message: 'Пароль устарел. Требуется ввести новый пароль.' })
  // }

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
      agencyType: user.agency_type,
      fullName: user.full_name,
      lastLogin: now,
      passwordCreatedAt: user.password_created_at,
    },
  })
})

// POST /api/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email обязателен' })
  }

  const user = await prisma.users.findUnique({ where: { email } })

  if (!user) {
    return res.status(404).json({ message: 'Пользователь с таким email не найден' })
  }

  // Генерация токена
  const token = crypto.randomUUID()

  // Сохраняем токен в отдельной таблице (PasswordResetTokens)
  await prisma.password_reset_tokens.create({
    data: {
      token,
      user_id: user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 час жизни токена
      used: false,
    },
  })

  // Ссылка для сброса
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

  // Отправляем письмо
  try {
    await sendMail(
      user.email,
      'Сброс пароля',
      `Для сброса пароля перейдите по ссылке: ${resetLink}`
    )

    return res.json({ message: 'Ссылка для сброса пароля отправлена на почту' })
  } catch (err) {
    console.error('Ошибка при отправке письма:', err)
    return res.status(500).json({ message: 'Не удалось отправить письмо' })
  }
})

export default router