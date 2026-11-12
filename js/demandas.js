/* ===========================================================
   demandas.js (navegador) — o quadro de demandas

   À esquerda, o pedido novo: agente, cliente, título, pedido e prioridade.
   À direita, as demandas: na fila, executando, para aprovar, com erro e
   concluídas. A entrega do agente aparece formatada, com os botões de
   aprovar ou pedir ajuste. O app.js consulta DEMANDAS.ativaDe(sistema)
   para mostrar no andar quem está trabalhando numa demanda.
   =========================================================== */
const DEMANDAS = (() => {
  let est = { lista: [], executando: null, paraAprovar: 0, naFila: 0 };
  let aberto = false, filtro = 'ativas', aberta = null, clientes = [];
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Markdown simples: títulos, negrito, itálico, código, listas, tabelas e parágrafos */
  function md(t) {
    const linhas = esc(t).split(/\r?\n/);
    const out = []; let lista = null, tabela = null;
    const inl = s => s.replace(/`([^`]+)`/g, '<code>$1</code>')
                      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
                      .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
    const fechaLista = () => { if (lista) { out.push(`</${lista}>`); lista = null; } };
    const fechaTabela = () => { if (tabela) { out.push('</tbody></table></div>'); tabela = null; } };
    for (const l of linhas) {
      if (/^\s*\|.*\|\s*$/.test(l)) {
        fechaLista();
        const cel = l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        if (cel.every(c => /^:?-{2,}:?$/.test(c))) continue;
        if (!tabela) { out.push('<div class="dm-tab"><table><thead><tr>' + cel.map(c => `<th>${inl(c)}</th>`).join('') + '</tr></thead><tbody>'); tabela = true; }
        else out.push('<tr>' + cel.map(c => `<td>${inl(c)}</td>`).join('') + '</tr>');
        continue;
      }
      fechaTabela();
      let m;
      if ((m = l.match(/^\s*#{1,4}\s+(.*)$/))) { fechaLista(); out.push(`<h4>${inl(m[1])}</h4>`); }
      else if ((m = l.match(/^\s*[-*•]\s+(.*)$/))) { if (lista !== 'ul') { fechaLista(); out.push('<ul>'); lista = 'ul'; } out.push(`<li>${inl(m[1])}</li>`); }
      else if ((m = l.match(/^\s*\d+[.)]\s+(.*)$/))) { if (lista !== 'ol') { fechaLista(); out.push('<ol>'); lista = 'ol'; } out.push(`<li>${inl(m[1])}</li>`); }
      else if (!l.trim()) { fechaLista(); }
      else { fechaLista(); out.push(`<p>${inl(l)}</p>`); }
    }
    fechaLista(); fechaTabela();
    return out.join('');
  }

  const STATUS = {
    'na fila':      { ic: '⏳', cls: 'fila' },
    'executando':   { ic: '⚙️', cls: 'exec' },
    'para aprovar': { ic: '📬', cls: 'aprovar' },
    'aprovada':     { ic: '✅', cls: 'ok' },
    'erro':         { ic: '⚠️', cls: 'erro' },
    'cancelada':    { ic: '✖', cls: 'cancel' }
  };
  const quando = ms => ms ? new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
  const duracao = d => d.inicio && d.fim && d.fim > d.inicio ? Math.round((d.fim - d.inicio) / 1000) + ' s' : '';

  let assinatura = '';
  async function buscar(forcar) {
    let novo;
    try { novo = await (await fetch('/api/demandas')).json(); } catch (e) { return; }
    est = novo;
    const b = $('#btn-demandas');
    if (b) {
      const n = est.paraAprovar;
      b.innerHTML = '📥 Demandas' + (n ? ` <span class="dm-badge">${n}</span>` : est.executando ? ' <span class="dm-badge exec">⚙️</span>' : '');
    }
    // só redesenha se algo mudou, e nunca com um ajuste sendo digitado
    const sig = JSON.stringify(est);
    const digitando = [...document.querySelectorAll('.dm-ajuste')].some(t => t.value.trim());
    if (aberto && (forcar || (sig !== assinatura && !digitando))) { assinatura = sig; pintarLista(); }
  }

  async function post(url, corpo) {
    try {
      const r = await (await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo || {}) })).json();
      if (!r.ok) alerta(r.motivo || 'não deu certo');
      await buscar(true);
      return r;
    } catch (e) { alerta('o escritório não respondeu'); }
  }
  function alerta(t) { const el = $('#dm-msg'); el.textContent = t; el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 4000); }

  /* ---------------- formulário ---------------- */
  async function pintarForm() {
    try { clientes = await (await fetch('/api/demandas/clientes')).json(); } catch (e) { clientes = []; }
    const equipe = (typeof ROSTER !== 'undefined' ? ROSTER.all() : []).filter(a => a.sistema && !a.boss && a.sistema !== 'exemplo');
    const sel = $('#dm-agente');
    const atual = sel.value;
    sel.innerHTML = equipe.map(a => `<option value="${esc(a.sistema)}" data-nome="${esc(a.name)}">${esc(a.emoji || '')} ${esc(a.name)} · ${esc(a.role)}</option>`).join('');
    if (atual) sel.value = atual;
    const cs = $('#dm-cliente'), c0 = cs.value;
    cs.innerHTML = '<option value="">Hera Digital (trabalho interno)</option>' + clientes.map(c => `<option>${esc(c)}</option>`).join('');
    if (c0) cs.value = c0;
  }

  async function enviar() {
    const sel = $('#dm-agente');
    const opt = sel.selectedOptions[0];
    const r = await post('/api/demandas', {
      agente: sel.value, agenteNome: opt ? opt.dataset.nome : '',
      cliente: $('#dm-cliente').value, titulo: $('#dm-titulo').value,
      pedido: $('#dm-pedido').value, prioridade: $('#dm-prio').value
    });
    if (r && r.ok) {
      $('#dm-titulo').value = ''; $('#dm-pedido').value = '';
      filtro = 'ativas'; aberta = r.demanda.id; pintarLista();
      alerta('Demanda enviada para ' + (r.demanda.agenteNome) + '.');
    }
  }

  /* ---------------- lista ---------------- */
  function pintarLista() {
    const ativas = ['na fila', 'executando', 'para aprovar', 'erro'];
    const l = est.lista.filter(d => filtro === 'ativas' ? ativas.includes(d.status) : !ativas.includes(d.status));
    document.querySelectorAll('.dm-filtro').forEach(b => b.classList.toggle('on', b.dataset.f === filtro));
    $('#dm-resumo').textContent = `${est.naFila} na fila · ${est.executando ? '1 em execução' : 'ninguém executando'} · ${est.paraAprovar} para aprovar`;
    const box = $('#dm-lista');
    if (!l.length) { box.innerHTML = `<p class="dm-vazio">${filtro === 'ativas' ? 'Nenhuma demanda em andamento. Escreva um pedido ao lado.' : 'Nada concluído ainda.'}</p>`; return; }
    box.innerHTML = l.map(d => {
      const st = STATUS[d.status] || {};
      const aberto_ = aberta === d.id;
      const ultima = [...d.historico].reverse().find(h => h.quem === 'agente');
      return `<article class="dm-card ${st.cls}${aberto_ ? ' aberto' : ''}" data-id="${d.id}">
        <header class="dm-cab" data-acao="abrir">
          <span class="dm-st">${st.ic} ${esc(d.status)}</span>
          <b>${esc(d.titulo)}</b>
          <small>${esc(d.agenteNome)}${d.cliente ? ' · ' + esc(d.cliente) : ''} · ${quando(d.criada)}${d.prioridade !== 'normal' ? ' · prioridade ' + esc(d.prioridade) : ''}</small>
        </header>
        ${aberto_ ? `<div class="dm-corpo">
          ${d.status === 'executando' ? `<p class="dm-exec"><i></i> ${esc(d.agenteNome)} está trabalhando nisso agora…</p>` : ''}
          ${d.status === 'erro' ? `<p class="dm-erro">${esc(d.erro || 'deu erro')}</p>` : ''}
          ${d.historico.map(h => h.quem === 'agente'
            ? `<div class="dm-msg agente"><span>${esc(d.agenteNome)} · ${quando(h.quando)}${h.custo ? ' · cota equiv. US$ ' + (+h.custo).toFixed(2) : ''}</span><div class="dm-md">${md(h.texto)}</div></div>`
            : `<div class="dm-msg voce"><span>${h.ajuste ? 'Você pediu ajuste' : 'Você'} · ${quando(h.quando)}</span><p>${esc(h.texto)}</p></div>`).join('')}
          <footer class="dm-acoes">
            ${d.status === 'para aprovar' ? `<button class="btn primary" data-acao="aprovar">✓ Aprovar</button>` : ''}
            ${['para aprovar', 'aprovada', 'erro'].includes(d.status) ? `<textarea class="dm-ajuste" rows="2" placeholder="O que precisa mudar? Ex.: mais curto, foque em eSIM…"></textarea><button class="btn" data-acao="refazer">↻ Pedir ajuste</button>` : ''}
            ${d.status === 'erro' ? `<button class="btn" data-acao="tentar">Tentar de novo</button>` : ''}
            ${['na fila', 'executando'].includes(d.status) ? `<button class="btn ghost" data-acao="cancelar">Cancelar</button>` : ''}
            ${ultima ? `<button class="btn ghost" data-acao="copiar">Copiar entrega</button>` : ''}
            ${!['executando'].includes(d.status) ? `<button class="btn ghost danger" data-acao="apagar">Apagar</button>` : ''}
            <span class="dm-meta">${d.rodadas ? d.rodadas + ' rodada(s)' : ''}${duracao(d) ? ' · última em ' + duracao(d) : ''}</span>
          </footer>
        </div>` : ''}
      </article>`;
    }).join('');
  }

  async function clicarLista(e) {
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const card = e.target.closest('.dm-card');
    const id = card.dataset.id, a = alvo.dataset.acao;
    const d = est.lista.find(x => x.id === id);
    if (a === 'abrir') { aberta = aberta === id ? null : id; pintarLista(); return; }
    if (a === 'copiar') {
      const ult = [...d.historico].reverse().find(h => h.quem === 'agente');
      try { await navigator.clipboard.writeText(ult.texto); alerta('Entrega copiada.'); } catch (er) { alerta('Selecione o texto e copie.'); }
      return;
    }
    if (a === 'apagar' && !confirm('Apagar esta demanda do quadro? O que o agente gravou nos sistemas continua lá.')) return;
    const comentario = a === 'refazer' ? (card.querySelector('.dm-ajuste') || {}).value : '';
    await post(`/api/demandas/${id}/${a}`, { comentario });
  }

  function abrir() { aberto = true; $('#demandas').classList.remove('hidden'); pintarForm(); buscar(true); }
  function fechar() { aberto = false; $('#demandas').classList.add('hidden'); }

  function ligarEventos() {
    $('#btn-demandas').addEventListener('click', abrir);
    $('#dm-x').addEventListener('click', fechar);
    $('#demandas').addEventListener('click', e => { if (e.target.id === 'demandas') fechar(); });
    $('#dm-enviar').addEventListener('click', enviar);
    $('#dm-lista').addEventListener('click', clicarLista);
    document.querySelectorAll('.dm-filtro').forEach(b => b.addEventListener('click', () => { filtro = b.dataset.f; pintarLista(); }));
    buscar();
    setInterval(buscar, 4000);
  }

  /** a demanda que este sistema está executando agora (para o boneco no andar) */
  const ativaDe = sistema => est.lista.find(d => d.status === 'executando' && d.agente === sistema) || null;

  return { ligarEventos, abrir, ativaDe, get estado() { return est; } };
})();
