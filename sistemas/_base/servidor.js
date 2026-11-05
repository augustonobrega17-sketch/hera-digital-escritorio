/* ===========================================================
   Base dos sistemas da Hera Digital.

   Cada funcionário tem a própria pasta em sistemas/<area>/ com um
   server.js de três linhas que chama esta função. Ela:
   - serve a página do sistema (casca comum + app.js da pasta);
   - serve a base visual em /_base/ (hera.css e hera.js);
   - guarda os dados em sistemas/_dados/<colecao>.json, uma pasta só
     para todos, e é assim que os sistemas conversam entre si: o de Dados
     lê as campanhas do Tráfego, o Atendimento lê tudo para o relatório.

   Sem dependência nenhuma: só Node.
   =========================================================== */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const BASE  = __dirname;
const DADOS = path.join(BASE, '..', '_dados');
const SEMENTES = require('./sementes');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png'
};

const nomeValido = n => /^[a-z0-9-]{1,40}$/.test(n);
const arquivoDe  = n => path.join(DADOS, n + '.json');

/** lê uma coleção; na primeira vez nasce dos dados de exemplo */
function ler(nome) {
  const arq = arquivoDe(nome);
  try { return JSON.parse(fs.readFileSync(arq, 'utf8')); }
  catch (e) {
    const semente = SEMENTES[nome] ? JSON.parse(JSON.stringify(SEMENTES[nome])) : [];
    if (SEMENTES[nome]) gravar(nome, semente);
    return semente;
  }
}

/** grava inteiro, por arquivo temporário: um sistema caindo no meio não corrompe nada */
function gravar(nome, dados) {
  fs.mkdirSync(DADOS, { recursive: true });
  const arq = arquivoDe(nome), tmp = arq + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2));
  fs.renameSync(tmp, arq);
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function casca(cfg) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${cfg.nome} · Hera Digital</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/_base/hera.css">
</head><body>
<div id="app"></div>
<script>window.SISTEMA = ${JSON.stringify({ id: cfg.id, nome: cfg.nome })};</script>
<script src="/_base/hera.js"></script>
<script src="/app.js"></script>
</body></html>`;
}

module.exports = function iniciar(cfg) {
  const PORT = Number(process.env.PORT) || cfg.porta;
  const inicio = Date.now();

  const servidor = http.createServer((req, res) => {
    // só esta máquina: barra DNS rebinding e outro site mandando PUT para cá
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(req.headers.host || '')) {
      res.writeHead(403).end('host não permitido'); return;
    }
    if (req.method !== 'GET' && req.headers.origin &&
        !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/i.test(req.headers.origin)) {
      return json(res, 403, { ok: false, motivo: 'origem não permitida' });
    }

    const url = new URL(req.url, 'http://localhost');
    const rota = decodeURIComponent(url.pathname);

    if (rota === '/api/status')
      return json(res, 200, { ok: true, sistema: cfg.id, nome: cfg.nome, noArDesde: new Date(inicio).toISOString() });

    // rotas próprias do sistema (ex.: Meta Ads ao vivo no Tráfego)
    if (cfg.api && cfg.api(req, res, rota, json)) return;

    const m = rota.match(/^\/api\/col\/([^/]+)$/);
    if (m) {
      const nome = m[1];
      if (!nomeValido(nome)) return json(res, 400, { ok: false, motivo: 'nome de coleção inválido' });
      if (req.method === 'GET') return json(res, 200, ler(nome));
      if (req.method === 'PUT') {
        let corpo = '';
        req.on('data', c => { corpo += c; if (corpo.length > 4e6) req.destroy(); });
        req.on('end', () => {
          let dados;
          try { dados = JSON.parse(corpo); } catch (e) { return json(res, 400, { ok: false, motivo: 'JSON inválido' }); }
          if (!Array.isArray(dados)) return json(res, 400, { ok: false, motivo: 'a coleção precisa ser uma lista' });
          try { gravar(nome, dados); json(res, 200, { ok: true, total: dados.length }); }
          catch (e) { json(res, 500, { ok: false, motivo: e.message }); }
        });
        return;
      }
      if (req.method === 'DELETE') {           // volta para os dados de exemplo
        try { fs.unlinkSync(arquivoDe(nome)); } catch (e) { /* já não existia */ }
        return json(res, 200, ler(nome));
      }
      return json(res, 405, { ok: false, motivo: 'método não aceito' });
    }

    // arquivos
    let arquivo;
    if (rota === '/' || rota === '/index.html') {
      res.writeHead(200, { 'Content-Type': TIPOS['.html'], 'Cache-Control': 'no-store' });
      return res.end(casca(cfg));
    }
    if (rota.startsWith('/_base/')) arquivo = path.join(BASE, path.basename(rota));
    else if (rota === '/app.js') arquivo = path.join(cfg.pasta, 'app.js');
    else { res.writeHead(404).end('404'); return; }

    fs.readFile(arquivo, (err, buf) => {
      if (err) { res.writeHead(404).end('404'); return; }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
                           'Cache-Control': 'no-store' });
      res.end(buf);
    });
  });

  servidor.listen(PORT, '127.0.0.1', () =>
    console.log(`${cfg.nome} -> http://localhost:${PORT}`));
};
