/**
 * Fake contact-form provider for local development (MASTER-PLAN 2.10, PRD D-9).
 *
 * Stands in for Web3Forms / Formspree: accepts the JSON POST that `src/lib/submitInquiry.ts`
 * sends, prints the payload to the terminal and answers 200 with a Web3Forms-shaped body.
 * Nothing leaves the machine, no account or network needed.
 *
 *   npm run form:fake              → provider only, on http://localhost:8787/submit
 *   npm run dev:form               → provider + Vite dev server wired to it (VITE_FORM_ENDPOINT set)
 *   npm run form:fake -- --status=500   → every submission is rejected (exercises the error path)
 *
 * Env: FAKE_FORM_PORT (default 8787).
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.FAKE_FORM_PORT ?? 8787);
const PATHNAME = '/submit';
const args = process.argv.slice(2);
const withDev = args.includes('--dev');
const statusArg = args.find((a) => a.startsWith('--status='));
const RESPONSE_STATUS = statusArg ? Number(statusArg.slice('--status='.length)) : 200;
const ACCESS_KEY = 'local-fake-key';

if (!Number.isInteger(RESPONSE_STATUS) || RESPONSE_STATUS < 100 || RESPONSE_STATUS > 599) {
  console.error(`Invalid --status value: ${statusArg}`);
  process.exit(1);
}

const cors = (res: ServerResponse) => {
  // The dev server runs on another origin (5173) → the browser sends a CORS preflight for a JSON POST.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
};

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

let count = 0;

const server = createServer(async (req, res) => {
  cors(res);
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }
  if (req.method !== 'POST' || url.pathname !== PATHNAME) {
    res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: false, message: 'Not found' }));
    return;
  }

  const raw = await readBody(req);
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
    return;
  }

  count += 1;
  const stamp = new Date().toISOString();
  console.log(`\n── submission #${count} · ${stamp} · ${req.headers['content-type'] ?? 'no content-type'}`);
  console.log(JSON.stringify(payload, null, 2));
  if (typeof payload === 'object' && payload !== null) {
    const key = (payload as Record<string, unknown>).access_key;
    console.log(key === undefined ? '   (no access_key → Formspree-style request)' : `   access_key: ${String(key)}`);
  }
  console.log(`── answering ${RESPONSE_STATUS}`);

  const ok = RESPONSE_STATUS >= 200 && RESPONSE_STATUS < 300;
  res
    .writeHead(RESPONSE_STATUS, { 'Content-Type': 'application/json' })
    .end(JSON.stringify({ success: ok, message: ok ? 'Email sent successfully! (fake)' : 'Rejected by fake provider' }));
});

server.listen(PORT, () => {
  const endpoint = `http://localhost:${PORT}${PATHNAME}`;
  console.log(`Fake form provider listening on ${endpoint} (answering ${RESPONSE_STATUS})`);
  if (!withDev) {
    console.log(`Point the app at it:  VITE_FORM_ENDPOINT=${endpoint} npm run dev`);
    return;
  }
  const dev = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, VITE_FORM_ENDPOINT: endpoint, VITE_FORM_ACCESS_KEY: ACCESS_KEY },
  });
  const stop = () => {
    dev.kill('SIGINT');
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  dev.on('exit', (code) => server.close(() => process.exit(code ?? 0)));
});
