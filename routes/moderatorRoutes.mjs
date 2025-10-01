import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.mjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();
router.use(authenticateJWT, authorizeRoles('moderator'));

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Moderator dashboard' });
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


// POST — публикация отчётов
router.post('/reports', async (req, res) => {
  const { reports } = req.body;
  if (!Array.isArray(reports) || reports.length === 0) {
    return res.status(400).json({ message: 'Некорректные данные для публикации' });
  }

  try {
    const createdReports = await prisma.reports.createMany({
      data: reports.map((report) => ({
        full_name: report.fullName,
        appeal_date: new Date(report.appealDate),
        appeal_type: report.appealType,
        department: report.department,
        subject: report.subject,
        description: report.description,
        route: report.route,
        status: report.status,
        mo_id: report.moId,
        reporting_period_start_date: report.reportingPeriodStartDate,
        reporting_period_end_date: report.reportingPeriodEndDate,
        agency_type: report.agencyType,
        created_by: report.createdBy,
        updated_by: report.updatedBy,
      })),
      skipDuplicates: true, // ✅ игнорировать дубли
    });

    res.status(201).json({ message: 'Отчеты успешно опубликованы', count: createdReports.count });
  } catch (error) {
    console.error('Ошибка сохранения отчётов:', error);
    res.status(500).json({ message: 'Ошибка при сохранении отчётов', error: error.message });
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

router.delete('/delete-reports-by-date', async (req, res) => {
  const { date } = req.body; // ожидаем: { date: "2025-07-19T00:00:00.000Z" }

  if (!date) {
    return res.status(400).json({ message: 'Не указана дата' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Некорректный формат даты' });
  }

  try {
    const deleted = await prisma.reports.deleteMany({
      where: {
        reporting_period_start_date: parsedDate,
      },
    });

    res.json({
      message: 'Удаление завершено',
      count: deleted.count,
    });
  } catch (error) {
    console.error('❌ Ошибка при удалении отчетов по дате:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /reports/update-reports
router.post('/reports/update-reports', async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: 'Массив обновлений пустой или не передан' });
  }

  try {
    // транзакция чтобы все обновления были атомарными
    const results = await prisma.$transaction(
      updates.map(item =>
        prisma.reports.update({
          where: { id: Number(item.id) },
          data: {
            status: item.status,
            department: item.department,
            mo_id: item.moId,
            updated_at: new Date(),
          },
        })
      )
    );

    res.json({
      message: 'Статусы обновлены',
      count: results.length,
      reports: results,
    });
  } catch (error) {
    console.error('❌ Ошибка при обновлении статусов:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Некоторые отчёты не найдены' });
    }

    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/reports/unique-periods', async (req, res) => {
  try {
    // достаем все отчёты
    const reports = await prisma.reports.findMany({
      orderBy: { reporting_period_start_date: 'desc' },
    });

    if (!reports || reports.length === 0) {
      return res.status(404).json({ message: 'Отчёты не найдены' });
    }

    // получаем пользователей одним запросом (если у тебя есть таблица users)
    const users = await prisma.users.findMany({
      select: { id: true, full_name: true },
    });

    // сокращение ФИО
    const shortenFullName = (fullName) => {
      if (!fullName) return '';
      const parts = fullName.split(' ');
      if (parts.length < 2) return fullName;
      return `${parts[0]} ${parts[1][0]}.`;
    };

    // мапим уникальные периоды
    const uniquePeriodsMap = new Map();

    reports.forEach((report) => {
      const key = `${report.reporting_period_start_date}_${report.reporting_period_end_date}`;
      if (!uniquePeriodsMap.has(key)) {
        const user = users.find((u) => u.id === report.created_by);

        uniquePeriodsMap.set(key, {
          reporting_period_start_date: report.reporting_period_start_date,
          reporting_period_end_date: report.reporting_period_end_date,
          userName: shortenFullName(user?.full_name),
          createdAt: report.created_at,
          reports: [], // пока пусто
        });
      }
    });

    res.json(Array.from(uniquePeriodsMap.values()));
  } catch (error) {
    console.error('❌ Ошибка при получении уникальных отчётов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});




export default router;
