import { loadLocalEnv, llmKeyPresent } from './env.js';
import { create, filter, hasAnyRows, list, loadStore, remove, update } from './store.js';
import { seedIfNeeded } from './seed.js';
import { getUpload as getFile, invokeFunction, saveUpload } from './functions.js';
import { getOperator } from './operator.js';

loadLocalEnv();
loadStore();
seedIfNeeded(hasAnyRows);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      const raw = Buffer.concat(chunks);
      const type = String(req.headers['content-type'] || '');
      if (type.includes('application/json')) {
        try {
          resolve(JSON.parse(raw.toString('utf8') || '{}'));
        } catch (err) {
          reject(err);
        }
        return;
      }
      resolve({ _raw: raw, _filename: 'upload.bin' });
    });
    req.on('error', reject);
  });
}

function send(res, status, payload, extraHeaders = {}) {
  const body = typeof payload === 'string' || Buffer.isBuffer(payload) ? payload : JSON.stringify(payload);
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    ...extraHeaders,
  };
  if (!headers['Content-Type']) {
    headers['Content-Type'] = Buffer.isBuffer(body) ? 'application/octet-stream' : 'application/json; charset=utf-8';
  }
  res.writeHead(status, headers);
  res.end(body);
}

export async function handleLocalApi(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'OPTIONS') {
    send(res, 204, '');
    return true;
  }

  if (url.pathname === '/local-api/health') {
    send(res, 200, { ok: true, llm: llmKeyPresent() });
    return true;
  }

  if (url.pathname === '/local-api/auth/me') {
    send(res, 200, getOperator());
    return true;
  }

  const fileMatch = url.pathname.match(/^\/local-api\/files\/([^/]+)$/);
  if (fileMatch) {
    const file = getFile(fileMatch[1]);
    if (!file) {
      send(res, 404, { error: 'File not found' });
      return true;
    }
    send(res, 200, file.buffer, { 'Content-Type': 'application/octet-stream' });
    return true;
  }

  if (url.pathname === '/local-api/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const raw = body._raw || Buffer.from(JSON.stringify(body));
    const uploaded = saveUpload(raw, body._filename || 'upload.bin');
    send(res, 200, { file_url: uploaded.url, ...uploaded });
    return true;
  }

  const entityMatch = url.pathname.match(/^\/local-api\/entities\/([^/]+)\/(list|filter|create|update|delete)$/);
  if (entityMatch && req.method === 'POST') {
    const [, name, action] = entityMatch;
    const body = await readBody(req);
    if (action === 'list') send(res, 200, list(name));
    else if (action === 'filter') send(res, 200, filter(name, body || {}));
    else if (action === 'create') send(res, 200, create(name, body || {}));
    else if (action === 'update') {
      const row = update(name, body.id, body.data || {});
      send(res, row ? 200 : 404, row || { error: 'Not found' });
    } else if (action === 'delete') send(res, 200, { success: remove(name, body.id) });
    return true;
  }

  const fnMatch = url.pathname.match(/^\/local-api\/functions\/([^/]+)$/);
  if (fnMatch && req.method === 'POST') {
    const body = await readBody(req);
    const result = await invokeFunction(fnMatch[1], body);
    const status = result?.status && result.error ? result.status : 200;
    send(res, status, result);
    return true;
  }

  return false;
}

export function createLocalApiMiddleware() {
  return async (req, res, next) => {
    try {
      if (!req.url?.startsWith('/local-api')) {
        next?.();
        return;
      }
      const handled = await handleLocalApi(req, res);
      if (!handled) next?.();
    } catch (err) {
      if (!res.headersSent) {
        send(res, 500, { error: err.message || 'Local API error' });
      }
    }
  };
}
