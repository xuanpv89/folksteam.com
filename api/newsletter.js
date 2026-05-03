const RESEND_API_URL = 'https://api.resend.com/emails';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sendJson(response, status, body) {
  response.status(status).setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, {
      ok: false,
      message: 'Method not allowed.',
    });
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);

  const rawBody = Buffer.concat(chunks).toString('utf8');
  const params = new URLSearchParams(rawBody);
  const email = String(params.get('email') || '').trim();
  const source = String(params.get('source') || 'newsletter').trim();
  const locale = String(params.get('locale') || 'en').trim();

  if (!email || !email.includes('@')) {
    return sendJson(response, 400, {
      ok: false,
      message:
        locale === 'vi'
          ? 'Vui long nhap email hop le.'
          : locale === 'zh'
            ? 'Please enter a valid email address.'
            : 'Please enter a valid email address.',
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NEWSLETTER_TO_EMAIL || process.env.CONTACT_TO_EMAIL || 'contact@folksteam.com';
  const fromEmail =
    process.env.CONTACT_FROM_EMAIL ||
    'Folks Team Website <onboarding@resend.dev>';

  if (!apiKey) {
    return sendJson(response, 500, {
      ok: false,
      message:
        locale === 'vi'
          ? 'May chu chua cau hinh RESEND_API_KEY.'
          : 'Server is missing RESEND_API_KEY.',
    });
  }

  const html = `
    <h2>New Folks Team newsletter signup</h2>
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse">
      <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
      <tr><td><strong>Source</strong></td><td>${escapeHtml(source)}</td></tr>
      <tr><td><strong>Language</strong></td><td>${escapeHtml(locale)}</td></tr>
    </table>
  `;

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `New newsletter signup: ${email}`,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const detail = await resendResponse.text();
    return sendJson(response, 502, {
      ok: false,
      message:
        locale === 'vi'
          ? 'Khong gui duoc dang ky. Vui long kiem tra cau hinh Resend.'
          : 'Newsletter signup could not be sent. Please check the Resend setup.',
      detail,
    });
  }

  return sendJson(response, 200, {
    ok: true,
    message:
      locale === 'vi'
        ? 'Da dang ky. Cam on ban!'
        : locale === 'zh'
          ? 'Subscribed. Thank you!'
          : 'Subscribed. Thank you!',
  });
}
