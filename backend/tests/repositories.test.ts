import { beforeEach, expect, it, vi } from 'vitest';
import { createDatabase } from '../src/db/connection';
import { withTransaction } from '../src/db/transaction.repository';
import { ServiceRepository } from '../src/modules/services/services.repository';
import { CollectionRepository } from '../src/modules/collections/collections.repository';
import { UserRepository } from '../src/modules/usuarios/usuarios.repository';
import { DatabaseError } from '../src/shared/errors';

const fake = vi.hoisted(() => ({ query: vi.fn(), release: vi.fn(), connect: vi.fn(), poolQuery: vi.fn() }));
vi.mock('pg', () => ({ Pool: class {
  on = vi.fn(); end = vi.fn(); query = fake.poolQuery; connect = fake.connect;
} }));
beforeEach(() => {
  vi.resetAllMocks();
  fake.query.mockResolvedValue({ rows: [], rowCount: 0 });
  fake.connect.mockResolvedValue({ query: fake.query, release: fake.release });
});
it('usa uma conexão, parâmetros separados e libera após commit', async () => {
  const db = createDatabase('postgresql://localhost/test');
  const id = '9007199254740993';
  const email = "x' OR '1'='1";
  await withTransaction(db, async tx => {
    expect(await new ServiceRepository(tx).findById(id)).toBeNull();
    expect(await new UserRepository(tx).findByEmail(email)).toBeNull();
  });
  expect(fake.query.mock.calls.map(call => call[0])).toEqual([
    'BEGIN', 'SELECT * FROM services WHERE id = $1',
    'SELECT * FROM users WHERE lower(email) = lower($1)', 'COMMIT',
  ]);
  expect(fake.query.mock.calls[1][1]).toEqual([id]);
  expect(fake.query.mock.calls[2][1]).toEqual([email]);
  expect(fake.poolQuery).not.toHaveBeenCalled();
  expect(fake.connect).toHaveBeenCalledOnce();
  expect(fake.release).toHaveBeenCalledExactlyOnceWith(undefined);
});
it('busca cada serviço com sua última coleta por LEFT JOIN LATERAL', async () => {
  fake.poolQuery.mockResolvedValueOnce({ rows: [] });
  await new ServiceRepository(createDatabase('postgresql://localhost/test')).findAllWithLastReading();
  expect(fake.poolQuery).toHaveBeenCalledOnce();
  expect(fake.poolQuery.mock.calls[0][0]).toContain('LEFT JOIN LATERAL');
  expect(fake.poolQuery.mock.calls[0][0]).toContain('ORDER BY collected_at DESC, id DESC');
  expect(fake.poolQuery.mock.calls[0][1]).toEqual([]);
});
it('traz os campos de cálculo na listagem de coletas', async () => {
  fake.poolQuery.mockResolvedValueOnce({ rows: [] });
  await new CollectionRepository(createDatabase('postgresql://localhost/test'))
    .findAll({ serviceId: null, from: null, to: null, limit: 50 });
  const sql = fake.poolQuery.mock.calls[0][0] as string;
  for (const column of ['calculation_status', 'carbon_intensity_gco2e_per_kwh', 'energy_kwh', 'co2e_grams']) {
    expect(sql).toContain(column);
  }
  expect(fake.poolQuery.mock.calls[0][1]).toEqual([null, null, null, 50]);
});
it.each(['BEGIN', 'consulta', 'COMMIT', 'ROLLBACK'])('libera conexão após falha em %s', async stage => {
  const original = new Error('falha controlada');
  fake.query.mockImplementation(async (sql: string) => {
    if (sql === stage) throw original;
    return { rows: [], rowCount: 0 };
  });
  const pending = withTransaction(createDatabase('postgresql://localhost/test'), async () => {
    if (stage === 'consulta' || stage === 'ROLLBACK') throw original;
  });
  await expect(pending).rejects.toBeInstanceOf(stage === 'consulta' ? Error : DatabaseError);
  expect(fake.release).toHaveBeenCalledOnce();
  expect(fake.release.mock.calls[0][0]).toBeInstanceOf(Error);
  const commands = fake.query.mock.calls.map(call => call[0]);
  expect(commands.includes('ROLLBACK')).toBe(stage !== 'BEGIN');
  if (stage === 'ROLLBACK') {
    await expect(pending).rejects.toMatchObject({ cause: { errors: [original, expect.any(DatabaseError)] } });
  }
});
it('falha de aquisição é tipada e não tenta liberar conexão inexistente', async () => {
  fake.connect.mockRejectedValue(new Error('pool indisponível'));
  await expect(withTransaction(createDatabase('postgresql://localhost/test'), async () => undefined))
    .rejects.toBeInstanceOf(DatabaseError);
  expect(fake.release).not.toHaveBeenCalled();
});
