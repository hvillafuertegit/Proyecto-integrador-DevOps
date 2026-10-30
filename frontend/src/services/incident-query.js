export function buildIncidentQuery(filters = {}) {
  const params = new URLSearchParams();
  const fields = {
    status: filters.status,
    priority: filters.priority,
    category: filters.category,
    technician: filters.technician,
    q: filters.q?.trim(),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value));
    }
  }

  return params.toString();
}
