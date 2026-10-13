import type { Database } from '../types/database.js';

export async function getAdminStatistics(database: Database, days: number) {
  // Calendar days in UTC, including today. All period widgets use the same boundary.
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);
  const [summary, daily, topics, difficulty] = await Promise.all([
    database.query(`SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM questions WHERE is_active) AS questions,
      (SELECT COUNT(*)::int FROM skills WHERE is_active) AS skills,
      (SELECT COUNT(*)::int FROM interviews) AS interviews,
      (SELECT COUNT(*)::int FROM users WHERE created_at >= $1) AS "newUsers",
      (SELECT COUNT(*)::int FROM interviews WHERE started_at >= $1) AS "periodInterviews",
      (SELECT COUNT(*)::int FROM interviews WHERE started_at >= $1 AND status = 'COMPLETED') AS "completedInterviews",
      (SELECT ROUND(AVG(score), 1)::float FROM interviews WHERE started_at >= $1 AND status = 'COMPLETED') AS "averageScore",
      (SELECT ROUND(AVG(EXTRACT(EPOCH FROM completed_at - started_at)))::int FROM interviews
       WHERE started_at >= $1 AND status = 'COMPLETED' AND completed_at >= started_at) AS "averageInterviewSeconds",
      (SELECT COUNT(DISTINCT user_id)::int FROM activity_sessions WHERE started_at >= $1 AND active_seconds > 0) AS "activeUsers",
      (SELECT COUNT(DISTINCT user_id)::int FROM activity_sessions WHERE last_seen_at >= NOW() - INTERVAL '90 seconds' AND active_seconds > 0) AS "onlineUsers",
      (SELECT COUNT(*)::int FROM activity_sessions WHERE started_at >= $1 AND active_seconds > 0) AS "trackedSessions",
      (SELECT ROUND(AVG(active_seconds))::int FROM activity_sessions WHERE started_at >= $1 AND active_seconds > 0) AS "averageSessionSeconds",
      (SELECT MIN(started_at) FROM activity_sessions) AS "trackingSince"`, [since]),
    database.query(`WITH days AS (
        SELECT generate_series($1::timestamptz AT TIME ZONE 'UTC', (NOW() AT TIME ZONE 'UTC')::date, INTERVAL '1 day')::date AS day
      ), registrations AS (
        SELECT (created_at AT TIME ZONE 'UTC')::date AS day, COUNT(*)::int AS count FROM users WHERE created_at >= $1 GROUP BY 1
      ), attempts AS (
        SELECT (started_at AT TIME ZONE 'UTC')::date AS day, COUNT(*)::int AS count FROM interviews WHERE started_at >= $1 GROUP BY 1
      ) SELECT to_char(days.day, 'YYYY-MM-DD') AS date, COALESCE(registrations.count, 0) AS registrations,
        COALESCE(attempts.count, 0) AS interviews
      FROM days LEFT JOIN registrations USING (day) LEFT JOIN attempts USING (day) ORDER BY days.day`, [since]),
    database.query(`SELECT skill.name, COUNT(*)::int AS interviews,
        COUNT(*) FILTER (WHERE interview.status = 'COMPLETED')::int AS completed,
        ROUND(AVG(interview.score) FILTER (WHERE interview.status = 'COMPLETED'), 1)::float AS "averageScore"
      FROM interviews AS interview JOIN skills AS skill ON skill.id = interview.skill_id
      WHERE interview.started_at >= $1 GROUP BY skill.id, skill.name ORDER BY interviews DESC, skill.name LIMIT 5`, [since]),
    database.query(`SELECT difficulty, COUNT(*)::int AS count FROM questions WHERE is_active GROUP BY difficulty`),
  ]);
  return { ...summary.rows[0], days, daily: daily.rows, topics: topics.rows, difficulty: difficulty.rows };
}
