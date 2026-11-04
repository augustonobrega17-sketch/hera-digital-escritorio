/* ===========================================================
   hera.js — peças comuns dos sistemas da Hera Digital.

   Cada sistema (sistemas/<area>/app.js) só descreve as abas e chama
   estas peças: H.app, H.crud, H.quadro, H.tabela, H.kpis, H.barras,
   H.modal, H.checklist. Os dados ficam no servidor (H.col / H.salvar),
   numa pasta compartilhada por todos os sistemas.
   =========================================================== */
const H = (() => {

  /* ---------------- DOM ---------------- */
  function el(tag, props, ...filhos) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'style') n.style.cssText = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k === 'value') n.value = v;
      else if (k === 'checked') n.checked = !!v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const f of filhos.flat(Infinity)) {
      if (f == null || f === false) continue;
      n.appendChild(f instanceof Node ? f : document.createTextNode(String(f)));
    }
    return n;
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- formatos ---------------- */
  const N = v => Number(v) || 0;
  const fmt = {
    brl: v => N(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL',
           maximumFractionDigits: Math.abs(N(v)) >= 1000 || Number.isInteger(N(v)) ? 0 : 2 }),
    brl2: v => N(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    num: v => N(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
    dec: (v, c = 2) => N(v).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }),
    pct: (v, c = 1) => (N(v) * 100).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }) + '%',
    x: v => N(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'x',
    data: s => { if (!s) return '—'; const [a, m, d] = String(s).slice(0, 10).split('-'); return d ? `${d}/${m}/${a}` : s; },
    curta: s => { if (!s) return '—'; const [, m, d] = String(s).slice(0, 10).split('-'); return d ? `${d}/${m}` : s; }
  };
  /** divisão que não explode com zero */
  const div = (a, b) => (N(b) ? N(a) / N(b) : 0);
  const hoje = () => new Date().toISOString().slice(0, 10);
  const diasAte = s => s ? Math.round((new Date(s + 'T12:00') - new Date(hoje() + 'T12:00')) / 864e5) : null;
  const uid = (p = 'x') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------------- dados ---------------- */
  const cache = new Map();
  async function col(nome, fresco = false) {
    if (!fresco && cache.has(nome)) return cache.get(nome);
    const r = await fetch('/api/col/' + nome, { cache: 'no-store' });
    const d = await r.json();
    cache.set(nome, Array.isArray(d) ? d : []);
    return cache.get(nome);
  }
  async function salvar(nome, lista) {
    cache.set(nome, lista);
    const r = await fetch('/api/col/' + nome, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lista)
    });
    if (!r.ok) { toast('Não consegui salvar: ' + (await r.text())); return false; }
    return true;
  }
  async function exemplo(nome) {
    const r = await fetch('/api/col/' + nome, { method: 'DELETE' });
    cache.set(nome, await r.json());
    return cache.get(nome);
  }
  const clientes = async () => (await col('clientes', true)).map(c => c.nome).sort((a, b) => a.localeCompare(b));

  /* ---------------- avisos ---------------- */
  let tt;
  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = el('div', { class: 'toast' }); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600);
  }
  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); toast('Copiado!'); }
    catch (e) {
      const a = el('textarea', { style: 'position:fixed;left:-9999px' }); a.value = texto;
      document.body.appendChild(a); a.select();
      try { document.execCommand('copy'); toast('Copiado!'); } catch (e2) { toast('Selecione e copie o texto.'); }
      a.remove();
    }
  }

  /* ---------------- formulário em modal ---------------- */
  async function campoNo(c, v) {
    const val = v == null ? (c.padrao ?? '') : v;
    let inp;
    if (c.tipo === 'select' || c.tipo === 'cliente') {
      const ops = c.tipo === 'cliente' ? await clientes() : c.opcoes;
      inp = el('select', {}, (c.tipo === 'cliente' ? ['', ...ops] : ops).map(o =>
        el('option', { value: o, selected: String(o) === String(val) }, o || '— escolha —')));
      if (c.tipo === 'cliente' && val && !ops.includes(val)) inp.appendChild(el('option', { value: val, selected: true }, val));
    } else if (c.tipo === 'textarea') {
      inp = el('textarea', { rows: c.linhas || 3, placeholder: c.dica || '' }); inp.value = val;
    } else {
      const tipo = { number: 'number', money: 'number', date: 'date', cor: 'color' }[c.tipo] || 'text';
      inp = el('input', { type: tipo, step: c.tipo === 'money' ? '0.01' : (c.passo || 'any'),
                          placeholder: c.dica || '', value: val });
    }
    inp.dataset.k = c.k;
    inp.dataset.tipo = c.tipo || 'text';
    return el('label', { class: 'campo', style: c.largo ? 'grid-column:1/-1' : '' }, c.rot, inp);
  }

  /** abre um formulário. Resolve com os valores, ou null se cancelar. */
  function modal({ titulo, campos, valores = {}, ok = 'Salvar', apagar }) {
    return new Promise(async resolve => {
      const corpo = el('div', { class: 'linha-campos' });
      for (const c of campos) corpo.appendChild(await campoNo(c, valores[c.k]));
      const fechar = r => { fundo.remove(); resolve(r); };
      const ler = () => {
        const out = Object.assign({}, valores);
        corpo.querySelectorAll('[data-k]').forEach(i => {
          const t = i.dataset.tipo;
          out[i.dataset.k] = (t === 'number' || t === 'money') ? (i.value === '' ? 0 : Number(i.value)) : i.value;
        });
        return out;
      };
      const fundo = el('div', { class: 'fundo', onclick: e => { if (e.target === fundo) fechar(null); } },
        el('div', { class: 'modal' },
          el('h3', {}, titulo), corpo,
          el('div', { class: 'rodape' },
            apagar ? el('button', { class: 'btn perigo', style: 'margin-right:auto', onclick: () => fechar({ __apagar: true }) }, 'Apagar') : null,
            el('button', { class: 'btn fantasma', onclick: () => fechar(null) }, 'Cancelar'),
            el('button', { class: 'btn pri', onclick: () => fechar(ler()) }, ok))));
      document.body.appendChild(fundo);
      const primeiro = corpo.querySelector('input,select,textarea'); if (primeiro) primeiro.focus();
    });
  }
  function confirmar(texto) {
    return new Promise(resolve => {
      const fechar = r => { f.remove(); resolve(r); };
      const f = el('div', { class: 'fundo' }, el('div', { class: 'modal', style: 'width:min(420px,100%)' },
        el('p', {}, texto),
        el('div', { class: 'rodape' },
          el('button', { class: 'btn fantasma', onclick: () => fechar(false) }, 'Cancelar'),
          el('button', { class: 'btn pri', onclick: () => fechar(true) }, 'Confirmar'))));
      document.body.appendChild(f);
    });
  }

  /* ---------------- KPIs e barras ---------------- */
  const kpis = lista => el('div', { class: 'kpis' }, lista.map(k =>
    el('div', { class: 'kpi', style: k.cor ? `--k:${k.cor}` : '' },
      el('span', {}, k.rot), el('b', {}, k.val), k.sub ? el('small', {}, k.sub) : null)));

  function barras(dados, formato = fmt.num, cor) {
    const max = Math.max(1, ...dados.map(d => N(d.val)));
    if (!dados.length) return el('p', { class: 'dica' }, 'Sem dados ainda.');
    return el('div', { class: 'barras' }, dados.map(d =>
      el('div', { class: 'barra' },
        el('span', { class: 'rot', title: d.rot }, d.rot),
        el('span', { class: 'trilho' }, el('i', { style: `width:${Math.max(2, N(d.val) / max * 100)}%;background:${d.cor || cor || 'var(--cor)'}` })),
        el('span', { class: 'val' }, formato(d.val)))));
  }

  /* ---------------- tabela ---------------- */
  function tabela({ colunas, linhas, aoAbrir, vazio = 'Nada por aqui ainda.' }) {
    let ord = null, asc = true;
    const corpo = el('tbody');
    const pinta = () => {
      corpo.innerHTML = '';
      let ls = linhas.slice();
      if (ord) {
        const c = colunas.find(c => c.k === ord);
        const val = l => c.ordem ? c.ordem(l) : l[c.k];
        ls.sort((a, b) => {
          const x = val(a), y = val(b);
          const r = (typeof x === 'number' && typeof y === 'number') ? x - y : String(x ?? '').localeCompare(String(y ?? ''));
          return asc ? r : -r;
        });
      }
      if (!ls.length) { corpo.appendChild(el('tr', {}, el('td', { colspan: colunas.length + (aoAbrir ? 1 : 0), class: 'vazio' }, vazio))); return; }
      for (const l of ls) {
        corpo.appendChild(el('tr', {},
          colunas.map(c => {
            const v = c.fmt ? c.fmt(l[c.k], l) : (l[c.k] ?? '');
            return el('td', { class: c.num ? 'num' : '' }, c.quebra ? el('span', { class: 'wrap' }, v) : v);
          }),
          aoAbrir ? el('td', { class: 'num' }, el('button', { class: 'btn mini', onclick: () => aoAbrir(l) }, 'Editar')) : null));
      }
    };
    const cab = el('tr', {}, colunas.map(c => el('th', { class: c.num ? 'num' : '', onclick: () => {
      if (ord === c.k) asc = !asc; else { ord = c.k; asc = !c.num; }
      pinta();
    } }, c.rot)), aoAbrir ? el('th', {}) : null);
    pinta();
    return el('div', { class: 'tabwrap' }, el('table', {}, el('thead', {}, cab), corpo));
  }

  /* ---------------- filtro por cliente ---------------- */
  async function filtroCliente(aoMudar, atual = '') {
    const ops = await clientes();
    const s = el('select', { onchange: () => aoMudar(s.value) },
      el('option', { value: '' }, 'Todos os clientes'), ops.map(o => el('option', { value: o, selected: o === atual }, o)));
    return s;
  }

  /* ---------------- CRUD completo: lista + filtro + novo/editar ---------------- */
  /**
   * opts: col, titulo, sub, campos, colunas, novo (valores padrão), resumo(lista) -> node,
   *       porCliente (bool), extraAcoes [node]
   */
  async function crud(alvo, opts) {
    let filtro = '';
    const area = el('div');
    alvo.appendChild(area);

    async function editar(item) {
      const lista = await col(opts.col);
      const novo = !item;
      const r = await modal({ titulo: (novo ? 'Novo: ' : 'Editar: ') + (opts.item || opts.titulo),
                              campos: opts.campos, valores: item || Object.assign({ cliente: filtro }, opts.novo || {}),
                              apagar: !novo });
      if (!r) return;
      if (r.__apagar) {
        if (!(await confirmar('Apagar este item?'))) return;
        await salvar(opts.col, lista.filter(x => x.id !== item.id));
      } else if (novo) {
        r.id = uid(opts.col.slice(0, 2));
        await salvar(opts.col, [r, ...lista]);
      } else {
        await salvar(opts.col, lista.map(x => x.id === item.id ? r : x));
      }
      toast('Salvo.');
      pinta();
    }

    async function pinta() {
      const todos = await col(opts.col);
      const lista = filtro ? todos.filter(x => x.cliente === filtro) : todos;
      area.innerHTML = '';
      area.appendChild(el('div', { class: 'cab' },
        el('div', {}, el('h2', {}, opts.titulo), opts.sub ? el('p', { class: 'sub', style: 'margin:0' }, opts.sub) : null),
        el('div', { class: 'acoes' }, opts.extraAcoes || [],
          el('button', { class: 'btn pri', onclick: () => editar(null) }, '+ ' + (opts.botao || 'Novo')))));
      if (opts.porCliente !== false)
        area.appendChild(el('div', { class: 'filtros' }, await filtroCliente(v => { filtro = v; pinta(); }, filtro)));
      if (opts.resumo) area.appendChild(opts.resumo(lista));
      area.appendChild(tabela({ colunas: opts.colunas, linhas: lista, aoAbrir: editar }));
    }
    await pinta();
    return { pinta, editar };
  }

  /* ---------------- quadro kanban ---------------- */
  /** opts: col, titulo, sub, campos, etapas, campo (padrão 'etapa'), ficha(item) -> nodes, novo, resumo */
  async function quadro(alvo, opts) {
    const campo = opts.campo || 'etapa';
    let filtro = '';
    const area = el('div');
    alvo.appendChild(area);

    async function mover(item, etapa) {
      const lista = await col(opts.col);
      await salvar(opts.col, lista.map(x => x.id === item.id ? Object.assign({}, x, { [campo]: etapa }) : x));
      if (opts.aoMover) await opts.aoMover(item, etapa);
      pinta();
    }
    async function editar(item, etapa) {
      const lista = await col(opts.col);
      const novo = !item;
      const r = await modal({ titulo: (novo ? 'Novo: ' : 'Editar: ') + (opts.item || opts.titulo),
                              campos: opts.campos,
                              valores: item || Object.assign({ cliente: filtro, [campo]: etapa || opts.etapas[0] }, opts.novo || {}),
                              apagar: !novo });
      if (!r) return;
      if (r.__apagar) {
        if (!(await confirmar('Apagar este item?'))) return;
        await salvar(opts.col, lista.filter(x => x.id !== item.id));
      } else if (novo) { r.id = uid(opts.col.slice(0, 2)); await salvar(opts.col, [r, ...lista]); }
      else await salvar(opts.col, lista.map(x => x.id === item.id ? r : x));
      if (!r.__apagar && opts.aoMover && (!item || item[campo] !== r[campo])) await opts.aoMover(r, r[campo]);
      toast('Salvo.');
      pinta();
    }

    async function pinta() {
      const todos = await col(opts.col);
      const lista = filtro ? todos.filter(x => x.cliente === filtro) : todos;
      area.innerHTML = '';
      area.appendChild(el('div', { class: 'cab' },
        el('div', {}, el('h2', {}, opts.titulo), opts.sub ? el('p', { class: 'sub', style: 'margin:0' }, opts.sub) : null),
        el('div', { class: 'acoes' }, el('button', { class: 'btn pri', onclick: () => editar(null) }, '+ ' + (opts.botao || 'Novo')))));
      if (opts.porCliente !== false)
        area.appendChild(el('div', { class: 'filtros' }, await filtroCliente(v => { filtro = v; pinta(); }, filtro)));
      if (opts.resumo) area.appendChild(opts.resumo(lista));

      const kb = el('div', { class: 'kanban' });
      opts.etapas.forEach((et, i) => {
        const itens = lista.filter(x => (x[campo] || opts.etapas[0]) === et);
        const colN = el('div', { class: 'coluna',
          ondragover: e => { e.preventDefault(); colN.classList.add('alvo'); },
          ondragleave: () => colN.classList.remove('alvo'),
          ondrop: e => {
            e.preventDefault(); colN.classList.remove('alvo');
            const it = lista.find(x => x.id === e.dataTransfer.getData('text/plain'));
            if (it && it[campo] !== et) mover(it, et);
          } },
          el('h4', {}, et, el('em', {}, itens.length)),
          itens.map(it => el('div', { class: 'ficha', draggable: 'true',
              ondragstart: e => e.dataTransfer.setData('text/plain', it.id),
              ondblclick: () => editar(it) },
            opts.ficha(it),
            el('div', { class: 'mover' },
              i > 0 ? el('button', { class: 'btn mini fantasma', title: 'Voltar etapa', onclick: () => mover(it, opts.etapas[i - 1]) }, '◀') : null,
              el('button', { class: 'btn mini fantasma', onclick: () => editar(it) }, 'Abrir'),
              i < opts.etapas.length - 1 ? el('button', { class: 'btn mini fantasma', title: 'Avançar etapa', onclick: () => mover(it, opts.etapas[i + 1]) }, '▶') : null))),
          el('button', { class: 'btn mini fantasma', style: 'width:100%', onclick: () => editar(null, et) }, '+ adicionar'));
        kb.appendChild(colN);
      });
      area.appendChild(kb);
      area.appendChild(el('p', { class: 'dica' }, 'Arraste as fichas entre as colunas ou use ◀ ▶.'));
    }
    await pinta();
    return { pinta };
  }

  /* ---------------- checklist (lembra no navegador) ---------------- */
  function checklist(chave, itens) {
    const k = 'hera-check-' + SISTEMA.id + '-' + chave;
    let feitos = {};
    try { feitos = JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { /* sem storage */ }
    const grava = () => { try { localStorage.setItem(k, JSON.stringify(feitos)); } catch (e) {} };
    const caixa = el('div', { class: 'lista-check' });
    itens.forEach((txt, i) => {
      const lb = el('label', { class: feitos[i] ? 'feito' : '' },
        el('input', { type: 'checkbox', checked: !!feitos[i], onchange: e => {
          feitos[i] = e.target.checked; lb.classList.toggle('feito', e.target.checked); grava();
        } }), el('span', {}, txt));
      caixa.appendChild(lb);
    });
    caixa.appendChild(el('button', { class: 'btn mini fantasma', style: 'margin-top:10px', onclick: () => {
      feitos = {}; grava(); caixa.querySelectorAll('input').forEach(i => { i.checked = false; i.parentNode.classList.remove('feito'); });
    } }, 'Desmarcar tudo'));
    return caixa;
  }

  /* ---------------- marca ---------------- */
  const SIMBOLO = `<svg viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="hs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A5CFF"/><stop offset=".55" stop-color="#5B2EE8"/><stop offset="1" stop-color="#12D6C5"/></linearGradient></defs><rect x="4" y="4" width="88" height="88" rx="28" fill="url(#hs)"/><rect x="18" y="21" width="12" height="54" rx="6" fill="#F5F2FF"/><rect x="66" y="21" width="12" height="54" rx="6" fill="#F5F2FF"/><rect x="28" y="49" width="40" height="7" rx="3.5" fill="#F5F2FF"/><path d="M48 25.5C56 34 60.5 41.5 60.5 50.5a12.5 12.5 0 0 1-25 0C35.5 41.5 40 34 48 25.5Z" fill="#FFB547" stroke="#0F0A24" stroke-width="3"/><circle cx="48" cy="51" r="6.4" fill="#12D6C5"/><circle cx="48" cy="51" r="2.9" fill="#0F0A24"/></svg>`;

  /* ---------------- casca do sistema ---------------- */
  /**
   * cfg: titulo, papel, emoji, cor, abas [{id, nome, render(main)}],
   *      colecoes [nomes que este sistema é dono, para o botão de dados de exemplo]
   */
  function app(cfg) {
    if (cfg.cor) document.documentElement.style.setProperty('--cor', cfg.cor);
    document.title = cfg.titulo + ' · Hera Digital';
    const raiz = document.getElementById('app');
    const mainEl = el('main');
    const abasEl = el('nav', { class: 'abas' });
    raiz.append(
      el('header', { class: 'topo' },
        el('span', { html: SIMBOLO }),
        el('div', { class: 'quem' }, el('b', {}, (cfg.emoji ? cfg.emoji + ' ' : '') + cfg.titulo), el('span', {}, cfg.papel)),
        el('div', { class: 'marca' }, 'hera', el('i', {}, '.'), ' digital')),
      abasEl, mainEl);

    let atual = null;
    async function abre(id) {
      const aba = cfg.abas.find(a => a.id === id) || cfg.abas[0];
      atual = aba.id;
      try { localStorage.setItem('hera-aba-' + SISTEMA.id, aba.id); } catch (e) {}
      abasEl.querySelectorAll('.aba').forEach(b => b.classList.toggle('on', b.dataset.id === aba.id));
      mainEl.innerHTML = '';
      if (cfg.colecoes && cfg.colecoes.length) {
        mainEl.appendChild(el('div', { class: 'aviso-ex no-print' },
          el('span', {}, el('b', {}, 'Dica: '), 'os clientes e números de exemplo são fictícios. Edite, apague ou troque pelos seus.'),
          el('button', { class: 'btn mini fantasma', onclick: async () => {
            if (!(await confirmar('Apagar TODOS os itens deste sistema e começar do zero?'))) return;
            for (const c of cfg.colecoes) await salvar(c, []);
            toast('Pronto, tudo limpo.'); abre(atual);
          } }, 'Começar do zero'),
          el('button', { class: 'btn mini fantasma', onclick: async () => {
            if (!(await confirmar('Voltar aos dados de exemplo? O que você cadastrou neste sistema será substituído.'))) return;
            for (const c of cfg.colecoes) await exemplo(c);
            toast('Dados de exemplo de volta.'); abre(atual);
          } }, 'Restaurar exemplo')));
      }
      try { await aba.render(mainEl); }
      catch (e) { mainEl.appendChild(el('div', { class: 'card' }, 'Algo deu errado nesta aba: ' + e.message)); console.error(e); }
    }
    cfg.abas.forEach(a => abasEl.appendChild(el('button', { class: 'aba', 'data-id': a.id, onclick: () => abre(a.id) }, a.nome)));
    let ultima = null;
    try { ultima = localStorage.getItem('hera-aba-' + SISTEMA.id); } catch (e) {}
    abre(ultima);
    return { abre };
  }

  return { el, esc, fmt, div, N, hoje, diasAte, uid, col, salvar, exemplo, clientes, toast, copiar,
           modal, confirmar, kpis, barras, tabela, filtroCliente, crud, quadro, checklist, app, SIMBOLO };
})();
