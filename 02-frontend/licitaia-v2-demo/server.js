/**
 * FASE 39 — DECYON / LICITAIA V2
 * Servidor estático mínimo para o frontend de demonstração.
 *
 * Usa apenas módulos built-in do Node.js (zero dependências externas).
 * Serve os arquivos estáticos na porta 3000 — compatível com o CORS do backend (porta 3001).
 *
 * Uso: node server.js
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const urlPath = req.url === '/' ? '/index.html' : (req.url || '/index.html').split('?')[0];
    const filePath = path.join(__dirname, urlPath);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain; charset=utf-8';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('  DECYON — Demonstração Funcional — Fase 39');
    console.log(`  Frontend: http://localhost:${PORT}`);
    console.log('  Backend esperado em: http://localhost:3001');
    console.log('════════════════════════════════════════════════════════');
    console.log('');
  });
