import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding user activity...');

  // 1. Берём пользователей с ролью mo
  const users = await prisma.users.findMany({
    where: { role: 'mo' },
    select: { id: true },
  });

  if (!users.length) {
    console.log('⚠️ Нет пользователей с ролью mo');
    return;
  }

  const activities = [];

  // 2. Генерируем активность
  users.forEach((user) => {
    // ---- 7 дней ----
    for (let d = 0; d < 7; d++) {
      const day = dayjs().subtract(d, 'day');

      // 1–3 визита в день
      const visitsPerDay = rand(1, 3);

      for (let v = 0; v < visitsPerDay; v++) {
        const hour = rand(9, 18);

        // 3–10 действий в рамках одного часа
        const actionsInHour = rand(3, 10);

        for (let a = 0; a < actionsInHour; a++) {
          activities.push({
            user_id: user.id,
            action: 'view_dashboard',
            created_at: day
              .hour(hour)
              .minute(rand(0, 59))
              .second(rand(0, 59))
              .toDate(),
          });
        }
      }
    }

    // ---- 30 дней ----
    for (let d = 8; d < 30; d += rand(2, 4)) {
      const day = dayjs().subtract(d, 'day');
      activities.push({
        user_id: user.id,
        action: 'open_report',
        created_at: day.hour(rand(8, 17)).toDate(),
      });
    }

    // ---- 90 дней ----
    for (let d = 31; d < 90; d += rand(5, 10)) {
      const day = dayjs().subtract(d, 'day');
      activities.push({
        user_id: user.id,
        action: 'login',
        created_at: day.hour(rand(8, 16)).toDate(),
      });
    }
  });

  // 3. Записываем в БД
  await prisma.user_activity.createMany({
    data: activities,
  });

  console.log(`✅ Created ${activities.length} user_activity records`);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

main()
  .catch((e) => {
    console.error('❌ Seed error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
