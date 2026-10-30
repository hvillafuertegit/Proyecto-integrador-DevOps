import test from 'node:test';
import assert from 'node:assert/strict';
import { withTransaction } from '../src/utils/transaction.js';

function fakeDatabase({ fail = false } = {}) {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      if (fail && sql === 'WRITE') throw new Error('Error de escritura');
      return { rows: [{ id: 1 }] };
    },
    release() { calls.push('RELEASE'); }
  };
  return { calls, connect: async () => client };
}

test('confirma una transacción cuando la escritura funciona', async () => {
  const db = fakeDatabase();
  const result = await withTransaction(client => client.query('WRITE'), db);
  assert.equal(result.rows[0].id, 1);
  assert.deepEqual(db.calls, ['BEGIN', 'WRITE', 'COMMIT', 'RELEASE']);
});

test('revierte la transacción cuando una escritura falla', async () => {
  const db = fakeDatabase({ fail: true });
  await assert.rejects(() => withTransaction(client => client.query('WRITE'), db));
  assert.deepEqual(db.calls, ['BEGIN', 'WRITE', 'ROLLBACK', 'RELEASE']);
});
