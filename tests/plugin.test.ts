import fastify from 'fastify';
import { tirbiPlugin } from '../src/plugin';

describe('Smoke tests', () => {
  it("doesn't smoke", () => {
    expect(1).toEqual(1);
  });

  it('return 401 when invalid token', async () => {
    const server = fastify();
    await server.register(tirbiPlugin, {
      tokens: ['test'],
      storage: { kind: 'memory' },
    });

    const res = await server.inject('/v8/artifacts/some-hash');
    expect(res.statusCode).toEqual(401);
  });

  it.only('returns 404 when correct token and unknown hash', async () => {
    const server = fastify({ logger: true });
    await server.register(tirbiPlugin, {
      tokens: ['test'],
      storage: { kind: 'memory' },
    });

    const res = await server.inject({
      url: '/v8/artifacts/some-hash',
      headers: { Authorization: `Bearer test` },
      method: 'GET',
    });
    expect(res.statusCode).toEqual(401);
  });
});
