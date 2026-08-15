import { createServer } from 'node:http';
import { handleLocalApi } from './http.js';

const port = Number(process.env.SERAPHIM_API_PORT || 8787);

const server = createServer(async (req, res) => {
  const handled = await handleLocalApi(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Seraphim local API on http://127.0.0.1:${port}/local-api/health\n`);
});
