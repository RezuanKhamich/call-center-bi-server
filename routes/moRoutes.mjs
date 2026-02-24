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

      /* ------------------------------ */
      /* 📅 Фильтр по appeal_date      */
      /* ------------------------------ */

      if (reporting_period_start_date || reporting_period_end_date) {
        where.appeal_date = {};

        if (reporting_period_start_date) {
          const from = new Date(reporting_period_start_date);
          from.setUTCHours(0, 0, 0, 0);
          where.appeal_date.gte = from;
        }

        if (reporting_period_end_date) {
          const to = new Date(reporting_period_end_date);
          to.setUTCHours(0, 0, 0, 0);
          where.appeal_date.lte = to;
        }
      }

      const moId = Number(mo_id);

      if (Number.isNaN(moId)) {
        return res.status(400).json({ message: 'Invalid mo_id' });
      }

      /* ------------------------------ */
      /* 🚀 Один запрос к БД           */
      /* ------------------------------ */

      const reports = await prisma.reports.findMany({
        where,
        orderBy: [{ appeal_date: 'desc' }],
      });

      /* ------------------------------ */
      /* 🔎 Разделение в памяти        */
      /* ------------------------------ */

      const selectedMoReports = reports.filter(
        (r) => r.mo_id === moId
      );

      const otherMoReports = reports
        .filter((r) => r.mo_id !== moId)
        .map(({ id, department, status, appeal_date, mo_id }) => ({
          id,
          department,
          status,
          appeal_date,
          mo_id,
        }));

      res.json([...selectedMoReports, ...otherMoReports]);

    } catch (error) {
      console.error('❌ Ошибка получения отчетов:', error);
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
