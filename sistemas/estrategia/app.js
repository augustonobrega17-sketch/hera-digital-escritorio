/* Lia · Estratégia & Planejamento
   Plano de marketing por cliente, SWOT, funil reverso e distribuição de verba. */
const { el, fmt, N, div } = H;

const STATUS = ['rascunho', 'aprovado', 'em execução', 'concluído'];
const seloStatus = s => el('span', { class: 'selo ' + ({ 'aprovado': 'info', 'em execução': 'ok', 'concluído': 'roxo' }[s] || 'alerta') }, s || 'rascunho');

const CAMPOS = [
  { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
  { k: 'status', rot: 'Status', tipo: 'select', opcoes: STATUS },
  { k: 'objetivo', rot: 'Objetivo de negócio', tipo: 'textarea', largo: true, dica: 'Ex.: faturar R$ 300 mil no trimestre' },
  { k: 'publico', rot: 'Público / persona', tipo: 'textarea', largo: true },
  { k: 'dor', rot: 'Dor principal do público', largo: true },
  { k: 'posicionamento', rot: 'Posicionamento', tipo: 'textarea', largo: true },
  { k: 'proposta', rot: 'Proposta de valor', largo: true },
  { k: 'canais', rot: 'Canais e divisão', tipo: 'textarea', largo: true },
  { k: 'orcamento', rot: 'Orçamento mensal (R$)', tipo: 'money' },
  { k: 'meta', rot: 'Meta (KPI)' },
  { k: 'prazo', rot: 'Prazo', tipo: 'date' },
  { k: 'forcas', rot: 'Forças', tipo: 'textarea' },
  { k: 'fraquezas', rot: 'Fraquezas', tipo: 'textarea' },
  { k: 'oportunidades', rot: 'Oportunidades', tipo: 'textarea' },
  { k: 'ameacas', rot: 'Ameaças', tipo: 'textarea' }
];

H.app({
  titulo: 'Estratégia & Planejamento', papel: 'Lia · o norte de cada cliente da Hera', emoji: '🧭', cor: '#8A5CFF',
  colecoes: ['planos'],
  abas: [
    { id: 'planos', nome: 'Planos de marketing', render: async m => {
      await H.crud(m, {
        col: 'planos', titulo: 'Planos de marketing', item: 'plano', botao: 'Novo plano',
        sub: 'Um plano por cliente: objetivo, público, posicionamento, canais, verba e meta.',
        campos: CAMPOS, novo: { status: 'rascunho' },
        resumo: l => H.kpis([
          { rot: 'Planos', val: l.length },
          { rot: 'Em execução', val: l.filter(p => p.status === 'em execução').length, cor: 'var(--verde)' },
          { rot: 'Verba planejada / mês', val: fmt.brl(l.reduce((s, p) => s + N(p.orcamento), 0)), cor: 'var(--ouro)' },
          { rot: 'Rascunhos', val: l.filter(p => !p.status || p.status === 'rascunho').length, cor: 'var(--rosa)' }
        ]),
        colunas: [
          { k: 'cliente', rot: 'Cliente' },
          { k: 'objetivo', rot: 'Objetivo', quebra: true },
          { k: 'orcamento', rot: 'Verba/mês', num: true, fmt: v => fmt.brl(v) },
          { k: 'meta', rot: 'Meta', quebra: true },
          { k: 'prazo', rot: 'Prazo', fmt: fmt.data },
          { k: 'status', rot: 'Status', fmt: seloStatus }
        ]
      });
    } },

    { id: 'swot', nome: 'SWOT & Posicionamento', render: async m => {
      const planos = await H.col('planos');
      m.appendChild(el('h2', {}, 'SWOT & Posicionamento'));
      m.appendChild(el('p', { class: 'sub' }, 'Escolha um plano para ver a matriz e a frase de posicionamento pronta para o briefing.'));
      if (!planos.length) { m.appendChild(el('div', { class: 'card vazio' }, 'Cadastre um plano na aba "Planos de marketing".')); return; }
      const sel = el('select', { style: 'max-width:360px', onchange: () => pinta() },
        planos.map(p => el('option', { value: p.id }, p.cliente || '(sem cliente)')));
      const area = el('div');
      m.append(el('div', { class: 'filtros' }, sel), area);
      function pinta() {
        const p = planos.find(x => x.id === sel.value) || planos[0];
        const q = (tit, txt, cor) => el('div', { class: 'card', style: `border-top:3px solid ${cor}` },
          el('h3', {}, tit), el('p', { style: 'margin:0;white-space:pre-wrap' }, txt || '—'));
        const frase = `Para ${p.publico || '[público]'}, que sofre com ${(p.dor || '[dor]').toLowerCase()}, ${p.cliente || '[marca]'} é ${p.posicionamento || '[posicionamento]'}, oferecendo ${(p.proposta || '[proposta de valor]').toLowerCase()}.`;
        area.innerHTML = '';
        area.append(
          el('div', { class: 'grade g2' },
            q('💪 Forças', p.forcas, 'var(--verde)'), q('⚠️ Fraquezas', p.fraquezas, 'var(--rosa)'),
            q('🚀 Oportunidades', p.oportunidades, 'var(--pavao)'), q('🛡️ Ameaças', p.ameacas, 'var(--ouro)')),
          el('div', { class: 'card', style: 'margin-top:14px' },
            el('h3', {}, 'Frase de posicionamento'),
            el('div', { class: 'saida' }, frase),
            el('div', { style: 'margin-top:10px;display:flex;gap:8px' },
              el('button', { class: 'btn', onclick: () => H.copiar(frase) }, 'Copiar frase'))));
      }
      pinta();
    } },

    { id: 'funil', nome: 'Funil reverso', render: m => {
      m.appendChild(el('h2', {}, 'Funil reverso'));
      m.appendChild(el('p', { class: 'sub' }, 'Parte da meta de faturamento e calcula quantas vendas, leads, cliques e quanto investimento são necessários.'));
      const v = { receita: 100000, ticket: 500, convVenda: 10, convLead: 8, cpc: 1.8 };
      const campos = [
        ['receita', 'Meta de faturamento (R$)'], ['ticket', 'Ticket médio (R$)'],
        ['convVenda', 'Lead → venda (%)'], ['convLead', 'Clique → lead (%)'], ['cpc', 'CPC médio (R$)']
      ];
      const saida = el('div');
      const form = el('div', { class: 'card linha-campos', style: 'margin-bottom:16px' }, campos.map(([k, r]) =>
        el('label', { class: 'campo' }, r, el('input', { type: 'number', step: 'any', value: v[k], oninput: e => { v[k] = N(e.target.value); calc(); } }))));
      m.append(form, saida);
      function calc() {
        const vendas = Math.ceil(div(v.receita, v.ticket));
        const leads = Math.ceil(div(vendas, v.convVenda / 100));
        const cliques = Math.ceil(div(leads, v.convLead / 100));
        const invest = cliques * v.cpc;
        saida.innerHTML = '';
        saida.append(
          H.kpis([
            { rot: 'Vendas necessárias', val: fmt.num(vendas) },
            { rot: 'Leads necessários', val: fmt.num(leads), cor: 'var(--pavao)' },
            { rot: 'Cliques necessários', val: fmt.num(cliques), cor: 'var(--rosa)' },
            { rot: 'Investimento em mídia', val: fmt.brl(invest), cor: 'var(--ouro)' },
            { rot: 'CPL esperado', val: fmt.brl2(div(invest, leads)) },
            { rot: 'ROAS projetado', val: fmt.x(div(v.receita, invest)), cor: div(v.receita, invest) >= 3 ? 'var(--verde)' : 'var(--rosa)' }
          ]),
          el('div', { class: 'card' }, el('h3', {}, 'O funil'),
            H.barras([{ rot: 'Cliques', val: cliques, cor: '#8A5CFF' }, { rot: 'Leads', val: leads, cor: '#12D6C5' }, { rot: 'Vendas', val: vendas, cor: '#FFB547' }])),
          el('p', { class: 'dica' }, 'Regra da casa: ROAS projetado abaixo de 3x pede ticket maior, conversão melhor ou meta mais realista.'));
      }
      calc();
    } },

    { id: 'verba', nome: 'Distribuição de verba', render: m => {
      m.appendChild(el('h2', {}, 'Distribuição de verba'));
      m.appendChild(el('p', { class: 'sub' }, 'Divida o orçamento por etapa do funil e por canal. A soma precisa dar 100%.'));
      const st = { total: 20000,
        funil: [['Topo · descoberta', 30], ['Meio · consideração', 30], ['Fundo · conversão', 40]],
        canais: [['Meta Ads', 45], ['Google Ads', 30], ['TikTok Ads', 10], ['LinkedIn Ads', 0], ['Conteúdo & SEO', 5], ['Reserva para testes', 10]] };
      const atualizadores = [];
      const atualiza = () => atualizadores.forEach(f => f());
      m.append(el('div', { class: 'card', style: 'margin-bottom:14px;max-width:320px' },
        el('label', { class: 'campo' }, 'Orçamento mensal (R$)', el('input', { type: 'number', value: st.total, oninput: e => { st.total = N(e.target.value); atualiza(); } }))));
      // monta uma vez; arrastar só troca os números, senão o controle soltaria no meio do gesto
      function bloco(tit, lista) {
        const selo = el('span', { class: 'selo' });
        atualizadores.push(() => {
          const soma = lista.reduce((s, x) => s + N(x[1]), 0);
          selo.textContent = soma + '%'; selo.className = 'selo ' + (soma === 100 ? 'ok' : 'ruim');
        });
        return el('div', { class: 'card' }, el('h3', {}, tit, ' ', selo),
          lista.map(x => {
            const val = el('span', { class: 'val' });
            atualizadores.push(() => { val.textContent = x[1] + '% · ' + fmt.brl(st.total * x[1] / 100); });
            return el('div', { class: 'barra', style: 'margin-bottom:8px' },
              el('span', { class: 'rot' }, x[0]),
              el('input', { type: 'range', min: 0, max: 100, value: x[1], oninput: e => { x[1] = N(e.target.value); atualiza(); } }),
              val);
          }));
      }
      m.appendChild(el('div', { class: 'grade g2' }, bloco('Por etapa do funil', st.funil), bloco('Por canal', st.canais)));
      atualiza();
    } }
  ]
});
