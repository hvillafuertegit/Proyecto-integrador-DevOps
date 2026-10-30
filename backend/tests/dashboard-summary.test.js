import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDashboardTotals } from '../src/utils/dashboard-summary.js';

test('suma todos los estados y calcula los incidentes abiertos', () => {
  const statuses = [
    { status: 'NUEVO', count: 2 },
    { status: 'ASIGNADO', count: 3 },
    { status: 'EN_PROCESO', count: 4 },
    { status: 'RESUELTO', count: 5 },
    { status: 'CERRADO', count: 6 }
  ];

  assert.deepEqual(calculateDashboardTotals(statuses, 2), {
    total: 20,
    open: 9,
    closed: 6,
    critical: 2
  });
});

test('maneja correctamente un dashboard vacío', () => {
  assert.deepEqual(calculateDashboardTotals([], 0), {
    total: 0,
    open: 0,
    closed: 0,
    critical: 0
  });
});

test('convierte conteos numéricos de PostgreSQL cuando llegan como texto', () => {
  const statuses = [
    { status: 'NUEVO', count: '3' },
    { status: 'CERRADO', count: '2' }
  ];

  assert.deepEqual(calculateDashboardTotals(statuses, '1'), {
    total: 5,
    open: 3,
    closed: 2,
    critical: 1
  });
});

test('no considera RESUELTO como abierto ni como CERRADO', () => {
  const statuses = [{ status: 'RESUELTO', count: 4 }];
  assert.deepEqual(calculateDashboardTotals(statuses, 0), {
    total: 4,
    open: 0,
    closed: 0,
    critical: 0
  });
});
