import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.mjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();
router.use(authenticateJWT, authorizeRoles('minister'));

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Minister dashboard' });
});

// GET /api/mo — получить список медорганизаций
router.get('/get-mo-list', async (req, res) => {
  try {
    const organizations = await prisma.med_organizations.findMany({
      orderBy: { name: 'asc' }, // сортировка по названию
    })

    res.json(organizations)
  } catch (error) {
    console.error('❌ Ошибка получения МО:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.get('/reports-by-date', async (req, res) => {
  try {
    const {
      reporting_period_start_date,
      reporting_period_end_date,
    } = req.query;

    const where = {};

    if (reporting_period_start_date) {
      where.reporting_period_start_date = {
        gte: new Date(reporting_period_start_date),
      };
    }

    if (reporting_period_end_date) {
      where.reporting_period_end_date = {
        lte: new Date(reporting_period_end_date),
      };
    }

    const reports = await prisma.reports.findMany({
      where,
      orderBy: [
        { reporting_period_end_date: 'desc' },
        { reporting_period_start_date: 'desc' },
      ],
    });

    res.json(reports);
  } catch (error) {
    console.error('❌ Ошибка получения отчетов по диапазону и типу:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/get-users', async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        full_name: true,
      },
      orderBy: {
        full_name: 'asc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('❌ Ошибка получения пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
