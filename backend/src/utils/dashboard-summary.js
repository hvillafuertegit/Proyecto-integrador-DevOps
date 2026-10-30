const OPEN_STATUSES = new Set(['NUEVO', 'ASIGNADO', 'EN_PROCESO']);

export function calculateDashboardTotals(statuses, criticalCount) {
  const total = statuses.reduce((sum, row) => sum + Number(row.count), 0);
  const open = statuses.reduce(
    (sum, row) => sum + (OPEN_STATUSES.has(row.status) ? Number(row.count) : 0),
    0
  );
  const closed = statuses
    .filter((row) => row.status === 'CERRADO')
    .reduce((sum, row) => sum + Number(row.count), 0);

  return {
    total,
    open,
    closed,
    critical: Number(criticalCount)
  };
}
