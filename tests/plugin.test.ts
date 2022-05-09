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

  it('returns 404 when correct token and unknown hash', async () => {
    const server = fastify();
    await server.register(tirbiPlugin, {
      tokens: ['test'],
      storage: { kind: 'memory' },
    });

    const res = await server.inject({
      url: '/v8/artifacts/some-hash',
      headers: { Authorization: `Bearer test` },
      method: 'GET',
    });
    expect(res.statusCode).toEqual(404);
  });

  it('supports multiple tokens', async () => {
    const server = fastify();
    await server.register(tirbiPlugin, {
      tokens: ['test1', 'test2'],
      storage: { kind: 'memory' },
    });

    const res1 = await server.inject({
      url: '/v8/artifacts/some-hash',
      headers: { Authorization: `Bearer test0` },
      method: 'GET',
    });
    expect(res1.statusCode).toEqual(401);

    const res2 = await server.inject({
      url: '/v8/artifacts/some-hash',
      headers: { Authorization: `Bearer test1` },
      method: 'GET',
    });
    expect(res2.statusCode).toEqual(404);

    const res3 = await server.inject({
      url: '/v8/artifacts/some-hash',
      headers: { Authorization: `Bearer test2` },
      method: 'GET',
    });
    expect(res3.statusCode).toEqual(404);
  });
});
