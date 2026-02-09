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

export async function getActivitySummary({ prisma, from, to }) {
  return prisma.$queryRaw`
    SELECT
      DATE(hour_bucket) AS date,
      u.id AS user_id,
      u.full_name,
      u.mo_id,
      mo.name AS mo_name,
      COUNT(*) AS visits,
      MAX(last_activity) AS last_activity
    FROM (
      SELECT
        ua.user_id,
        DATE_TRUNC('hour', ua.created_at) AS hour_bucket,
        MAX(ua.created_at) AS last_activity
      FROM user_activity ua
      WHERE ua.created_at >= ${from}
        AND ua.created_at < ${to}
      GROUP BY ua.user_id, hour_bucket
    ) h
    JOIN users u ON u.id = h.user_id
    LEFT JOIN med_organizations mo ON mo.id = u.mo_id
    WHERE u.role = 'mo'
    GROUP BY date, u.id, u.full_name, u.mo_id, mo.name
    ORDER BY date ASC
  `;
}

