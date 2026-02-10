import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.mjs';
import { PrismaClient } from '@prisma/client';
import { getActivitySummary, groupByDate } from '../utils/helpers.mjs';

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

    if (reporting_period_start_date && reporting_period_end_date) {
      const from = new Date(reporting_period_start_date);
      const to = new Date(reporting_period_end_date);

      where.AND = [
        {
          reporting_period_start_date: {
            lte: to, // начало отчёта <= конец фильтра
          },
        },
        {
          reporting_period_end_date: {
            gte: from, // конец отчёта >= начало фильтра
          },
        },
      ];
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
    console.error('❌ Ошибка получения отчетов по диапазону:', error);
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

router.get('/activity/summary/week', async (req, res) => {
  try {
    const to = new Date();
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rows = await getActivitySummary({ prisma, from, to });

    res.json(groupByDate(rows));
  } catch (e) {
    console.error('❌ activity week error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/activity/summary/month', async (req, res) => {
  try {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const rows = await getActivitySummary({ prisma, from, to });

    res.json(groupByDate(rows));
  } catch (e) {
    console.error('❌ activity month error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/activity/summary/90days', async (req, res) => {
  try {
    const to = new Date();
    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const rows = await getActivitySummary({ prisma, from, to });

    res.json(groupByDate(rows));
  } catch (e) {
    console.error('❌ activity 90days error', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
