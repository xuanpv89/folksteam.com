import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_SESSION_DAYS = 7;

function sendJson(response, status, body, headers = {}) {
  response.status(status);
  Object.entries(headers).forEach(([key, value]) => response.setHeader(key, value));
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function createSession(secret, username) {
  const maxAge = getSessionMaxAge();
  const payload = JSON.stringify({
    username,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  });
  const encoded = base64Url(payload);
  return `${encoded}.${sign(encoded, secret)}`;
}

function getSessionMaxAge() {
  const days = Number(process.env.ADMIN_SESSION_DAYS || DEFAULT_SESSION_DAYS);
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 30) : DEFAULT_SESSION_DAYS;
  return Math.round(safeDays * 24 * 60 * 60);
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getAdminUsers(adminSecret) {
  const configuredUsers = process.env.ADMIN_USERS;
  if (configuredUsers) {
    try {
      const users = JSON.parse(configuredUsers);
      if (Array.isArray(users)) {
        return users
          .map(user => ({
            username: String(user.username || '').trim(),
            password: String(user.password || ''),
          }))
          .filter(user => user.username && user.password);
      }
    } catch {
      return [];
    }
  }

  return [
    {
      username: process.env.ADMIN_USER || 'admin',
      password: process.env.ADMIN_PASSWORD || adminSecret,
    },
  ];
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, {
      ok: false,
      message: 'Method not allowed.',
    });
  }

  let body;
  try {
    body = await readJson(request);
  } catch {
    return sendJson(response, 400, {
      ok: false,
      message: 'Invalid JSON body.',
    });
  }

  const adminSecret = process.env.ADMIN_SECRET;
  const adminUsers = getAdminUsers(adminSecret);

  if (!adminSecret || !adminUsers.length) {
    return sendJson(response, 500, {
      ok: false,
      message: 'Admin authentication is not configured.',
    });
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const user = adminUsers.find(candidate => candidate.username === username);

  if (!user || !safeEqual(password, user.password)) {
    return sendJson(response, 401, {
      ok: false,
      message: 'Username or password is incorrect.',
    });
  }

  const session = createSession(adminSecret, username);
  const cookie = [
    `folks_admin_session=${session}`,
    'Path=/',
    `Max-Age=${getSessionMaxAge()}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ');

  return sendJson(
    response,
    200,
    {
      ok: true,
      message: 'Signed in.',
    },
    {
      'Set-Cookie': cookie,
    }
  );
}
