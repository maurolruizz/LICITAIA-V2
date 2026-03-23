/**
 * Prova Fase 46 — encerramento ordenado (mesmo fluxo que SIGINT/SIGTERM).
 *
 * No Windows, kill(1)/subprocess.kill costuma não entregar SIGTERM/SIGINT ao runtime Node;
 * aqui usamos F46_SHUTDOWN_STDIN + token __F46_SHUTDOWN__, que chama o mesmo gracefulShutdown().
 * Em Linux/macOS, use também scripts/prove-fase46-posix-kill.sh para kill -TERM real.
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.join(__dirname, '..');
const PORT = String(3100 + Math.floor(Math.random() * 900));
const auditFile = path.join(root, 'f46-shutdown-audit.log');

try {
  fs.unlinkSync(auditFile);
} catch {
  /* ignore */
}

function httpReq(method, urlPath, bodyStr) {
  return new Promise((resolve, reject) => {
    const opt = {
      hostname: '127.0.0.1',
      port: PORT,
      path: urlPath,
      method,
      headers: {},
    };
    if (bodyStr !== undefined) {
      const buf = Buffer.from(bodyStr, 'utf8');
      opt.headers['Content-Type'] = 'application/json';
      opt.headers['Content-Length'] = String(buf.length);
    }
    const r = http.request(opt, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    r.on('error', reject);
    if (bodyStr !== undefined) r.write(bodyStr);
    r.end();
  });
}

const env = {
  ...process.env,
  NODE_ENV: 'development',
  PORT,
  SHUTDOWN_AUDIT_FILE: auditFile,
  F46_SHUTDOWN_STDIN: '1',
};

const child = spawn('node', ['dist/server.js'], {
  cwd: root,
  env,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let out = '';
child.stdout.on('data', (d) => {
  const s = d.toString();
  out += s;
  process.stdout.write(s);
});
child.stderr.on('data', (d) => {
  const s = d.toString();
  out += s;
  process.stderr.write(s);
});

function waitBoot() {
  return new Promise((resolve, reject) => {
    const iv = setInterval(() => {
      if (out.includes('iniciado')) {
        clearInterval(iv);
        resolve();
      }
    }, 40);
    setTimeout(() => {
      clearInterval(iv);
      reject(new Error('timeout boot'));
    }, 15_000);
  });
}

async function main() {
  process.stderr.write(`=== PROOF: PORT=${PORT} pid=${child.pid} ===\n`);
  await waitBoot();

  process.stderr.write('\n=== PROOF: GET /health ===\n');
  const h = await httpReq('GET', '/health');
  process.stdout.write(`status=${h.status} ${h.body.slice(0, 220)}\n`);

  process.stderr.write('\n=== PROOF: POST /api/process/run ===\n');
  const pr = await httpReq('POST', '/api/process/run', JSON.stringify({ payload: {} }));
  process.stdout.write(`status=${pr.status} ${pr.body.slice(0, 260)}\n`);

  process.stderr.write('\n=== PROOF: GET /api/process-executions ===\n');
  const list = await httpReq('GET', '/api/process-executions');
  const j = JSON.parse(list.body);
  const id = j.data[0].id;
  process.stdout.write(`total=${j.total} firstId=${id}\n`);

  process.stderr.write('\n=== PROOF: GET /api/process-executions/:id ===\n');
  process.stdout.write((await httpReq('GET', `/api/process-executions/${encodeURIComponent(id)}`)).body.slice(0, 200) + '...\n');

  process.stderr.write(
    '\n=== PROOF: stdin __F46_SHUTDOWN__ x2 no mesmo chunk (idempotência no 2º) ===\n',
  );
  child.stdin.write('__F46_SHUTDOWN__\n__F46_SHUTDOWN__\n');

  await new Promise((resolve) => {
    child.on('exit', (code, signal) => {
      process.stderr.write(`\n=== PROOF: filho exit code=${code} signal=${signal} ===\n`);
      resolve();
    });
  });

  process.stderr.write('\n=== PROOF: f46-shutdown-audit.log ===\n');
  if (fs.existsSync(auditFile)) {
    process.stdout.write(fs.readFileSync(auditFile, 'utf8'));
  } else {
    process.stderr.write('(ausente)\n');
  }

  const cnt = execSync(
    `powershell.exe -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count"`,
    { encoding: 'utf8' },
  ).trim();
  process.stderr.write(`\n=== PROOF: listeners na porta ${PORT} (esperado 0) = ${cnt} ===\n`);
}

main().catch((e) => {
  process.stderr.write(`PROOF_FAIL: ${e.message}\n`);
  try {
    child.kill('SIGKILL');
  } catch {
    /* ignore */
  }
  process.exit(1);
});
