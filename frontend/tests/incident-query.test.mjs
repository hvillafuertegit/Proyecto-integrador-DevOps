import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIncidentQuery } from '../src/services/incident-query.js';

test('envía los cuatro filtros al backend', () => {
  const query = buildIncidentQuery({
    status: 'NUEVO',
    priority: 'ALTA',
    category: '2',
    technician: '3',
  });
  assert.deepEqual(Object.fromEntries(new URLSearchParams(query)), {
    status: 'NUEVO', priority: 'ALTA', category: '2', technician: '3',
  });
});

test('omite filtros vacíos', () => {
  assert.equal(buildIncidentQuery({ status: '', priority: '', q: '   ' }), '');
});

test('codifica correctamente la búsqueda', () => {
  assert.equal(new URLSearchParams(buildIncidentQuery({ q: '  sin red & wifi  ' })).get('q'), 'sin red & wifi');
});

test('permite filtrar por técnico asignado', () => {
  assert.equal(new URLSearchParams(buildIncidentQuery({ technician: 7 })).get('technician'), '7');
});
