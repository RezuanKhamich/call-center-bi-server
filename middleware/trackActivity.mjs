// middleware/trackMoActivity.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const trackMoActivity = (action = 'generic_action') => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'mo') {
        await prisma.user_activity.create({
          data: {
            user_id: req.user.id,
            action,
          },
        });
      }
    } catch (err) {
      console.error('⚠️ Activity tracking error:', err.message);
    }
    next();
  };
};
