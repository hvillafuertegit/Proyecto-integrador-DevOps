export function buildIncidentFilters(query = {}, user = {}) {
  const { status, priority, category, technician, q } = query;
  const filters = [];
  const params = [];

  function addFilter(column, value) {
    params.push(value);
    filters.push(`${column} = $${params.length}`);
  }

  if (status) addFilter('i.status', status);
  if (priority) addFilter('i.priority', priority);
  if (category) addFilter('i.category_id', Number(category));
  if (technician) addFilter('i.technician_id', Number(technician));

  if (q) {
    params.push(`%${q}%`);
    const index = params.length;
    filters.push(`(i.title ILIKE $${index} OR i.description ILIKE $${index})`);
  }

  if (user.role === 'USER') {
    addFilter('i.reporter_id', user.id);
  }

  return {
    where: filters.length ? `WHERE ${filters.join(' AND ')}` : '',
    params
  };
}
