import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIncidentFilters } from '../src/utils/incident-filters.js';

const admin = { id: 1, role: 'ADMIN' };

test('filtra por estado', () => {
  const result = buildIncidentFilters({ status: 'NUEVO' }, admin);
  assert.equal(result.where, 'WHERE i.status = $1');
  assert.deepEqual(result.params, ['NUEVO']);
});

test('filtra por prioridad', () => {
  const result = buildIncidentFilters({ priority: 'CRITICA' }, admin);
  assert.equal(result.where, 'WHERE i.priority = $1');
  assert.deepEqual(result.params, ['CRITICA']);
});

test('filtra por categoría', () => {
  const result = buildIncidentFilters({ category: '3' }, admin);
  assert.equal(result.where, 'WHERE i.category_id = $1');
  assert.deepEqual(result.params, [3]);
});

test('filtra por técnico', () => {
  const result = buildIncidentFilters({ technician: '7' }, admin);
  assert.equal(result.where, 'WHERE i.technician_id = $1');
  assert.deepEqual(result.params, [7]);
});

test('combina los cuatro filtros con parámetros ordenados', () => {
  const result = buildIncidentFilters({ status: 'ASIGNADO', priority: 'ALTA', category: '2', technician: '4' }, admin);
  assert.equal(result.where, 'WHERE i.status = $1 AND i.priority = $2 AND i.category_id = $3 AND i.technician_id = $4');
  assert.deepEqual(result.params, ['ASIGNADO', 'ALTA', 2, 4]);
});

test('busca texto sin interpolarlo directamente en SQL', () => {
  const result = buildIncidentFilters({ q: 'impresora' }, admin);
  assert.equal(result.where, 'WHERE (i.title ILIKE $1 OR i.description ILIKE $1)');
  assert.deepEqual(result.params, ['%impresora%']);
});

test('restringe los resultados al usuario que reportó', () => {
  const result = buildIncidentFilters({ status: 'NUEVO' }, { id: 9, role: 'USER' });
  assert.equal(result.where, 'WHERE i.status = $1 AND i.reporter_id = $2');
  assert.deepEqual(result.params, ['NUEVO', 9]);
});
