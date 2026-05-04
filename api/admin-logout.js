function sendJson(response, status, body, headers = {}) {
  response.status(status);
  Object.entries(headers).forEach(([key, value]) => response.setHeader(key, value));
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, {
      ok: false,
      message: 'Method not allowed.',
    });
  }

  return sendJson(
    response,
    200,
    {
      ok: true,
      message: 'Signed out.',
    },
    {
      'Set-Cookie': [
        'folks_admin_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
        'folks_admin_session=; Path=/admin; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
      ],
    }
  );
}
