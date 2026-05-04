const GITHUB_API = 'https://api.github.com';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Map([
  ['image/avif', 'avif'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

function sendJson(response, status, body) {
  response.status(status).setHeader('content-type', 'application/json; charset=utf-8');
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

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isSafeRepo(value) {
  return /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(String(value || ''));
}

function isSafeBranch(value) {
  return /^[a-zA-Z0-9._/-]+$/.test(String(value || ''));
}

async function githubRequest(path, token, options = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || `GitHub API error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

function bufferFromDataUrl(value) {
  const match = String(value || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

async function getRemoteImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch image URL. HTTP ${response.status}`);
  }

  const mimeType = String(response.headers.get('content-type') || '').split(';')[0].trim();
  const arrayBuffer = await response.arrayBuffer();
  return {
    mimeType,
    buffer: Buffer.from(arrayBuffer),
  };
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
  const githubToken = process.env.GITHUB_TOKEN;

  if (!adminSecret || !githubToken) {
    return sendJson(response, 500, {
      ok: false,
      message: 'Server is missing ADMIN_SECRET or GITHUB_TOKEN.',
    });
  }

  if (body.adminSecret !== adminSecret) {
    return sendJson(response, 401, {
      ok: false,
      message: 'Admin secret is incorrect.',
    });
  }

  const repo = String(body.repo || process.env.GITHUB_REPO || 'xuanpv89/folksteam.com').trim();
  const branch = String(body.branch || process.env.GITHUB_BRANCH || 'main').trim();
  if (!isSafeRepo(repo) || !isSafeBranch(branch)) {
    return sendJson(response, 400, {
      ok: false,
      message: 'Invalid repository or branch.',
    });
  }

  let image;
  try {
    image = body.imageUrl ? await getRemoteImage(String(body.imageUrl)) : bufferFromDataUrl(body.dataUrl);
  } catch (error) {
    return sendJson(response, 400, {
      ok: false,
      message: error.message,
    });
  }

  if (!image) {
    return sendJson(response, 400, {
      ok: false,
      message: 'Missing image file or image URL.',
    });
  }

  const extension = ALLOWED_MIME_TYPES.get(image.mimeType);
  if (!extension) {
    return sendJson(response, 400, {
      ok: false,
      message: 'Only AVIF, JPG, PNG, WEBP, or GIF images are supported.',
    });
  }

  if (image.buffer.byteLength > MAX_UPLOAD_BYTES) {
    return sendJson(response, 400, {
      ok: false,
      message: 'Image is too large. Maximum size is 5 MB.',
    });
  }

  const baseName = slugify(body.name || body.fileName || `blog-image-${Date.now()}`) || `blog-image-${Date.now()}`;
  const fileName = `${baseName}-${Date.now()}.${extension}`;
  const target = `src/images/blog/uploads/${fileName}`;
  const apiPath = encodeURIComponent(target).replace(/%2F/g, '/');

  try {
    const commit = await githubRequest(`/repos/${repo}/contents/${apiPath}`, githubToken, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Upload blog media: ${fileName}`,
        content: image.buffer.toString('base64'),
        branch,
      }),
    });

    return sendJson(response, 200, {
      ok: true,
      target,
      imagePath: `@/images/blog/uploads/${fileName}`,
      commitUrl: commit?.commit?.html_url || null,
      fileUrl: commit?.content?.html_url || null,
    });
  } catch (error) {
    return sendJson(response, error.status || 502, {
      ok: false,
      message: error.message,
    });
  }
}
