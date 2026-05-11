const request = require('supertest');
const { app, webHttp } = require('../src/server');

afterAll(() => webHttp.close());

// ── Auth ──────────────────────────────────────────────────────────

test('POST /api/login — admin нэвтэрнэ', async () => {
  const res = await request(app).post('/api/login').send({ username: 'admin', password: 'admin123' });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('token');
  expect(res.body.role).toBe('admin');
});

test('POST /api/login — буруу нууц үгтэй 401 буцаана', async () => {
  const res = await request(app).post('/api/login').send({ username: 'admin', password: 'wrong' });
  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty('error');
});

test('POST /api/login — байхгүй хэрэглэгч 401 буцаана', async () => {
  const res = await request(app).post('/api/login').send({ username: 'nobody', password: 'x' });
  expect(res.statusCode).toBe(401);
});

// ── Register ──────────────────────────────────────────────────────

test('POST /api/register — client бүртгэнэ', async () => {
  const res = await request(app).post('/api/register').send({ username: 'testuser1' });
  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);
  expect(res.body.role).toBe('client');
});

test('POST /api/register — давхардсан client нэр 400 буцаана', async () => {
  await request(app).post('/api/register').send({ username: 'dupuser' });
  const res = await request(app).post('/api/register').send({ username: 'dupuser' });
  expect(res.statusCode).toBe(400);
});

test('POST /api/register — нэргүй 400 буцаана', async () => {
  const res = await request(app).post('/api/register').send({});
  expect(res.statusCode).toBe(400);
});

test('POST /api/register — admin бүртгэнэ', async () => {
  const res = await request(app).post('/api/register').send({ username: 'newadmin', password: 'pass123', role: 'admin' });
  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);
  expect(res.body.role).toBe('admin');
});

// ── Protected routes ──────────────────────────────────────────────

test('GET /api/admins — токенгүй 401 буцаана', async () => {
  const res = await request(app).get('/api/admins');
  expect(res.statusCode).toBe(401);
});

test('GET /api/admins — хүчинтэй токентэй admins жагсаалт буцаана', async () => {
  const login = await request(app).post('/api/login').send({ username: 'admin', password: 'admin123' });
  const { token } = login.body;
  const res = await request(app).get('/api/admins').set('x-admin-token', token);
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body).toContain('admin');
});

test('POST /api/logout — токенаар гарна', async () => {
  const login = await request(app).post('/api/login').send({ username: 'admin', password: 'admin123' });
  const { token } = login.body;
  const res = await request(app).post('/api/logout').set('x-admin-token', token);
  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);
});

test('DELETE /api/admins/:username — admin устгана', async () => {
  const login = await request(app).post('/api/login').send({ username: 'admin', password: 'admin123' });
  const { token } = login.body;
  await request(app).post('/api/register').send({ username: 'deladmin', password: 'p', role: 'admin' });
  const res = await request(app).delete('/api/admins/deladmin').set('x-admin-token', token);
  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);
});
