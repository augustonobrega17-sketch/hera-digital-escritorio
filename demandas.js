/* ===========================================================
   demandas.js — o quadro de demandas da Hera Digital (servidor)

   O Augusto escreve um pedido, escolhe o agente e o cliente. A demanda
   entra numa fila e é executada por UM agente de cada vez (o plano Claude
   tem limite de uso; dez agentes ao mesmo tempo esgotariam a cota). O
   agente roda o Claude Code dentro da pasta do sistema dele, lê a própria
   personalidade em sistemas/<area>/CLAUDE.md e as regras da casa em
   sistemas/CLAUDE.md, pode ler e gravar em sistemas/_dados e pesquisar na
   web. Não roda comando no terminal e não lê arquivo .env (a pasta do
   tráfego guarda a chave do Meta Ads).

   Ciclo: na fila → executando → para aprovar → aprovada
                                    └→ pedir ajuste → na fila (mesma conversa)
   Tudo fica em data/demandas.json.
   =========================================================== */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let dep = null;
let lista = [];
let rodando = null;          // { id, proc }
const LIMITE = 15 * 60 * 1000;
const PRIO = { alta: 0, normal: 1, baixa: 2 };

const ARQ = () => path.join(dep.ROOT, 'data', 'demandas.json');
const DADOS = () => path.join(dep.ROOT, 'sistemas', '_dados');

function gravar() {
  try {
    fs.mkdirSync(path.dirname(ARQ()), { recursive: true });
    const tmp = ARQ() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(lista, null, 2));
    fs.renameSync(tmp, ARQ());
  } catch (e) { console.error('  demandas: não consegui gravar', e.message); }
}

function carregar() {
  try { lista = JSON.parse(fs.readFileSync(ARQ(), 'utf8')); } catch (e) { lista = []; }
  // o escritório caiu no meio de uma execução: volta para a fila
  for (const d of lista) if (d.status === 'executando') { d.status = 'na fila'; d.retomada = true; }
  gravar();
}

const PAPEL =
  'Você está atendendo uma DEMANDA do quadro de demandas da Hera Digital. ' +
  'Siga a sua personalidade (CLAUDE.md desta pasta) e as regras da agência (../CLAUDE.md). ' +
  'Trabalhe sozinho até o fim: não há ninguém para responder perguntas no meio. ' +
  'Os dados ficam em ../_dados (pode ler e gravar). Termine com a entrega no formato pedido em ../CLAUDE.md.';

const id = () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const publico = d => d;   // tudo da demanda pode ir para a tela

function clientes() {
  try { return JSON.parse(fs.readFileSync(path.join(DADOS(), 'clientes.json'), 'utf8')).map(c => c.nome).sort((a, b) => a.localeCompare(b)); }
  catch (e) { return []; }
}

/* ---------------- criar e mexer ---------------- */
function criar(b) {
  const reg = dep.lerRegistro();
  const s = reg[b.agente];
  if (!s || !s.pasta) return { ok: false, motivo: 'esse agente não tem sistema local para trabalhar' };
  const pedido = String(b.pedido || '').trim();
  if (pedido.length < 5) return { ok: false, motivo: 'escreva o pedido' };
  const d = {
    id: id(), criada: Date.now(), status: 'na fila',
    agente: b.agente, agenteNome: String(b.agenteNome || s.nome || b.agente).slice(0, 60),
    cliente: String(b.cliente || '').slice(0, 80),
    titulo: (String(b.titulo || '').trim() || pedido.split('\n')[0]).slice(0, 120),
    pedido: pedido.slice(0, 8000),
    prioridade: PRIO[b.prioridade] !== undefined ? b.prioridade : 'normal',
    historico: [{ quem: 'augusto', texto: pedido, quando: Date.now() }],
    sessionId: null, custo: 0, rodadas: 0
  };
  lista.unshift(d);
  gravar();
  setImmediate(proxima);
  return { ok: true, demanda: d };
}

function acao(idDem, qual, comentario) {
  const d = lista.find(x => x.id === idDem);
  if (!d) return { ok: false, motivo: 'demanda não encontrada' };
  const txt = String(comentario || '').trim();
  if (qual === 'aprovar') {
    if (d.status !== 'para aprovar') return { ok: false, motivo: 'só dá para aprovar o que está para aprovar' };
    d.status = 'aprovada'; d.aprovadaEm = Date.now();
    if (txt) d.historico.push({ quem: 'augusto', texto: txt, quando: Date.now() });
    aprovarItens(d.id);
  } else if (qual === 'refazer') {
    if (!['para aprovar', 'erro', 'aprovada'].includes(d.status)) return { ok: false, motivo: 'essa demanda ainda não foi entregue' };
    if (!txt) return { ok: false, motivo: 'diga o que precisa ajustar' };
    d.historico.push({ quem: 'augusto', texto: txt, quando: Date.now(), ajuste: true });
    d.status = 'na fila'; d.ajustePendente = txt; d.erro = null;
  } else if (qual === 'tentar') {
    if (d.status !== 'erro') return { ok: false, motivo: 'só dá para tentar de novo o que deu erro' };
    d.status = 'na fila'; d.erro = null;
  } else if (qual === 'cancelar') {
    if (d.status === 'executando' && rodando && rodando.id === d.id) { try { rodando.proc.kill(); } catch (e) {} }
    d.status = 'cancelada'; d.cancelando = true;
  } else if (qual === 'apagar') {
    if (d.status === 'executando') return { ok: false, motivo: 'cancele antes de apagar' };
    lista = lista.filter(x => x !== d);
  } else return { ok: false, motivo: 'ação desconhecida' };
  gravar();
  setImmediate(proxima);
  return { ok: true };
}

/** o que o agente gravou com status "para aprovar" passa a "aprovada" junto com a demanda */
function aprovarItens(idDem) {
  let arqs = [];
  try { arqs = fs.readdirSync(DADOS()).filter(f => f.endsWith('.json')); } catch (e) { return; }
  for (const f of arqs) {
    const arq = path.join(DADOS(), f);
    try {
      const col = JSON.parse(fs.readFileSync(arq, 'utf8'));
      if (!Array.isArray(col)) continue;
      let mudou = false;
      for (const it of col) if (it && it.demanda === idDem && it.status === 'para aprovar') { it.status = 'aprovada'; mudou = true; }
      if (mudou) fs.writeFileSync(arq, JSON.stringify(col, null, 2));
    } catch (e) { /* arquivo de outro formato: ignora */ }
  }
}

/* ---------------- execução ---------------- */
function proxima() {
  if (rodando) return;
  const fila = lista.filter(d => d.status === 'na fila')
    .sort((a, b) => (PRIO[a.prioridade] - PRIO[b.prioridade]) || (a.criada - b.criada));
  if (fila.length) executar(fila[0]);
}

function executar(d) {
  const s = dep.lerRegistro()[d.agente];
  if (!s || !s.pasta || !fs.existsSync(s.pasta)) {
    d.status = 'erro'; d.erro = 'a pasta do sistema deste agente não existe mais'; gravar(); return;
  }
  const cfg = (dep.config().demandas) || {};
  const args = ['-p', '--output-format', 'json',
    '--permission-mode', 'acceptEdits',
    '--model', cfg.modelo || 'sonnet',
    '--add-dir', DADOS(),
    '--allowedTools', 'Read', 'Edit', 'Write', 'Glob', 'Grep', 'WebSearch', 'WebFetch',
    '--disallowedTools', 'Bash', 'Read(**/.env*)', 'Edit(**/.env*)',
    '--append-system-prompt', PAPEL + (dep.quemSou ? dep.quemSou(d.agente) : '')];
  let prompt;
  if (d.sessionId && d.ajustePendente) {
    args.push('--resume', d.sessionId);
    prompt = `O Augusto pediu ajustes na demanda ${d.id}:\n\n${d.ajustePendente}\n\n` +
             'Refaça considerando isso, atualize o que você gravou nos dados (mesmo id de demanda) e entregue de novo no mesmo formato.';
  } else {
    prompt = [
      `NOVA DEMANDA · id ${d.id}`,
      `De: Augusto (dono da Hera Digital)`,
      `Cliente: ${d.cliente || '(nenhum: trabalho interno da Hera)'}`,
      `Prioridade: ${d.prioridade}`,
      `Título: ${d.titulo}`,
      '', 'Pedido:', d.pedido, '',
      `Use "${d.id}" no campo "demanda" de todo item que você gravar em ../_dados.`
    ].join('\n');
  }

  d.status = 'executando'; d.inicio = Date.now(); d.erro = null; d.rodadas = (d.rodadas || 0) + 1;
  delete d.cancelando;
  gravar();

  let saida = '', erroSaida = '';
  const proc = spawn(dep.CLAUDE_BIN, args, { cwd: s.pasta, env: process.env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  rodando = { id: d.id, proc };
  proc.stdin.on('error', () => {});
  proc.stdin.end(prompt, 'utf8');
  const prazo = setTimeout(() => { d.estourou = true; try { proc.kill(); } catch (e) {} }, LIMITE);

  proc.stdout.on('data', c => { saida += c; });
  proc.stderr.on('data', c => { erroSaida += c; });
  proc.on('error', e => { d.erro = 'não consegui executar o Claude Code: ' + e.message; });
  proc.on('exit', () => {
    clearTimeout(prazo);
    rodando = null;
    d.fim = Date.now();
    let j = null;
    try { j = JSON.parse(saida); } catch (e) { /* não veio JSON */ }
    if (j && j.session_id) d.sessionId = j.session_id;
    if (j && j.total_cost_usd) d.custo = (d.custo || 0) + j.total_cost_usd;
    const texto = j ? String(j.result || '').trim() : '';

    if (d.status === 'cancelada' || d.cancelando) { delete d.cancelando; gravar(); return setImmediate(proxima); }
    if (/not logged in|please run \/login/i.test(texto + erroSaida)) {
      d.status = 'erro'; d.erro = 'O Claude Code não está logado nesta máquina. Rode "claude auth login".';
    } else if (d.estourou) {
      d.status = 'erro'; d.erro = 'passou de 15 minutos e foi interrompida'; delete d.estourou;
    } else if (!texto || (j && j.is_error)) {
      d.status = 'erro';
      d.erro = d.erro || (texto || erroSaida || saida || 'o agente não devolveu nada').slice(0, 600);
    } else {
      d.status = 'para aprovar';
      delete d.ajustePendente;
      d.historico.push({ quem: 'agente', texto, quando: Date.now(), custo: j ? j.total_cost_usd : null });
      if (dep.avisar) dep.avisar('Demanda entregue', `${d.agenteNome} entregou "${d.titulo}". Abra o quadro de demandas para aprovar.`, 'normal');
    }
    gravar();
    console.log(`  📥 demanda ${d.id} (${d.agenteNome}): ${d.status}`);
    setImmediate(proxima);
  });
  console.log(`  📥 demanda ${d.id}: ${d.agenteNome} começou "${d.titulo.slice(0, 50)}"`);
}

function estado() {
  return {
    lista: lista.map(publico),
    executando: rodando ? rodando.id : null,
    paraAprovar: lista.filter(d => d.status === 'para aprovar').length,
    naFila: lista.filter(d => d.status === 'na fila').length
  };
}

module.exports.init = function (dependencias) {
  dep = dependencias;
  carregar();
  setInterval(proxima, 5000);
  setTimeout(proxima, 3000);
  return { estado, criar, acao, clientes };
};
