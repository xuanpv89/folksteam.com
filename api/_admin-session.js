import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'folks_admin_session';

function base64UrlToBuffer(value) {
  return Buffer.from(String(value || ''), 'base64url');
}

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function getCookie(request, name) {
  const cookie = request.headers.cookie || '';
  const match = cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

export function getAdminSession(request, secret) {
  const token = getCookie(request, ADMIN_SESSION_COOKIE);
  const [payload, signature] = String(token || '').split('.');

  if (!payload || !signature || !secret || !safeEqual(signature, sign(payload, secret))) {
    return null;
  }

  try {
    const data = JSON.parse(base64UrlToBuffer(payload).toString('utf8'));
    if (Number(data.exp || 0) <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
