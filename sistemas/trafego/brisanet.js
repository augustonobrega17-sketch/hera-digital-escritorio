/* ===========================================================
   Painel Brisanet 5G · Meta Ads ao vivo (Hera Digital)
   Lê /api/meta/5g (montado por meta.js) e redesenha sozinho
   quando a coleta da Meta é atualizada. Sem dependências.
   =========================================================== */
'use strict';
(() => {
  /* ---------------- formatos ---------------- */
  const N = v => Number(v) || 0;
  const div = (a, b) => (N(b) ? N(a) / N(b) : 0);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const loc = (v, a, b) => N(v).toLocaleString('pt-BR', { minimumFractionDigits: a, maximumFractionDigits: b });
  const fR = v => 'R$ ' + loc(v, 2, 2);
  const fR0 = v => 'R$ ' + loc(v, 0, 0);
  const fRc = v => { const a = Math.abs(N(v)); return a >= 1e6 ? 'R$ ' + loc(v / 1e6, 1, 1) + ' mi' : a >= 1e4 ? 'R$ ' + loc(v / 1e3, 1, 1) + ' mil' : a >= 100 ? fR0(v) : fR(v); };
  const fN = v => loc(v, 0, 0);
  const fNc = v => { const a = Math.abs(N(v)); return a >= 1e6 ? loc(v / 1e6, 1, 1) + ' mi' : a >= 1e4 ? loc(v / 1e3, 1, 1) + ' mil' : fN(v); };
  const fP = (v, c = 1) => loc(N(v) * 100, c, c) + '%';
  const fX = (v, c = 2) => loc(v, c, c);

  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const dt = s => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
  const somaDias = (s, n) => { const d = dt(s); d.setDate(d.getDate() + n); return iso(d); };
  const fDia = s => (s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '—');
  const fDiaAno = s => (s ? fDia(s) + '/' + s.slice(0, 4) : '—');
  const fMes = m => MESES[+m.slice(5, 7) - 1] + '/' + m.slice(2, 4);
  const fMesLongo = m => MESES[+m.slice(5, 7) - 1] + ' de ' + m.slice(0, 4);
  const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const hhmm = s => new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const haQuanto = s => {
    const m = Math.round((Date.now() - new Date(s)) / 6e4);
    return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.floor(m / 60)} h` : `há ${Math.floor(m / 1440)} d`;
  };

  const guarda = {
    ler(k, p) { try { const v = localStorage.getItem('brisanet:' + k); return v ? JSON.parse(v) : p; } catch (e) { return p; } },
    por(k, v) { try { localStorage.setItem('brisanet:' + k, JSON.stringify(v)); } catch (e) { /* sem storage */ } }
  };

  const $ = s => document.querySelector(s);

  /* ---------------- estado ---------------- */
  const PER = {
    hoje: { rot: 'Hoje' }, ult7: { rot: '7 dias' }, ult30: { rot: '30 dias' }, total: { rot: 'Tudo' }
  };
  const SERIES = {
    gasto:     { rot: 'Investimento', f: fRc, fT: fR },
    lpv:       { rot: 'Visitas na página', f: fNc, fT: fN },
    contatos:  { rot: 'Contatos no site', f: fNc, fT: fN },
    conversas: { rot: 'Conversas no WhatsApp', f: fNc, fT: fN },
    carrinhos: { rot: 'Adições ao carrinho', f: fNc, fT: fN },
    leads:     { rot: 'Leads', f: fNc, fT: fN }
  };
  const DEC = {
    'Pausar ou corrigir': { ic: '■', c: '#FF4F8B', o: 0 },
    'Otimizar já':        { ic: '▲', c: '#FF8A3D', o: 1 },
    'Ajustar':            { ic: '◆', c: '#FFB547', o: 2 },
    'Escalar':            { ic: '↑', c: '#23e08a', o: 3 },
    'Manter':             { ic: '●', c: '#12D6C5', o: 4 },
    'Reativar?':          { ic: '↻', c: '#8A5CFF', o: 5 },
    'Pausada':            { ic: '‖', c: '#A9A3C7', o: 6 }
  };
  const NIVEL = { critico: '■', atencao: '◆', oportunidade: '↑', info: '●', ok: '✓' };

  const S = {
    r: null,
    per: guarda.ler('per', 'ult30'),
    serie: guarda.ler('serie', 'gasto'),
    f: guarda.ler('f', { status: 'ativas', produto: '', dec: '', busca: '' }),
    ordem: { k: 'prio', dir: 1 },
    aberta: null,
    offline: false
  };
  if (!PER[S.per]) S.per = 'ult30';
  if (!SERIES[S.serie]) S.serie = 'gasto';

  /* ---------------- contas ---------------- */
  function taxas(o) {
    o.cpm = div(o.gasto, o.impr) * 1000; o.ctrLink = div(o.cliquesLink, o.impr);
    o.cpcLink = div(o.gasto, o.cliquesLink); o.custoLpv = div(o.gasto, o.lpv);
    return o;
  }
  function somaDiario(d, ini, fim) {
    const o = { gasto: 0, impr: 0, cliquesLink: 0, lpv: 0, leads: 0, contatos: 0, conversas: 0, carrinhos: 0 };
    for (const x of d.diario) if (x.d >= ini && x.d <= fim) for (const k in o) o[k] += N(x[k]);
    return taxas(o);
  }
  /** taxa de conexão só das campanhas que levam ao site (WhatsApp não gera visualização de página) */
  function conexaoSite(d, p) {
    let l = 0, v = 0;
    for (const c of d.campanhas) if (c.site && c.per[p]) { l += c.per[p].cliquesLink; v += c.per[p].lpv; }
    return { cliques: l, visitas: v, taxa: div(v, l) };
  }
  /** com o que comparar o período escolhido */
  function comparacao(d, p) {
    const T = d.totais;
    if (p === 'ult30') return { prev: { ...T.ant30, conexao: conexaoSite(d, 'ant30').taxa }, rot: 'vs 30 dias anteriores', bench: d.bench.ant30, volume: true };
    if (p === 'ult7') {
      const ini = T.ult7.inicio, fim = T.ult7.fim;
      if (!ini || !fim) return null;
      const n = Math.round((dt(fim) - dt(ini)) / 864e5) + 1;
      return { prev: somaDiario(d, somaDias(ini, -n), somaDias(ini, -1)), rot: 'vs 7 dias anteriores', bench: d.bench.ult30, rotBench: 'vs média de 30 dias', volume: true };
    }
    if (p === 'hoje') return { prev: { ...T.ult7, conexao: conexaoSite(d, 'ult7').taxa }, rot: 'vs média dos últimos 7 dias', bench: d.bench.ult7, volume: false };
    return null;
  }
  function delta(cur, prev, bom) {
    if (!(N(prev) > 0) || !isFinite(cur)) return '';
    const v = cur / prev - 1;
    if (Math.abs(v) < 0.005) return '<span class="dl neutro">= estável</span>';
    const cls = bom === 0 ? 'neutro' : (v > 0) === (bom > 0) ? 'bom' : 'ruim';
    return `<span class="dl ${cls}">${v > 0 ? '▲' : '▼'} ${fP(Math.abs(v), Math.abs(v) < 0.1 ? 1 : 0)}</span>`;
  }
  const periodoTexto = (d, p) => {
    const t = d.totais[p];
    if (p === 'hoje') return 'hoje, ' + fDia(t.inicio || iso(new Date()));
    if (p === 'total') return 'de ' + fDiaAno(t.inicio || d.diario[0]?.d) + ' até hoje';
    return fDia(t.inicio) + ' a ' + fDia(t.fim);
  };

  /* ---------------- tooltip ---------------- */
  const tip = $('#tip');
  function mostrarTip(html, e) {
    tip.innerHTML = html; tip.classList.add('on');
    const r = tip.getBoundingClientRect();
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
  }
  const esconderTip = () => tip.classList.remove('on');
  document.addEventListener('pointermove', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (t) mostrarTip(t.getAttribute('data-tip'), e);
    else if (!(e.target.closest && e.target.closest('.hz'))) esconderTip();
  });
  const linhaTip = (a, b) => `<div class="l"><span>${a}</span><span>${b}</span></div>`;

  /* ---------------- gráficos (SVG à mão) ---------------- */
  function nice(max) {
    if (!(max > 0)) return 1;
    const e = Math.pow(10, Math.floor(Math.log10(max))), f = max / e;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
  }
  const uid = () => 'g' + Math.random().toString(36).slice(2, 8);
  const pathBarra = (x, y, w, h, r) => {
    r = Math.min(r, w / 2, h); const b = y + h;
    return `M${x},${b}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${b}Z`;
  };
  function eixos(W, m, ih, max, fmt) {
    let s = '<g class="grade">';
    for (let k = 1; k <= 4; k++) {
      const v = max * k / 4, y = m.t + ih - ih * k / 4;
      s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}"/><text x="${m.l - 8}" y="${y + 4}" text-anchor="end">${esc(fmt(v))}</text>`;
    }
    s += `</g><line class="base" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ih}" y2="${m.t + ih}"/><text x="${m.l - 8}" y="${m.t + ih + 4}" text-anchor="end">0</text>`;
    return s;
  }
  function rotulosX(pts, x, y, iw, larg = 70) {
    const passo = Math.max(1, Math.ceil(pts.length / Math.max(2, Math.floor(iw / larg))));
    let s = '';
    for (let i = pts.length - 1; i >= 0; i -= passo) s += `<text x="${x(i)}" y="${y}" text-anchor="middle">${esc(pts[i].rot)}</text>`;
    return s;
  }
  function vazioG(box, H, msg) {
    box.innerHTML = `<svg height="${H}"><text class="vazio-g" x="50%" y="${H / 2}" text-anchor="middle">${esc(msg)}</text></svg>`;
  }

  /** linha com área, crosshair e tooltip; faixa = [i0, i1] destacada */
  function grafLinha(box, pts, o = {}) {
    const W = box.clientWidth || 600, H = o.h || 230, m = { l: 62, r: 14, t: 16, b: 28 };
    if (!pts.length || pts.every(p => !p.v)) return vazioG(box, H, 'Sem dados neste período');
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = pts.length;
    const max = nice(Math.max(...pts.map(p => p.v)));
    const x = i => m.l + (n < 2 ? iw / 2 : i * iw / (n - 1));
    const y = v => m.t + ih - v / max * ih;
    const g = uid(), v2 = o.v2 ? ' v2' : '';
    const cor = o.v2 ? '#8A5CFF' : '#12D6C5';
    const linha = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    let faixa = '';
    if (o.faixa && o.faixa[0] >= 0) {
      const passo = n > 1 ? iw / (n - 1) : iw;
      const x0 = Math.max(m.l, x(o.faixa[0]) - passo / 2), x1 = Math.min(W - m.r, x(o.faixa[1]) + passo / 2);
      faixa = `<rect class="faixa-sel" x="${x0}" y="${m.t}" width="${Math.max(2, x1 - x0)}" height="${ih}"/>` +
              `<text class="faixa-txt" x="${(x0 + x1) / 2}" y="${m.t + 11}" text-anchor="middle">${esc(o.faixaRot || '')}</text>`;
    }
    box.innerHTML = `<svg height="${H}" role="img" aria-label="${esc(o.titulo || '')}">
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor}" stop-opacity=".28"/><stop offset="1" stop-color="${cor}" stop-opacity="0"/></linearGradient></defs>
      ${faixa}${eixos(W, m, ih, max, o.fmt || fNc)}
      <path d="${linha}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#${g})"/>
      <path class="linha${v2}" d="${linha}"/>
      ${rotulosX(pts, x, H - 8, iw)}
      <line class="xh" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/>
      <circle class="pt${v2}" r="4.5" visibility="hidden"/>
      <rect class="hz" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}"/>
    </svg>`;
    const svg = box.firstElementChild, xh = svg.querySelector('.xh'), pt = svg.querySelector('.pt');
    const zona = svg.querySelector('.hz');
    zona.addEventListener('pointermove', e => {
      const r = svg.getBoundingClientRect();
      const i = Math.max(0, Math.min(n - 1, Math.round((e.clientX - r.left - m.l) / iw * (n - 1))));
      xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('visibility', 'visible');
      pt.setAttribute('cx', x(i)); pt.setAttribute('cy', y(pts[i].v)); pt.setAttribute('visibility', 'visible');
      mostrarTip(pts[i].tip, e);
    });
    zona.addEventListener('pointerleave', () => { xh.setAttribute('visibility', 'hidden'); pt.setAttribute('visibility', 'hidden'); esconderTip(); });
  }

  /** barras verticais com tooltip; alvo de hover ocupa a coluna inteira */
  function grafBarras(box, pts, o = {}) {
    const W = box.clientWidth || 400, H = o.h || 230, m = { l: 62, r: 8, t: 16, b: 28 };
    if (!pts.length || pts.every(p => !p.v)) return vazioG(box, H, 'Sem dados neste período');
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = pts.length;
    const max = nice(Math.max(...pts.map(p => p.v)));
    const slot = iw / n, bw = Math.max(2, Math.min(slot - 2, 40));
    const xc = i => m.l + i * slot + slot / 2;
    let barras = '';
    pts.forEach((p, i) => {
      const h = p.v / max * ih, x0 = xc(i) - bw / 2;
      barras += `<g data-tip="${esc(p.tip)}"><rect class="alvo" x="${m.l + i * slot}" y="${m.t}" width="${slot}" height="${ih}"/>` +
        (h > 0 ? `<path class="bar${o.v2 ? ' v2' : ''}${p.fraco ? ' fraco' : ''}" d="${pathBarra(x0, m.t + ih - h, bw, h, 4)}"/>` : '') + '</g>';
    });
    box.innerHTML = `<svg height="${H}" role="img" aria-label="${esc(o.titulo || '')}">${eixos(W, m, ih, max, o.fmt || fNc)}${barras}${rotulosX(pts, xc, H - 8, iw, 52)}</svg>`;
  }

  /* ---------------- blocos da página ---------------- */
  function estado() {
    const r = S.r, el = $('#estado');
    if (!r) { el.innerHTML = ''; return; }
    const cls = r.atualizando ? 'girando' : S.offline || r.erro ? 'erro' : '';
    const quando = r.atualizadoEm ? `${new Date(r.atualizadoEm).toDateString() === new Date().toDateString() ? '' : new Date(r.atualizadoEm).toLocaleDateString('pt-BR') + ' '}${hhmm(r.atualizadoEm)} (${haQuanto(r.atualizadoEm)})` : '';
    const txt = S.offline ? 'Sem conexão com o sistema do Léo (porta 4412)'
      : r.atualizando ? 'Buscando dados novos na Meta…'
      : !r.atualizadoEm ? 'Ainda sem dados'
      : r.erro ? `Última coleta boa: ${quando} · a Meta não respondeu agora`
      : `Atualizado às ${quando}${r.proxima ? ` · próxima às ${hhmm(r.proxima)}` : ''}`;
    el.innerHTML = `<span class="pulso ${cls}"></span><span>${esc(txt)}</span>
      <button class="btn mini" id="atualizar" ${r.atualizando ? 'disabled' : ''}>↻ Atualizar agora</button>
      <a class="btn mini fantasma" href="/" title="Sistema do Léo">Tráfego Hera</a>`;
  }

  function blocoKpis(d, p, cmp) {
    const m = d.totais[p] || {}, con = conexaoSite(d, p);
    const cur = { ...m, conexao: con.taxa };
    const K = [
      { k: 'gasto', rot: 'Investimento', f: fR0, bom: 0 },
      { k: 'impr', rot: 'Impressões', f: fNc, bom: 1 },
      { k: 'alcance', rot: 'Alcance', f: fNc, bom: 1 },
      { k: 'freq', rot: 'Frequência', f: v => fX(v, 2), bom: -1 },
      { k: 'cpm', rot: 'CPM', f: fR, bom: -1, taxa: true },
      { k: 'ctrLink', rot: 'CTR no link', f: v => fP(v, 2), bom: 1, taxa: true },
      { k: 'cpcLink', rot: 'CPC no link', f: fR, bom: -1, taxa: true },
      { k: 'conexao', rot: 'Conexão (site)', f: v => fP(v, 0), bom: 1, taxa: true,
        sub: `${fNc(con.visitas)} de ${fNc(con.cliques)} cliques` }
    ];
    if (p === 'hoje') K[0].sub = `média 7d: ${fR0(div(d.totais.ult7.gasto, 7))}/dia`;
    if (p === 'total') K[0].sub = `${fNc(m.cliquesLink)} cliques no link`;
    return `<div class="kpis">${K.map(k => {
      const dl = cmp && (k.taxa || cmp.volume) ? delta(cur[k.k], cmp.prev[k.k], k.bom) : '';
      return `<div class="kpi" style="--k:${k.taxa ? '#8A5CFF' : '#12D6C5'}"><span>${k.rot}</span><b>${esc(k.f(cur[k.k]))}</b>
        <div class="rodape">${dl}${k.sub ? `<small>${esc(k.sub)}</small>` : ''}</div></div>`;
    }).join('')}</div>`;
  }

  function blocoResultados(d, p, cmp) {
    const B = d.bench[p] || {};
    const lin = Object.entries(B).sort((a, b) => b[1].gasto - a[1].gasto);
    const ref = cmp && cmp.bench, rotRef = cmp ? (cmp.rotBench || cmp.rot) : '';
    const corpo = lin.length ? lin.map(([ind, b]) => {
      const a = ref && ref[ind];
      return `<tr><td><b>${esc(b.rot)}</b><small>${b.n} campanha${b.n > 1 ? 's' : ''} · ${esc(b.rotCusto.toLowerCase())}</small></td>
        <td class="num">${fN(b.valor)}${cmp && cmp.volume && cmp.bench === d.bench.ant30 && a ? `<small>${delta(b.valor, a.valor, 1)}</small>` : ''}</td>
        <td class="num">${fR0(b.gasto)}</td>
        <td class="num"><b>${fR(b.cpr)}</b>${a && a.valor ? `<small>${delta(b.cpr, a.cpr, -1)}</small>` : ''}</td></tr>`;
    }).join('') : '<tr><td colspan="4" class="vazio">Nenhum resultado registrado neste período.</td></tr>';
    return `<div class="card"><div class="card-cab"><h3>Resultados por tipo</h3><span class="dica">Como o Gerenciador conta, somando os conjuntos${rotRef ? ` · variação ${esc(rotRef)}` : ''}</span></div>
      <div class="tabwrap"><table class="tab-res"><thead><tr><th>Resultado</th><th class="num">Volume</th><th class="num">Investido</th><th class="num">Custo por resultado</th></tr></thead>
      <tbody>${corpo}</tbody></table></div></div>`;
  }

  function blocoLeitura(d) {
    const notas = d.resumo || [];
    return `<div class="card"><div class="card-cab"><h3>Leitura da conta</h3><span class="dica">base: últimos 30 dias</span></div>
      <div class="leitura">${notas.length ? notas.map(n => nota(n)).join('') : '<p class="vazio">Nada fora do normal.</p>'}</div></div>`;
  }
  const nota = n => `<div class="nota nv-${esc(n.nivel)}"><span class="ic" aria-hidden="true">${NIVEL[n.nivel] || '●'}</span><div><b>${esc(n.titulo)}</b><p>${esc(n.texto)}</p></div></div>`;

  function blocoGraficos(d, p) {
    const s = SERIES[S.serie];
    return `<div class="card"><div class="card-cab"><h3>Evolução</h3>
        <div class="seg mini" role="tablist">${Object.entries(SERIES).map(([k, v]) => `<button data-serie="${k}" class="${k === S.serie ? 'on' : ''}">${v.rot}</button>`).join('')}</div></div>
      <div class="linha-graf">
        <div><h4>${esc(s.rot)} por dia · ${p === 'total' ? 'todo o histórico' : 'últimos 90 dias'}</h4><div class="graf" id="g-dia"></div></div>
        <div><h4>${esc(s.rot)} por mês</h4><div class="graf" id="g-mes"></div></div>
      </div></div>`;
  }

  function blocoDistribuicao(d, p) {
    const G = d.grupos[p] || { etapa: [], produto: [] };
    const card = (titulo, lista) => {
      const tot = lista.reduce((s, x) => s + x.gasto, 0), max = Math.max(1, ...lista.map(x => x.gasto));
      return `<div class="card"><div class="card-cab"><h3>${titulo}</h3><span class="dica">investimento no período</span></div>
        ${lista.map(x => `<div class="dist" data-tip="${esc(`<b>${esc(x.nome)}</b>${linhaTip('Investido', fR(x.gasto))}${linhaTip('Participação', fP(div(x.gasto, tot), 1))}${linhaTip('Campanhas', `${x.campanhas} (${x.ativas} ativas)`)}`)}">
          <div class="n"><b>${esc(x.nome)}</b><small>${x.campanhas} campanha${x.campanhas > 1 ? 's' : ''} · ${x.ativas} ativa${x.ativas === 1 ? '' : 's'}</small></div>
          <div class="trilho"><i style="width:${x.gasto ? Math.max(0.5, x.gasto / max * 100) : 0}%"></i></div>
          <div class="v">${x.gasto ? fRc(x.gasto) : '—'}<small>${tot ? fP(div(x.gasto, tot), 0) : '—'}</small></div></div>`).join('')}</div>`;
    };
    return `<div class="grade g2">${card('Por produto', G.produto)}${card('Por etapa do funil', G.etapa)}</div>`;
  }

  function blocoCampanhas(d) {
    const produtos = [...new Set(d.campanhas.map(c => c.produto))].sort();
    const ativas = d.campanhas.filter(c => c.status === 'ACTIVE');
    const cont = {};
    for (const c of d.campanhas) if (S.f.status !== 'ativas' || c.status === 'ACTIVE') cont[c.decisao] = (cont[c.decisao] || 0) + 1;
    return `<div class="card" id="campanhas"><div class="card-cab"><h3>Campanhas</h3><span class="dica">${ativas.length} ativas de ${d.campanhas.length} com entrega · clique numa linha para ver o detalhe</span></div>
      <div class="filtros-c">
        <div class="seg mini">${[['ativas', 'Ativas'], ['todas', 'Todas'], ['pausadas', 'Pausadas']].map(([k, r]) => `<button data-fstatus="${k}" class="${S.f.status === k ? 'on' : ''}">${r}</button>`).join('')}</div>
        <select id="f-produto"><option value="">Todos os produtos</option>${produtos.map(x => `<option ${S.f.produto === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
        <input id="f-busca" type="search" placeholder="Buscar pelo nome…" value="${esc(S.f.busca)}">
      </div>
      <div class="contagem">${Object.entries(DEC).filter(([k]) => cont[k]).map(([k, v]) =>
        `<button class="chip n ${S.f.dec === k ? 'on' : ''}" data-fdec="${esc(k)}" style="--c:${v.c}"><i>${v.ic}</i>${esc(k)} <em>${cont[k]}</em></button>`).join('')}</div>
      <div class="tabwrap" id="tabela"></div></div>`;
  }

  const chip = dec => { const v = DEC[dec] || DEC.Pausada; return `<span class="chip" style="--c:${v.c}"><i aria-hidden="true">${v.ic}</i>${esc(dec)}</span>`; };

  function relMedia(d, p, pr) {
    const b = pr && d.bench[p] && d.bench[p][pr.ind];
    return b && b.n > 1 && pr.valor > 0 ? pr.cpr / b.cpr : null;
  }

  function linhasCampanhas(d, p) {
    const busca = S.f.busca.trim().toLowerCase();
    let lista = d.campanhas.filter(c =>
      (S.f.status === 'todas' || (S.f.status === 'ativas') === (c.status === 'ACTIVE')) &&
      (!S.f.produto || c.produto === S.f.produto) && (!S.f.dec || c.decisao === S.f.dec) &&
      (!busca || c.nome.toLowerCase().includes(busca)));
    const val = {
      prio: c => (DEC[c.decisao]?.o ?? 9) * 1e9 - c.per[p].gasto,
      nome: c => c.nome, gasto: c => c.per[p].gasto, res: c => c.per[p].principal?.valor || 0,
      cpr: c => c.per[p].principal?.cpr || Infinity, rel: c => relMedia(d, p, c.per[p].principal) ?? Infinity,
      ctr: c => c.per[p].ctrLink, freq: c => c.per[p].freq, con: c => (c.site ? c.per[p].conexao : -1), orc: c => c.orcDia
    }[S.ordem.k] || (c => 0);
    lista.sort((a, b) => { const x = val(a), y = val(b); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * S.ordem.dir; });
    return lista;
  }

  function tabela() {
    const d = S.r && S.r.dados, box = $('#tabela');
    if (!d || !box) return;
    const p = S.per, lista = linhasCampanhas(d, p);
    const th = (k, rot, num) => `<th class="ord ${num ? 'num' : ''} ${S.ordem.k === k ? (S.ordem.dir > 0 ? 'asc' : 'desc') : ''}" data-ord="${k}">${rot}</th>`;
    const corpo = lista.length ? lista.map(c => {
      const m = c.per[p], pr = m.principal, rel = relMedia(d, p, pr);
      return `<tr data-id="${esc(c.id)}" tabindex="0">
        <td>${chip(c.decisao)}</td>
        <td><span class="nome">${esc(c.nome)}</span><small>${esc(c.produto)} · ${esc(c.etapa)}</small></td>
        <td class="num">${m.gasto ? fR0(m.gasto) : '—'}</td>
        <td class="num">${pr ? `<b>${fN(pr.valor)}</b><small>${esc(pr.rot)}</small>` : '—'}</td>
        <td class="num">${pr && pr.valor ? `<b>${fR(pr.cpr)}</b>` : '—'}${rel ? `<small>${delta(rel, 1, -1).replace('</span>', ' <small>da média</small></span>')}</small>` : ''}</td>
        <td class="num">${m.impr ? fP(m.ctrLink, 2) : '—'}</td>
        <td class="num">${m.freq ? fX(m.freq, 1) : '—'}</td>
        <td class="num">${c.site ? (m.cliquesLink ? fP(m.conexao, 0) : '—') : '<small title="Leva para WhatsApp ou compra no app">WhatsApp</small>'}</td>
        <td class="num">${c.orcDia ? fR0(c.orcDia) : '—'}</td></tr>`;
    }).join('') : '<tr><td colspan="9" class="vazio">Nenhuma campanha com esses filtros.</td></tr>';
    box.innerHTML = `<table class="tab-camp"><thead><tr>${th('prio', 'Decisão')}${th('nome', 'Campanha')}${th('gasto', 'Investido', 1)}${th('res', 'Resultado', 1)}${th('cpr', 'Custo / resultado', 1)}${th('ctr', 'CTR link', 1)}${th('freq', 'Freq.', 1)}${th('con', 'Conexão', 1)}${th('orc', 'Orç./dia', 1)}</tr></thead><tbody>${corpo}</tbody></table>`;
  }

  /* ---------------- gráficos da página ---------------- */
  function graficos() {
    const d = S.r && S.r.dados;
    if (!d) return;
    const p = S.per, k = S.serie, s = SERIES[k];
    const bDia = $('#g-dia'), bMes = $('#g-mes');
    if (bDia) {
      // o dia de hoje ainda está pela metade: só entra no gráfico quando o período é "Hoje"
      const hojeD = iso(new Date());
      const base = p === 'hoje' ? d.diario : d.diario.filter(x => x.d !== hojeD);
      const dias = p === 'total' ? base : base.slice(-90);
      const t = d.totais[p];
      let faixa = null, faixaRot = '';
      if (p !== 'total' && t) {
        const ini = p === 'hoje' ? dias.at(-1)?.d : t.inicio, fim = p === 'hoje' ? dias.at(-1)?.d : t.fim;
        const i0 = dias.findIndex(x => x.d >= ini), i1 = dias.map(x => x.d <= fim).lastIndexOf(true);
        if (i0 >= 0 && i1 >= i0) { faixa = [i0, i1]; faixaRot = PER[p].rot === 'Hoje' ? 'hoje' : PER[p].rot.toLowerCase(); }
      }
      const hojeIso = iso(new Date());
      grafLinha(bDia, dias.map(x => ({
        rot: fDia(x.d), v: N(x[k]),
        tip: `<b>${SEMANA[dt(x.d).getDay()]}, ${fDiaAno(x.d)}${x.d === hojeIso ? ' (parcial)' : ''}</b>${linhaTip(s.rot, s.fT(x[k]))}` +
             (k !== 'gasto' ? linhaTip('Custo cada', x[k] ? fR(div(x.gasto, x[k])) : '—') : linhaTip('Visitas na página', fN(x.lpv)))
      })), { fmt: s.f, faixa, faixaRot, titulo: `${s.rot} por dia` });
    }
    if (bMes) {
      const meses = d.mensal, atual = iso(new Date()).slice(0, 7);
      const lista = meses.length > 24 && bMes.clientWidth < 520 ? meses.slice(-18) : meses;
      grafBarras(bMes, lista.map(x => ({
        rot: fMes(x.mes), v: N(x[k]), fraco: x.mes === atual,
        tip: `<b>${fMesLongo(x.mes)}${x.mes === atual ? ' (em andamento)' : ''}</b>${linhaTip(s.rot, s.fT(x[k]))}` +
             (k !== 'gasto' ? linhaTip('Custo cada', x[k] ? fR(div(x.gasto, x[k])) : '—') : linhaTip('Média por dia', fR0(x.gasto / diasNoMes(x.mes, atual))))
      })), { fmt: s.f, v2: true, titulo: `${s.rot} por mês` });
    }
    if (S.aberta) graficosDetalhe();
  }
  const diasNoMes = (mes, atual) => (mes === atual ? new Date().getDate() : new Date(+mes.slice(0, 4), +mes.slice(5, 7), 0).getDate());

  /* ---------------- detalhe da campanha ---------------- */
  function detalhe() {
    const d = S.r && S.r.dados, dlg = $('#det');
    const c = d && d.campanhas.find(x => x.id === S.aberta);
    if (!c) { if (dlg.open) dlg.close(); return; }
    const p = S.per, m = c.per[p], pr = m.principal, rel = relMedia(d, p, pr);
    const conta = String(d.conta?.id || '').replace('act_', '');
    const link = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${encodeURIComponent(conta)}&selected_campaign_ids=${encodeURIComponent(c.id)}`;
    const K = [
      ['Investimento', m.gasto ? fR0(m.gasto) : '—'],
      [pr ? pr.rot : 'Resultado', pr ? fN(pr.valor) : '—'],
      [pr ? pr.rotCusto : 'Custo por resultado', pr && pr.valor ? fR(pr.cpr) : '—', rel ? delta(rel, 1, -1).replace('</span>', ' <small>vs média da conta</small></span>') : ''],
      ['CTR no link', m.impr ? fP(m.ctrLink, 2) : '—'],
      ['CPM', m.impr ? fR(m.cpm) : '—'],
      ['Frequência', m.freq ? fX(m.freq, 2) : '—'],
      ['Conexão', c.site ? (m.cliquesLink ? fP(m.conexao, 0) : '—') : 'WhatsApp'],
      ['Cliques no link', fNc(m.cliquesLink)]
    ];
    const outros = (m.resultados || []).filter(r => !pr || r.ind !== pr.ind);
    dlg.innerHTML = `<div class="det">
      <div class="det-cab"><div>${chip(c.decisao)}<h2>${esc(c.nome)}</h2><span class="dica">${esc(c.produto)} · ${esc(c.etapa)} · ${PER[p].rot.toLowerCase()} (${esc(periodoTexto(d, p))})</span></div>
        <button class="btn mini fechar" data-fechar>✕ Fechar</button></div>
      <div class="kpis">${K.map(([r, v, x]) => `<div class="kpi"><span>${esc(r)}</span><b>${esc(v)}</b><div class="rodape">${x || ''}</div></div>`).join('')}</div>
      <div class="card"><div class="card-cab"><h3>Recomendações</h3><span class="dica">base: últimos 30 dias</span></div>
        <div class="leitura">${c.recs.map(nota).join('') || '<p class="vazio">Sem recomendações.</p>'}</div></div>
      <div class="card"><h4>Investimento por mês</h4><div class="graf" id="gd-gasto"></div>
        <h4 style="margin-top:14px">${esc(c.per.total.principal ? c.per.total.principal.rotCusto : 'Custo por resultado')} por mês</h4><div class="graf" id="gd-cpr"></div></div>
      ${outros.length ? `<div class="card"><h4>Outros resultados no período</h4><table class="tab-res"><tbody>${outros.map(r => `<tr><td>${esc(r.rot)}</td><td class="num">${fN(r.valor)}</td><td class="num">${fR(r.cpr)} cada</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="ficha-c">
        <div><span>Status</span>${c.status === 'ACTIVE' ? 'Ativa' : esc(c.status.toLowerCase().replace(/_/g, ' '))}</div>
        <div><span>Objetivo</span>${esc((c.objetivo || '').replace('OUTCOME_', '').toLowerCase())}</div>
        <div><span>Orçamento</span>${c.orcDia ? fR0(c.orcDia) + '/dia' : c.orcTotal ? fR0(c.orcTotal) + ' total' : '—'} ${c.cbo ? '(na campanha)' : '(nos conjuntos)'}</div>
        <div><span>Conjuntos</span>${c.conjuntosAtivos} ativos de ${c.conjuntos}</div>
        <div><span>Otimiza para</span>${esc(c.otimizacoes.join(', ').toLowerCase().replace(/_/g, ' ') || '—')}</div>
        <div><span>Início</span>${c.inicio ? fDiaAno(c.inicio) : '—'}${c.fim ? ' · fim ' + fDiaAno(c.fim) : ''}</div>
        <div><span>Investido no total</span>${fR0(c.per.total.gasto)}</div>
        <div><span>ID</span>${esc(c.id)}</div>
      </div>
      <a class="btn pri" href="${link}" target="_blank" rel="noopener">Abrir no Gerenciador de Anúncios ↗</a>
    </div>`;
    if (!dlg.open) dlg.showModal();
    graficosDetalhe();
  }
  function graficosDetalhe() {
    const d = S.r && S.r.dados, c = d && d.campanhas.find(x => x.id === S.aberta);
    const bg = $('#gd-gasto'), bc = $('#gd-cpr');
    if (!c || !bg || !bc) return;
    const meses = c.meses.slice(-12), pt = c.per.total.principal, atual = iso(new Date()).slice(0, 7);
    grafBarras(bg, meses.map(x => ({
      rot: fMes(x.mes), v: x.gasto, fraco: x.mes === atual,
      tip: `<b>${fMesLongo(x.mes)}</b>${linhaTip('Investido', fR(x.gasto))}${pt ? linhaTip(pt.rot, fN(x.resultados)) : ''}${linhaTip('CTR no link', fP(x.ctrLink, 2))}${linhaTip('Frequência', fX(x.freq, 2))}`
    })), { fmt: fRc, h: 180, titulo: 'Investimento por mês' });
    const comRes = meses.filter(x => x.resultados > 0);
    grafLinha(bc, comRes.map(x => ({
      rot: fMes(x.mes), v: x.cpr,
      tip: `<b>${fMesLongo(x.mes)}</b>${linhaTip(pt ? pt.rotCusto : 'Custo', fR(x.cpr))}${linhaTip(pt ? pt.rot : 'Resultados', fN(x.resultados))}`
    })), { fmt: v => fR(v), h: 170, v2: true, titulo: 'Custo por resultado por mês' });
  }

  /* ---------------- página ---------------- */
  function render() {
    estado();
    const r = S.r, app = $('#app');
    if (!r) return;
    if (!r.dados) {
      app.innerHTML = `<div class="card"><h3>Ainda sem dados da Meta</h3><p class="sub">${esc(r.erro || 'A primeira coleta está em andamento. Esta página atualiza sozinha.')}</p></div>`;
      return;
    }
    const d = r.dados, p = S.per, cmp = comparacao(d, p);
    const ativas = d.campanhas.filter(c => c.status === 'ACTIVE');
    const orc = ativas.reduce((s, c) => s + c.orcDia, 0);
    $('#conta-nome').textContent = `${d.conta?.name || 'Conta 5G'} · ao vivo`;
    const scrollY = window.scrollY;
    app.innerHTML = `
      <div class="periodo">
        <div class="seg" role="tablist">${Object.entries(PER).map(([k, v]) => `<button data-per="${k}" class="${k === p ? 'on' : ''}">${v.rot}</button>`).join('')}</div>
        <span class="faixa"><b>${esc(periodoTexto(d, p))}</b>${cmp ? ' · ' + esc(cmp.rot) : ''}</span>
        <span class="ativas"><b>${ativas.length}</b> campanhas ativas · orçamento <b>${fR0(orc)}/dia</b></span>
      </div>
      ${r.erro ? `<div class="alerta-erro"><b>Aviso da última coleta:</b> ${esc(r.erro)}</div>` : ''}
      ${blocoKpis(d, p, cmp)}
      <div class="linha2">${blocoResultados(d, p, cmp)}${blocoLeitura(d)}</div>
      ${blocoGraficos(d, p)}
      ${blocoDistribuicao(d, p)}
      ${blocoCampanhas(d)}`;
    tabela();
    graficos();
    if (S.aberta) detalhe();
    window.scrollTo(0, scrollY);
  }

  /* ---------------- eventos ---------------- */
  document.addEventListener('click', async e => {
    const t = e.target.closest('button, tr[data-id], th[data-ord], [data-fechar]');
    if (!t) { if (e.target === $('#det')) fecharDet(); return; }
    if (t.dataset.per) { S.per = t.dataset.per; guarda.por('per', S.per); render(); return; }
    if (t.dataset.serie) { S.serie = t.dataset.serie; guarda.por('serie', S.serie); render(); return; }
    if (t.dataset.fstatus) { S.f.status = t.dataset.fstatus; S.f.dec = ''; guarda.por('f', S.f); render(); return; }
    if (t.dataset.fdec !== undefined) { S.f.dec = S.f.dec === t.dataset.fdec ? '' : t.dataset.fdec; guarda.por('f', S.f); render(); return; }
    if (t.dataset.ord) {
      const k = t.dataset.ord;
      S.ordem = S.ordem.k === k ? { k, dir: -S.ordem.dir } : { k, dir: ['gasto', 'res', 'ctr', 'freq', 'con', 'orc'].includes(k) ? -1 : 1 };
      tabela(); return;
    }
    if (t.dataset.id) { S.aberta = t.dataset.id; detalhe(); return; }
    if (t.hasAttribute('data-fechar')) { fecharDet(); return; }
    if (t.id === 'atualizar') {
      t.disabled = true;
      try { await fetch('/api/meta/5g/atualizar', { method: 'POST' }); } catch (err) { /* o estado mostra */ }
      if (S.r) S.r.atualizando = true;
      estado(); agendar(4000);
    }
  });
  document.addEventListener('keydown', e => {
    const tr = e.target.closest && e.target.closest('tr[data-id]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); S.aberta = tr.dataset.id; detalhe(); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'f-busca') { S.f.busca = e.target.value; guarda.por('f', S.f); tabela(); }
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'f-produto') { S.f.produto = e.target.value; guarda.por('f', S.f); render(); }
  });
  const fecharDet = () => { S.aberta = null; const dlg = $('#det'); if (dlg.open) dlg.close(); };
  $('#det').addEventListener('close', () => { S.aberta = null; });

  let tRes;
  addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(graficos, 150); });

  /* ---------------- dados ao vivo ---------------- */
  let tBusca;
  function agendar(ms) { clearTimeout(tBusca); tBusca = setTimeout(buscar, ms); }
  async function buscar() {
    try {
      const res = await fetch('/api/meta/5g', { cache: 'no-store' });
      const r = await res.json();
      const mudou = !S.r || r.atualizadoEm !== S.r.atualizadoEm || !!r.dados !== !!(S.r && S.r.dados) || r.erro !== S.r.erro;
      S.offline = false; S.r = r;
      mudou ? render() : estado();
      agendar(r.atualizando ? 4000 : 30000);
    } catch (e) {
      S.offline = true; estado(); agendar(15000);
    }
  }
  buscar();
})();
