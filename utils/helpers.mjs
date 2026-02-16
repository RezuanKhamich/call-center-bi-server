export function groupByDate(rows) {
  const map = new Map();

  rows.forEach(r => {
    if (!map.has(r.date)) {
      map.set(r.date, {
        date: r.date,
        visits: 0,
        users: [],
      });
    }

    const day = map.get(r.date);
    day.visits += Number(r.visits);

    day.users.push({
      user_id: r.user_id,
      full_name: r.full_name,
      mo_id: r.mo_id,
      visits: Number(r.visits),
      last_activity: r.last_activity,
    });
  });

  return Array.from(map.values());
}

export function groupByHour(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const hourKey = new Date(row.date)
      .toISOString()
      .substring(11, 16); // "14:00"

    if (!map.has(hourKey)) {
      map.set(hourKey, {
        date: hourKey,
        users: [],
      });
    }

    map.get(hourKey).users.push({
      user_id: row.user_id,
      full_name: row.full_name,
      mo_id: row.mo_id,
      mo_name: row.mo_name,
      visits: row.visits,
      last_activity: row.last_activity,
    });
  });

  return Array.from(map.values());
}

export async function getActivitySummary({
  prisma,
  from,
  to,
  granularity = 'day', // 'day' | 'hour'
}) {
  const dateExpression =
    granularity === 'hour'
      ? `DATE_TRUNC('hour', h.hour_bucket)`
      : `DATE(h.hour_bucket)`;

  return prisma.$queryRawUnsafe(`
    SELECT
      ${dateExpression} AS date,
      u.id AS user_id,
      u.full_name,
      u.mo_id,
      mo.name AS mo_name,
      COUNT(*)::int AS visits,
      MAX(h.last_activity) AS last_activity
    FROM (
      SELECT
        ua.user_id,
        DATE_TRUNC('hour', ua.created_at) AS hour_bucket,
        MAX(ua.created_at) AS last_activity
      FROM user_activity ua
      WHERE ua.created_at >= $1
        AND ua.created_at < $2
      GROUP BY ua.user_id, hour_bucket
    ) h
    JOIN users u ON u.id = h.user_id
    LEFT JOIN med_organizations mo ON mo.id = u.mo_id
    WHERE u.role = 'mo'
    GROUP BY ${dateExpression}, u.id, u.full_name, u.mo_id, mo.name
    ORDER BY date ASC
  `, from, to);
}

