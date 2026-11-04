/* Rafa · Comercial & Prospecção
   Funil de vendas da própria Hera, gerador de proposta e métricas comerciais.
   Lead que vai para "Fechado" entra sozinho na carteira de clientes da Bia. */
const { el, fmt, N, div } = H;

const ETAPAS = ['Lead', 'Contato feito', 'Reunião', 'Proposta', 'Negociação', 'Fechado', 'Perdido'];
const CHANCE = { 'Lead': .05, 'Contato feito': .1, 'Reunião': .25, 'Proposta': .45, 'Negociação': .7, 'Fechado': 1, 'Perdido': 0 };
const ORIGENS = ['Indicação', 'Instagram', 'Site', 'Google', 'Prospecção ativa', 'LinkedIn', 'Evento', 'Cliente antigo'];

/* tabela de preços da Hera Digital (ajuste aqui) */
const SERVICOS = [
  { id: 'trafego',  nome: 'Gestão de tráfego pago (Meta + Google)', preco: 2500, tipo: 'mensal' },
  { id: 'social',   nome: 'Social media (12 posts + stories)',      preco: 2200, tipo: 'mensal' },
  { id: 'video',    nome: 'Produção e edição de vídeo (4 reels)',   preco: 1800, tipo: 'mensal' },
  { id: 'seo',      nome: 'SEO e blog (4 artigos)',                 preco: 1800, tipo: 'mensal' },
  { id: 'email',    nome: 'E-mail marketing e automação',           preco: 1200, tipo: 'mensal' },
  { id: 'bi',       nome: 'Painel de dados e relatório mensal',     preco: 900,  tipo: 'mensal' },
  { id: 'estrat',   nome: 'Planejamento estratégico (trimestral)',  preco: 3500, tipo: 'único' },
  { id: 'marca',    nome: 'Identidade visual completa',             preco: 4500, tipo: 'único' },
  { id: 'lp',       nome: 'Landing page de conversão',              preco: 3000, tipo: 'único' },
  { id: 'site',     nome: 'Site institucional',                     preco: 6500, tipo: 'único' }
];

const plano = fee => fee >= 10000 ? 'Premium' : fee >= 5000 ? 'Crescimento' : 'Essencial';

/** fechou negócio: vira cliente na carteira (se ainda não estiver lá) */
async function viraCliente(lead) {
  const clientes = await H.col('clientes', true);
  if (clientes.some(c => c.nome.toLowerCase() === String(lead.empresa).toLowerCase())) return;
  const em7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  await H.salvar('clientes', [...clientes, {
    id: H.uid('c'), nome: lead.empresa, segmento: lead.segmento || '', plano: plano(N(lead.valor)), fee: N(lead.valor),
    inicio: H.hoje(), saude: 'ótima', contato: lead.contato || '', proximoContato: em7, servicos: lead.servicos || '', nps: 0
  }]);
  H.toast(`🎉 ${lead.empresa} agora é cliente da Hera! Já está na carteira da Bia.`);
}

H.app({
  titulo: 'Comercial & Prospecção', papel: 'Rafa · o funil de vendas da própria Hera Digital', emoji: '💼', cor: '#FF6FAE',
  colecoes: ['pipeline'],
  abas: [
    { id: 'funil', nome: 'Funil de vendas', render: async m => {
      await H.quadro(m, {
        col: 'pipeline', titulo: 'Funil de vendas', item: 'oportunidade', botao: 'Nova oportunidade', etapas: ETAPAS, porCliente: false,
        sub: 'Arraste até "Fechado" e a empresa entra sozinha na carteira de clientes.',
        campos: [
          { k: 'empresa', rot: 'Empresa', largo: true },
          { k: 'contato', rot: 'Contato' },
          { k: 'segmento', rot: 'Segmento' },
          { k: 'origem', rot: 'Origem', tipo: 'select', opcoes: ORIGENS },
          { k: 'valor', rot: 'Fee mensal estimado (R$)', tipo: 'money' },
          { k: 'etapa', rot: 'Etapa', tipo: 'select', opcoes: ETAPAS },
          { k: 'data', rot: 'Data do próximo passo', tipo: 'date' },
          { k: 'proximoPasso', rot: 'Próximo passo', largo: true },
          { k: 'servicos', rot: 'Serviços de interesse', largo: true }
        ],
        novo: { origem: 'Instagram', data: H.hoje() },
        aoMover: async (lead, etapa) => {
          if (etapa === 'Fechado') {
            const atual = (await H.col('pipeline')).find(x => x.id === lead.id) || lead;
            await viraCliente(atual);
          }
        },
        resumo: l => {
          const abertos = l.filter(x => !['Fechado', 'Perdido'].includes(x.etapa));
          return H.kpis([
            { rot: 'Em negociação', val: abertos.length },
            { rot: 'Pipeline (MRR)', val: fmt.brl(abertos.reduce((s, x) => s + N(x.valor), 0)), cor: 'var(--ouro)' },
            { rot: 'Previsão ponderada', val: fmt.brl(abertos.reduce((s, x) => s + N(x.valor) * (CHANCE[x.etapa] || 0), 0)), cor: 'var(--pavao)', sub: 'valor × chance de fechar' },
            { rot: 'Fechados', val: l.filter(x => x.etapa === 'Fechado').length, cor: 'var(--verde)' }
          ]);
        },
        ficha: x => [
          el('b', {}, x.empresa || '(sem nome)'),
          el('div', { class: 'meta' }, fmt.brl(x.valor) + '/mês', '·', x.origem),
          el('div', { class: 'meta', style: 'margin-top:4px' }, '→ ' + (x.proximoPasso || '—')),
          el('div', { class: 'meta', style: 'margin-top:2px' }, x.contato || '', x.data ? '· ' + fmt.curta(x.data) : '',
            !['Fechado', 'Perdido'].includes(x.etapa) && H.diasAte(x.data) < 0 ? el('span', { class: 'selo ruim' }, 'atrasado') : null)
        ]
      });
    } },

    { id: 'proposta', nome: 'Gerador de proposta', render: async m => {
      const leads = (await H.col('pipeline', true)).filter(x => !['Fechado', 'Perdido'].includes(x.etapa));
      const st = { empresa: leads[0] ? leads[0].empresa : '', contato: leads[0] ? leads[0].contato : '', desconto: 0, meses: 6,
                   marcados: new Set(['trafego', 'social']) };
      const saida = el('div');
      const empresaInp = el('input', { value: st.empresa, oninput: e => { st.empresa = e.target.value; pinta(); } });
      const contatoInp = el('input', { value: st.contato, oninput: e => { st.contato = e.target.value; pinta(); } });
      const selLead = el('select', { onchange: () => {
        const l = leads.find(x => x.id === selLead.value); if (!l) return;
        st.empresa = l.empresa; st.contato = l.contato; empresaInp.value = l.empresa; contatoInp.value = l.contato || ''; pinta();
      } }, el('option', { value: '' }, 'Puxar de uma oportunidade…'), leads.map(l => el('option', { value: l.id }, l.empresa)));
      m.append(el('h2', {}, 'Gerador de proposta'),
        el('p', { class: 'sub' }, 'Marque os serviços, aplique desconto e copie a proposta pronta. Os preços ficam no topo do app.js deste sistema.'),
        el('div', { class: 'grade g2 no-print' },
          el('div', { class: 'card' },
            el('div', { class: 'filtros' }, selLead),
            el('div', { class: 'linha-campos' },
              el('label', { class: 'campo' }, 'Empresa', empresaInp), el('label', { class: 'campo' }, 'Contato', contatoInp),
              el('label', { class: 'campo' }, 'Desconto (%)', el('input', { type: 'number', value: 0, oninput: e => { st.desconto = N(e.target.value); pinta(); } })),
              el('label', { class: 'campo' }, 'Contrato (meses)', el('input', { type: 'number', value: 6, oninput: e => { st.meses = N(e.target.value); pinta(); } })))),
          el('div', { class: 'card lista-check' }, SERVICOS.map(s => el('label', {},
            el('input', { type: 'checkbox', checked: st.marcados.has(s.id), onchange: e => { e.target.checked ? st.marcados.add(s.id) : st.marcados.delete(s.id); pinta(); } }),
            el('span', { style: 'flex:1' }, s.nome), el('b', {}, fmt.brl(s.preco) + (s.tipo === 'mensal' ? '/mês' : ' único')))))),
        saida);
      function pinta() {
        const sel = SERVICOS.filter(s => st.marcados.has(s.id));
        const mensal = sel.filter(s => s.tipo === 'mensal').reduce((a, s) => a + s.preco, 0);
        const unico = sel.filter(s => s.tipo === 'único').reduce((a, s) => a + s.preco, 0);
        const f = 1 - st.desconto / 100;
        const mensalF = mensal * f, unicoF = unico * f;
        const validade = new Date(Date.now() + 15 * 864e5).toLocaleDateString('pt-BR');
        const txt = [
          `PROPOSTA COMERCIAL · HERA DIGITAL`,
          `Para: ${st.empresa || '[empresa]'}${st.contato ? ' · A/C ' + st.contato : ''}`,
          `Data: ${new Date().toLocaleDateString('pt-BR')} · Válida até ${validade}`, '',
          `${st.contato ? st.contato.split(' ')[0] : 'Olá'}, obrigado pela conversa! A Hera Digital une estratégia, criatividade e dados para fazer a ${st.empresa || 'sua empresa'} crescer com previsibilidade. Esta é a nossa proposta:`, '',
          'O QUE ESTÁ INCLUÍDO',
          ...sel.map(s => `• ${s.nome}: ${fmt.brl(s.preco * f)}${s.tipo === 'mensal' ? '/mês' : ' (pagamento único)'}`), '',
          'INVESTIMENTO',
          mensal ? `• Mensal: ${fmt.brl(mensalF)}/mês por ${st.meses} meses` : null,
          unico ? `• Projetos únicos: ${fmt.brl(unicoF)}` : null,
          st.desconto ? `• Já com ${st.desconto}% de desconto` : null,
          `• Total do contrato: ${fmt.brl(mensalF * st.meses + unicoF)}`,
          '• O investimento em mídia (anúncios) é pago direto às plataformas e não está incluso.', '',
          'COMO TRABALHAMOS',
          '• Semana 1: diagnóstico, acessos e planejamento',
          '• Semana 2: criação e aprovação das primeiras peças',
          '• A partir da semana 3: campanhas no ar e otimização contínua',
          '• Todo mês: relatório de resultados e reunião de alinhamento', '',
          'Ficamos à disposição para ajustar qualquer ponto.',
          'Hera Digital · Cem olhos no seu crescimento.'
        ].filter(x => x !== null).join('\n');
        saida.innerHTML = '';
        saida.append(
          H.kpis([
            { rot: 'Mensal', val: fmt.brl(mensalF), cor: 'var(--ouro)' },
            { rot: 'Projetos únicos', val: fmt.brl(unicoF), cor: 'var(--pavao)' },
            { rot: `Contrato (${st.meses} meses)`, val: fmt.brl(mensalF * st.meses + unicoF), cor: 'var(--verde)' }
          ]),
          el('div', { class: 'filtros no-print' },
            el('button', { class: 'btn', onclick: () => H.copiar(txt) }, 'Copiar proposta'),
            el('button', { class: 'btn', onclick: () => window.print() }, 'Imprimir / PDF')),
          el('div', { class: 'saida' }, txt));
      }
      pinta();
    } },

    { id: 'metricas', nome: 'Métricas comerciais', render: async m => {
      const l = await H.col('pipeline', true);
      const fech = l.filter(x => x.etapa === 'Fechado'), perd = l.filter(x => x.etapa === 'Perdido');
      const porOrigem = ORIGENS.map(o => ({ rot: o, val: l.filter(x => x.origem === o).length })).filter(x => x.val);
      const porEtapa = ETAPAS.map(e => ({ rot: e, val: l.filter(x => x.etapa === e).reduce((s, x) => s + N(x.valor), 0) }));
      m.append(el('h2', {}, 'Métricas comerciais'), el('p', { class: 'sub' }, 'De onde vêm os clientes da Hera e quanto o funil vale.'),
        H.kpis([
          { rot: 'Taxa de conversão', val: fmt.pct(div(fech.length, fech.length + perd.length)), cor: 'var(--verde)', sub: 'fechados ÷ (fechados + perdidos)' },
          { rot: 'Ticket médio fechado', val: fmt.brl(div(fech.reduce((s, x) => s + N(x.valor), 0), fech.length)), cor: 'var(--ouro)' },
          { rot: 'Oportunidades', val: l.length },
          { rot: 'Perdidas', val: perd.length, cor: 'var(--rosa)' }
        ]),
        el('div', { class: 'grade g2' },
          el('div', { class: 'card' }, el('h3', {}, 'Oportunidades por origem'), H.barras(porOrigem, fmt.num)),
          el('div', { class: 'card' }, el('h3', {}, 'Valor mensal por etapa'), H.barras(porEtapa, fmt.brl, '#FFB547'))));
    } }
  ]
});
