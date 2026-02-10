import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.mjs';
import { PrismaClient } from '@prisma/client';
import { trackMoActivity } from '../middleware/trackActivity.mjs';

const prisma = new PrismaClient();
const router = express.Router();
router.use(authenticateJWT, authorizeRoles('mo'));

router.get('/dashboard', trackMoActivity('view_dashboard'), (req, res) => {
  res.json({ message: 'MO dashboard' });
});

// GET /api/mo — получить список медорганизаций
router.get('/get-mo-list', trackMoActivity('get-mo-list'), async (req, res) => {
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

router.get(
  '/reports-by-date',
  trackMoActivity('reports-by-date'),
  async (req, res) => {
    try {
      const {
        reporting_period_start_date,
        reporting_period_end_date,
        mo_id,
      } = req.query;

      const where = {};

      // 🧠 ЛОГИКА ПЕРЕСЕЧЕНИЯ ПЕРИОДОВ
      if (reporting_period_start_date && reporting_period_end_date) {
        const from = new Date(reporting_period_start_date);
        const to = new Date(reporting_period_end_date);

        where.AND = [
          {
            reporting_period_start_date: {
              lte: to,
            },
          },
          {
            reporting_period_end_date: {
              gte: from,
            },
          },
        ];
      }

      const moId = Number(mo_id);

      // ✅ 1. Отчёты выбранной МО — ВСЕ ПОЛЯ
      const selectedMoReports = await prisma.reports.findMany({
        where: {
          ...where,
          mo_id: moId,
        },
        orderBy: [
          { reporting_period_end_date: 'desc' },
          { reporting_period_start_date: 'desc' },
        ],
      });

      // 🚫 2. Отчёты остальных МО — ОГРАНИЧЕННЫЕ ПОЛЯ
      const otherMoReports = await prisma.reports.findMany({
        where: {
          ...where,
          NOT: { mo_id: moId },
        },
        select: {
          id: true,
          department: true,
          status: true,
          reporting_period_start_date: true,
          reporting_period_end_date: true,
          mo_id: true,
        },
        orderBy: [
          { reporting_period_end_date: 'desc' },
          { reporting_period_start_date: 'desc' },
        ],
      });

      res.json([...selectedMoReports, ...otherMoReports]);
    } catch (error) {
      console.error('❌ Ошибка получения отчетов по диапазону и МО:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
);


router.get('/get-users', trackMoActivity('get-users'), async (req, res) => {
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
