import { Router } from 'express';
import { pool } from '../db.js';
import { safe } from '../middleware/errors.js';
import { auth } from '../middleware/auth.js';
import { calculateDashboardTotals } from '../utils/dashboard-summary.js';

const router = Router();

async function getDashboard(req, res) {
  const onlyOwnIncidents = req.user.role === 'USER';
  const incidentFilter = onlyOwnIncidents ? 'WHERE reporter_id = $1' : '';
  const joinFilter = onlyOwnIncidents ? 'AND i.reporter_id = $1' : '';
  const params = onlyOwnIncidents ? [req.user.id] : [];

  const statusesResult = await pool.query(
    `SELECT status, COUNT(*)::int AS count
     FROM incidents ${incidentFilter}
     GROUP BY status`,
    params
  );

  const categoriesResult = await pool.query(
    `SELECT c.name, COUNT(i.id)::int AS count
     FROM categories c
     LEFT JOIN incidents i ON i.category_id = c.id ${joinFilter}
     GROUP BY c.id
     ORDER BY count DESC`,
    params
  );

  const techniciansResult = await pool.query(
    `SELECT u.name, COUNT(i.id)::int AS count
     FROM users u
     LEFT JOIN incidents i ON i.technician_id = u.id ${joinFilter}
     WHERE u.role IN ('TECH', 'ADMIN')
     GROUP BY u.id
     ORDER BY count DESC`,
    params
  );

  const criticalResult = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM incidents
     WHERE priority = 'CRITICA'
       AND status <> 'CERRADO'
       ${onlyOwnIncidents ? 'AND reporter_id = $1' : ''}`,
    params
  );

  const statuses = statusesResult.rows;
  const totals = calculateDashboardTotals(statuses, criticalResult.rows[0].count);

  res.json({
    statuses,
    categories: categoriesResult.rows,
    technicians: techniciansResult.rows,
    totals
  });
}

router.get('/', auth, safe(getDashboard));

export default router;
