import { Router } from 'express';
import { pool } from '../db.js';
import { safe } from '../middleware/errors.js';
import { auth, roles } from '../middleware/auth.js';
import { statuses } from '../utils/constants.js';
import { validateIncident } from '../utils/incident-validation.js';
import { buildIncidentFilters } from '../utils/incident-filters.js';
import { withTransaction } from '../utils/transaction.js';

const router = Router();

async function listIncidents(req, res) {
  const { where, params } = buildIncidentFilters(req.query, req.user);
  const sql = `
    SELECT i.*, c.name AS category, u.name AS reporter, t.name AS technician
    FROM incidents i
    JOIN categories c ON c.id = i.category_id
    JOIN users u ON u.id = i.reporter_id
    LEFT JOIN users t ON t.id = i.technician_id
    ${where}
    ORDER BY i.created_at DESC
    LIMIT 200
  `;
  const { rows } = await pool.query(sql, params);
  res.json(rows);
}

async function getIncident(req, res) {
  const { rows } = await pool.query(
    `SELECT i.*, c.name AS category, u.name AS reporter, t.name AS technician
     FROM incidents i
     JOIN categories c ON c.id = i.category_id
     JOIN users u ON u.id = i.reporter_id
     LEFT JOIN users t ON t.id = i.technician_id
     WHERE i.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  const incident = rows[0];
  if (req.user.role === 'USER' && incident.reporter_id !== req.user.id) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  const history = await pool.query(
    `SELECT h.*, u.name AS author
     FROM incident_history h
     JOIN users u ON u.id = h.user_id
     WHERE h.incident_id = $1
     ORDER BY h.created_at DESC`,
    [req.params.id]
  );
  res.json({ ...incident, history: history.rows });
}

async function createIncident(req, res) {
  const { title, description, category_id, priority = 'MEDIA' } = req.body;
  const error = validateIncident({ title, description, category_id, priority });
  if (error) return res.status(400).json({ error });

  const incident = await withTransaction(async client => {
    const { rows } = await client.query(
      `INSERT INTO incidents (title, description, category_id, priority, reporter_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title.trim(), description.trim(), Number(category_id), priority, req.user.id]
    );
    await client.query(
      `INSERT INTO incident_history (incident_id, user_id, action, detail)
       VALUES ($1, $2, $3, $4)`,
      [rows[0].id, req.user.id, 'CREADO', 'Incidente registrado']
    );
    return rows[0];
  });
  res.status(201).json(incident);
}

async function updateIncident(req, res) {
  const { status, technician_id } = req.body;
  if (status && !statuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  if (status === undefined && technician_id === undefined) {
    return res.status(400).json({ error: 'Sin cambios' });
  }
  if (req.user.role === 'TECH' && technician_id !== undefined) {
    return res.status(403).json({ error: 'Solo administrador asigna técnicos' });
  }

  const result = await withTransaction(async client => {
    const current = await client.query(
      'SELECT * FROM incidents WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (!current.rows.length) return { error: 'No encontrado', code: 404 };
    if (req.user.role === 'TECH' && current.rows[0].technician_id !== req.user.id) {
      return { error: 'Solo puedes actualizar tus asignaciones', code: 403 };
    }
    const { rows } = await client.query(
      `UPDATE incidents
       SET status = COALESCE($1, status),
           technician_id = CASE WHEN $2::boolean THEN $3 ELSE technician_id END,
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status || null, technician_id !== undefined, technician_id ?? null, req.params.id]
    );
    await client.query(
      `INSERT INTO incident_history (incident_id, user_id, action, detail)
       VALUES ($1, $2, $3, $4)`,
      [req.params.id, req.user.id, 'ACTUALIZADO',
        `Estado: ${rows[0].status}; técnico: ${rows[0].technician_id ?? 'sin asignar'}`]
    );
    return { incident: rows[0] };
  });
  if (result.error) return res.status(result.code).json({ error: result.error });
  res.json(result.incident);
}

async function addComment(req, res) {
  const detail = String(req.body.detail || '').trim();
  if (!detail) return res.status(400).json({ error: 'Comentario vacío' });
  const found = await pool.query('SELECT reporter_id FROM incidents WHERE id = $1', [req.params.id]);
  if (!found.rows.length) return res.status(404).json({ error: 'No encontrado' });
  if (req.user.role === 'USER' && found.rows[0].reporter_id !== req.user.id) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  const { rows } = await pool.query(
    `INSERT INTO incident_history (incident_id, user_id, action, detail)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.id, req.user.id, 'COMENTARIO', detail]
  );
  res.status(201).json(rows[0]);
}

router.get('/', auth, safe(listIncidents));
router.get('/:id', auth, safe(getIncident));
router.post('/', auth, safe(createIncident));
router.patch('/:id', auth, roles('ADMIN', 'TECH'), safe(updateIncident));
router.post('/:id/comments', auth, safe(addComment));

export default router;
