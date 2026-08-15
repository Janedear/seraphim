const BASE = '/local-api';

async function request(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function entityApi(name) {
  return {
    list: () => request(`/entities/${name}/list`, {}),
    filter: (query = {}) => request(`/entities/${name}/filter`, query),
    create: (data = {}) => request(`/entities/${name}/create`, data),
    update: (id, data = {}) => request(`/entities/${name}/update`, { id, data }),
    delete: (id) => request(`/entities/${name}/delete`, { id }),
  };
}

export function createLocalApi() {
  return {
    auth: {
      me: async () => {
        const res = await fetch(`${BASE}/auth/me`);
        return res.json();
      },
      isAuthenticated: async () => true,
      logout: async () => ({ success: true }),
      redirectToLogin: () => {},
    },
    entities: new Proxy({}, {
      get: (_target, name) => entityApi(String(name)),
    }),
    functions: {
      invoke: async (name, body = {}) => {
        const data = await request(`/functions/${name}`, body);
        return { data };
      },
    },
    appLogs: {
      logUserInApp: async () => {},
    },
    integrations: {
      Core: {
        UploadFile: async ({ file }) => {
          const buf = await file.arrayBuffer();
          const res = await fetch(`${BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: buf,
          });
          return res.json();
        },
      },
    },
  };
}
