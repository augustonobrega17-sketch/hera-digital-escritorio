/* Léo · Gestão de Tráfego Pago
   Campanhas com métricas calculadas, alertas, visão por plataforma e calculadoras. */
const { el, fmt, N, div } = H;

const PLATAFORMAS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'YouTube Ads', 'Pinterest Ads'];
const COR_PLAT = { 'Meta Ads': '#8A5CFF', 'Google Ads': '#12D6C5', 'TikTok Ads': '#FF4F8B', 'LinkedIn Ads': '#5B9BFF', 'YouTube Ads': '#FF8A3D', 'Pinterest Ads': '#FFB547' };

/** métricas derivadas de uma campanha */
const met = c => ({
  ctr: div(c.cliques, c.impressoes), cpc: div(c.investido, c.cliques), cpl: div(c.investido, c.leads),
  cpa: div(c.investido, c.vendas), roas: div(c.receita, c.investido)
});
const seloRoas = (r, meta) => el('span', { class: 'selo ' + (!r ? '' : r >= N(meta) ? 'ok' : r >= N(meta) * .7 ? 'alerta' : 'ruim') }, r ? fmt.x(r) : '—');
const seloStatus = s => el('span', { class: 'selo ' + ({ ativa: 'ok', pausada: 'alerta', encerrada: '' }[s] || '') }, s);

const CAMPOS = [
  { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
  { k: 'plataforma', rot: 'Plataforma', tipo: 'select', opcoes: PLATAFORMAS },
  { k: 'nome', rot: 'Nome da campanha', largo: true, dica: 'Ex.: Leads | Implante | Lookalike 1%' },
  { k: 'objetivo', rot: 'Objetivo', tipo: 'select', opcoes: ['Vendas', 'Leads', 'Tráfego', 'Reconhecimento', 'Engajamento', 'Mensagens'] },
  { k: 'status', rot: 'Status', tipo: 'select', opcoes: ['ativa', 'pausada', 'encerrada'] },
  { k: 'orcDia', rot: 'Orçamento diário (R$)', tipo: 'money' },
  { k: 'investido', rot: 'Investido no período (R$)', tipo: 'money' },
  { k: 'impressoes', rot: 'Impressões', tipo: 'number' },
  { k: 'cliques', rot: 'Cliques', tipo: 'number' },
  { k: 'leads', rot: 'Leads', tipo: 'number' },
  { k: 'vendas', rot: 'Vendas', tipo: 'number' },
  { k: 'receita', rot: 'Receita gerada (R$)', tipo: 'money' },
  { k: 'roasMeta', rot: 'ROAS meta (x)', tipo: 'number' }
];

function totais(l) {
  const t = l.reduce((a, c) => { for (const k of ['investido', 'impressoes', 'cliques', 'leads', 'vendas', 'receita']) a[k] += N(c[k]); return a; },
    { investido: 0, impressoes: 0, cliques: 0, leads: 0, vendas: 0, receita: 0 });
  return Object.assign(t, met(t));
}

/** regras de alerta: o que um gestor de tráfego olharia primeiro de manhã */
function alertasDe(lista) {
  const ativas = lista.filter(c => c.status === 'ativa');
  const cplMedio = div(ativas.reduce((s, c) => s + N(c.investido), 0), ativas.reduce((s, c) => s + N(c.leads), 0));
  const out = [];
  for (const c of ativas) {
    const m = met(c);
    if (N(c.receita) > 0 && N(c.roasMeta) && m.roas < N(c.roasMeta))
      out.push({ n: 3, ic: '🔴', t: `${c.nome} (${c.cliente}): ROAS ${fmt.x(m.roas)} abaixo da meta de ${fmt.x(c.roasMeta)}. Revisar público, criativo e oferta.` });
    if (N(c.impressoes) > 5000 && m.ctr < .01)
      out.push({ n: 2, ic: '🟠', t: `${c.nome}: CTR de ${fmt.pct(m.ctr, 2)}. Abaixo de 1% costuma ser criativo cansado ou público errado. Testar novos ganchos.` });
    if (N(c.leads) > 0 && cplMedio && m.cpl > cplMedio * 1.6)
      out.push({ n: 2, ic: '🟠', t: `${c.nome}: CPL de ${fmt.brl2(m.cpl)}, bem acima da média da casa (${fmt.brl2(cplMedio)}).` });
    if (N(c.leads) > 50 && !N(c.vendas))
      out.push({ n: 2, ic: '🟡', t: `${c.nome}: ${c.leads} leads e nenhuma venda registrada. Falar com o comercial do cliente sobre a qualidade dos leads.` });
    if (N(c.roasMeta) && m.roas >= N(c.roasMeta) * 1.5)
      out.push({ n: 1, ic: '🟢', t: `${c.nome}: ROAS ${fmt.x(m.roas)}, 50% acima da meta. Candidata a escalar o orçamento em 20%.` });
  }
  for (const c of lista.filter(c => c.status === 'pausada' && N(c.roasMeta) && met(c).roas >= N(c.roasMeta)))
    out.push({ n: 1, ic: '🔵', t: `${c.nome} está pausada, mas bateu a meta. Vale reativar?` });
  return out.sort((a, b) => b.n - a.n);
}

H.app({
  titulo: 'Gestão de Tráfego Pago', papel: 'Léo · Meta, Google e TikTok Ads de olho em CAC e ROAS', emoji: '🎯', cor: '#12D6C5',
  colecoes: ['campanhas'],
  abas: [
    { id: 'campanhas', nome: 'Campanhas', render: async m => {
      await H.crud(m, {
        col: 'campanhas', titulo: 'Campanhas', item: 'campanha', botao: 'Nova campanha',
        sub: 'Lance os números do período. CTR, CPC, CPL, CPA e ROAS são calculados sozinhos.',
        campos: CAMPOS, novo: { plataforma: 'Meta Ads', objetivo: 'Leads', status: 'ativa', roasMeta: 3 },
        resumo: l => { const t = totais(l); return H.kpis([
          { rot: 'Investido', val: fmt.brl(t.investido), cor: 'var(--ouro)' },
          { rot: 'Receita gerada', val: fmt.brl(t.receita), cor: 'var(--verde)' },
          { rot: 'ROAS geral', val: fmt.x(t.roas), cor: 'var(--pavao)' },
          { rot: 'Leads', val: fmt.num(t.leads), sub: 'CPL ' + fmt.brl2(t.cpl) },
          { rot: 'Vendas', val: fmt.num(t.vendas), sub: 'CPA ' + fmt.brl2(t.cpa) },
          { rot: 'CTR médio', val: fmt.pct(t.ctr, 2), cor: 'var(--rosa)' }
        ]); },
        colunas: [
          { k: 'cliente', rot: 'Cliente' },
          { k: 'plataforma', rot: 'Plataforma', fmt: v => el('span', { class: 'selo', style: `background:${COR_PLAT[v] || '#555'}33;color:${COR_PLAT[v] || '#ddd'}` }, v) },
          { k: 'nome', rot: 'Campanha', quebra: true },
          { k: 'status', rot: 'Status', fmt: seloStatus },
          { k: 'investido', rot: 'Investido', num: true, fmt: v => fmt.brl(v) },
          { k: 'ctr', rot: 'CTR', num: true, ordem: c => met(c).ctr, fmt: (v, c) => fmt.pct(met(c).ctr, 2) },
          { k: 'cpc', rot: 'CPC', num: true, ordem: c => met(c).cpc, fmt: (v, c) => fmt.brl2(met(c).cpc) },
          { k: 'leads', rot: 'Leads', num: true, fmt: fmt.num },
          { k: 'cpl', rot: 'CPL', num: true, ordem: c => met(c).cpl, fmt: (v, c) => N(c.leads) ? fmt.brl2(met(c).cpl) : '—' },
          { k: 'vendas', rot: 'Vendas', num: true, fmt: fmt.num },
          { k: 'receita', rot: 'Receita', num: true, fmt: v => fmt.brl(v) },
          { k: 'roas', rot: 'ROAS', num: true, ordem: c => met(c).roas, fmt: (v, c) => seloRoas(met(c).roas, c.roasMeta) }
        ]
      });
    } },

    { id: 'alertas', nome: 'Alertas do dia', render: async m => {
      const lista = await H.col('campanhas', true);
      const al = alertasDe(lista);
      m.append(el('h2', {}, 'Alertas do dia'),
        el('p', { class: 'sub' }, 'O que olhar primeiro: campanhas abaixo da meta, criativos cansados, leads sem venda e quem merece mais verba.'),
        el('div', { class: 'card' }, al.length ? al.map(a => el('div', { class: 'insight' }, el('i', {}, a.ic), el('span', {}, a.t)))
                                               : el('p', { class: 'vazio' }, 'Tudo dentro da meta. Bom trabalho! 🎉')));
    } },

    { id: 'plataformas', nome: 'Por plataforma e cliente', render: async m => {
      const lista = await H.col('campanhas', true);
      const agrupa = chave => Object.entries(lista.reduce((a, c) => ((a[c[chave]] = a[c[chave]] || []).push(c), a), {}))
        .map(([k, cs]) => ({ k, t: totais(cs) }));
      const pl = agrupa('plataforma'), cl = agrupa('cliente');
      m.append(el('h2', {}, 'Por plataforma e cliente'), el('p', { class: 'sub' }, 'Onde está a verba e onde ela rende mais.'),
        el('div', { class: 'grade g2' },
          el('div', { class: 'card' }, el('h3', {}, 'Investimento por plataforma'),
            H.barras(pl.map(p => ({ rot: p.k, val: p.t.investido, cor: COR_PLAT[p.k] })), fmt.brl)),
          el('div', { class: 'card' }, el('h3', {}, 'ROAS por plataforma'),
            H.barras(pl.map(p => ({ rot: p.k, val: p.t.roas, cor: COR_PLAT[p.k] })), fmt.x)),
          el('div', { class: 'card' }, el('h3', {}, 'Investimento por cliente'),
            H.barras(cl.sort((a, b) => b.t.investido - a.t.investido).map(p => ({ rot: p.k, val: p.t.investido })), fmt.brl, '#FFB547')),
          el('div', { class: 'card' }, el('h3', {}, 'Leads por cliente'),
            H.barras(cl.sort((a, b) => b.t.leads - a.t.leads).map(p => ({ rot: p.k, val: p.t.leads })), fmt.num, '#12D6C5'))));
    } },

    { id: 'calc', nome: 'Calculadoras', render: m => {
      m.append(el('h2', {}, 'Calculadoras'), el('p', { class: 'sub' }, 'Contas que todo gestor de tráfego faz antes de subir uma campanha.'));
      const a = { preco: 297, margem: 40 }, b = { meta: 300, cpl: 18, dias: 30 };
      const sa = el('div'), sb = el('div');
      const inp = (o, k, rot, f) => el('label', { class: 'campo' }, rot, el('input', { type: 'number', step: 'any', value: o[k], oninput: e => { o[k] = N(e.target.value); f(); } }));
      const ca = () => { sa.innerHTML = ''; sa.append(H.kpis([
        { rot: 'ROAS mínimo (empate)', val: fmt.x(div(100, a.margem)), cor: 'var(--rosa)', sub: 'abaixo disso a venda dá prejuízo' },
        { rot: 'CPA máximo', val: fmt.brl2(a.preco * a.margem / 100), cor: 'var(--ouro)', sub: 'quanto pode custar cada venda' }])); };
      const cb = () => { sb.innerHTML = ''; const total = b.meta * b.cpl; sb.append(H.kpis([
        { rot: 'Investimento total', val: fmt.brl(total), cor: 'var(--ouro)' },
        { rot: 'Orçamento diário', val: fmt.brl2(div(total, b.dias)), cor: 'var(--pavao)' },
        { rot: 'Leads por dia', val: fmt.dec(div(b.meta, b.dias), 1) }])); };
      m.appendChild(el('div', { class: 'grade g2' },
        el('div', { class: 'card' }, el('h3', {}, 'ROAS de empate e CPA máximo'),
          el('div', { class: 'linha-campos' }, inp(a, 'preco', 'Preço do produto (R$)', ca), inp(a, 'margem', 'Margem de lucro (%)', ca)), sa),
        el('div', { class: 'card' }, el('h3', {}, 'Orçamento para uma meta de leads'),
          el('div', { class: 'linha-campos' }, inp(b, 'meta', 'Meta de leads', cb), inp(b, 'cpl', 'CPL esperado (R$)', cb), inp(b, 'dias', 'Dias de campanha', cb)), sb)));
      ca(); cb();
    } }
  ]
});
