/* Bia · Atendimento & Sucesso do Cliente
   Carteira de clientes (usada por todos os sistemas), aprovações, agenda e relatório mensal. */
const { el, fmt, N, div } = H;

const PLANOS = ['Essencial', 'Crescimento', 'Premium', 'Projeto pontual'];
const SAUDE = ['ótima', 'atenção', 'risco'];
const seloSaude = s => el('span', { class: 'selo ' + ({ 'ótima': 'ok', 'atenção': 'alerta', 'risco': 'ruim' }[s] || '') }, s || '—');
const seloNps = n => el('span', { class: 'selo ' + (N(n) >= 9 ? 'ok' : N(n) >= 7 ? 'alerta' : 'ruim') }, N(n));
const seloContato = d => {
  const dias = H.diasAte(d);
  if (dias == null) return '—';
  const txt = dias < 0 ? `atrasado ${-dias}d` : dias === 0 ? 'hoje' : `em ${dias}d`;
  return el('span', { class: 'selo ' + (dias < 0 ? 'ruim' : dias <= 2 ? 'alerta' : 'info') }, fmt.curta(d) + ' · ' + txt);
};

H.app({
  titulo: 'Atendimento & Sucesso do Cliente', papel: 'Bia · a ponte entre a Hera e quem paga as contas', emoji: '🤝', cor: '#14b8a6',
  colecoes: ['clientes', 'aprovacoes'],
  abas: [
    { id: 'carteira', nome: 'Carteira de clientes', render: async m => {
      await H.crud(m, {
        col: 'clientes', titulo: 'Carteira de clientes', item: 'cliente', botao: 'Novo cliente', porCliente: false,
        sub: 'É daqui que todos os sistemas da Hera puxam a lista de clientes.',
        campos: [
          { k: 'nome', rot: 'Nome do cliente', largo: true },
          { k: 'segmento', rot: 'Segmento' },
          { k: 'contato', rot: 'Pessoa de contato' },
          { k: 'plano', rot: 'Plano', tipo: 'select', opcoes: PLANOS },
          { k: 'fee', rot: 'Fee mensal (R$)', tipo: 'money' },
          { k: 'inicio', rot: 'Cliente desde', tipo: 'date' },
          { k: 'saude', rot: 'Saúde da conta', tipo: 'select', opcoes: SAUDE },
          { k: 'nps', rot: 'NPS (0 a 10)', tipo: 'number' },
          { k: 'proximoContato', rot: 'Próximo contato', tipo: 'date' },
          { k: 'servicos', rot: 'Serviços contratados', largo: true }
        ],
        novo: { plano: 'Crescimento', saude: 'ótima', inicio: H.hoje(), nps: 8 },
        resumo: l => H.kpis([
          { rot: 'Clientes ativos', val: l.length },
          { rot: 'Receita mensal (MRR)', val: fmt.brl(l.reduce((s, c) => s + N(c.fee), 0)), cor: 'var(--ouro)' },
          { rot: 'Ticket médio', val: fmt.brl(div(l.reduce((s, c) => s + N(c.fee), 0), l.length)) },
          { rot: 'NPS médio', val: fmt.dec(div(l.reduce((s, c) => s + N(c.nps), 0), l.length), 1), cor: 'var(--verde)' },
          { rot: 'Em risco', val: l.filter(c => c.saude === 'risco').length, cor: 'var(--rosa)', sub: 'precisam de atenção já' }
        ]),
        colunas: [
          { k: 'nome', rot: 'Cliente' }, { k: 'segmento', rot: 'Segmento' }, { k: 'plano', rot: 'Plano' },
          { k: 'fee', rot: 'Fee', num: true, fmt: v => fmt.brl(v) },
          { k: 'saude', rot: 'Saúde', fmt: seloSaude },
          { k: 'nps', rot: 'NPS', num: true, fmt: seloNps },
          { k: 'proximoContato', rot: 'Próximo contato', fmt: seloContato },
          { k: 'inicio', rot: 'Desde', fmt: fmt.data }
        ]
      });
    } },

    { id: 'aprovacoes', nome: 'Aprovações', render: async m => {
      await H.quadro(m, {
        col: 'aprovacoes', titulo: 'Aprovações com o cliente', item: 'aprovação', botao: 'Nova aprovação',
        etapas: ['pendente', 'ajustes', 'aprovado'], campo: 'status',
        sub: 'O que está esperando o OK do cliente. Pendência parada trava toda a equipe.',
        campos: [
          { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
          { k: 'tipo', rot: 'Tipo', tipo: 'select', opcoes: ['Criativos', 'Calendário', 'Vídeo', 'Página', 'Copy', 'Estratégia', 'Relatório', 'Orçamento de mídia'] },
          { k: 'item', rot: 'O que precisa aprovar', largo: true },
          { k: 'prazo', rot: 'Prazo', tipo: 'date' },
          { k: 'status', rot: 'Status', tipo: 'select', opcoes: ['pendente', 'ajustes', 'aprovado'] }
        ],
        novo: { tipo: 'Criativos', prazo: H.hoje() },
        ficha: a => [
          el('b', {}, a.item || '(sem descrição)'),
          el('div', { class: 'meta' }, el('span', { class: 'selo' }, a.tipo), a.cliente || '—'),
          el('div', { class: 'meta', style: 'margin-top:4px' }, 'prazo ', a.status !== 'aprovado' ? seloContato(a.prazo) : fmt.curta(a.prazo))
        ]
      });
    } },

    { id: 'agenda', nome: 'Agenda de contatos', render: async m => {
      const cl = (await H.col('clientes', true)).slice().sort((a, b) => String(a.proximoContato).localeCompare(String(b.proximoContato)));
      m.append(el('h2', {}, 'Agenda de contatos'),
        el('p', { class: 'sub' }, 'Quem precisa ouvir da Hera nos próximos dias. Cliente que não recebe notícia pensa que não tem resultado.'),
        el('div', { class: 'grade g3' }, cl.map(c => el('div', { class: 'card', style: `border-left:3px solid ${c.saude === 'risco' ? 'var(--rosa)' : c.saude === 'atenção' ? 'var(--ouro)' : 'var(--verde)'}` },
          el('h3', {}, c.nome),
          el('p', { class: 'dica', style: 'margin:0 0 8px' }, (c.contato || 'sem contato') + ' · ' + (c.plano || '') + ' · ' + fmt.brl(c.fee)),
          seloContato(c.proximoContato), ' ', seloSaude(c.saude),
          el('p', { class: 'dica', style: 'margin:8px 0 0' }, c.servicos || '')))));
    } },

    { id: 'relatorio', nome: 'Relatório mensal', render: async m => {
      const [clientes, campanhas, posts, criativos, videos, artigos] = await Promise.all(
        ['clientes', 'campanhas', 'posts', 'criativos', 'videos', 'artigos'].map(c => H.col(c, true)));
      const sel = el('select', { style: 'max-width:360px', onchange: () => pinta() }, clientes.map(c => el('option', { value: c.nome }, c.nome)));
      const saida = el('div');
      m.append(el('h2', {}, 'Relatório mensal do cliente'),
        el('p', { class: 'sub' }, 'Junta sozinho os números do Tráfego, Social, Design, Vídeo e SEO. Revise, copie e mande para o cliente.'),
        el('div', { class: 'filtros no-print' }, sel,
          el('button', { class: 'btn', onclick: () => H.copiar(saida.querySelector('.saida').textContent) }, 'Copiar texto'),
          el('button', { class: 'btn', onclick: () => window.print() }, 'Imprimir / PDF')),
        saida);
      function pinta() {
        const nome = sel.value, c = clientes.find(x => x.nome === nome) || {};
        const camp = campanhas.filter(x => x.cliente === nome);
        const t = camp.reduce((a, x) => { for (const k of ['investido', 'leads', 'vendas', 'receita', 'cliques', 'impressoes']) a[k] += N(x[k]); return a; },
          { investido: 0, leads: 0, vendas: 0, receita: 0, cliques: 0, impressoes: 0 });
        const pub = posts.filter(x => x.cliente === nome && x.etapa === 'Publicado');
        const alcance = pub.reduce((s, x) => s + N(x.alcance), 0);
        const inter = pub.reduce((s, x) => s + N(x.curtidas) + N(x.comentarios) + N(x.salvos) + N(x.compart), 0);
        const melhor = pub.slice().sort((a, b) => N(b.alcance) - N(a.alcance))[0];
        const cri = criativos.filter(x => x.cliente === nome && ['Aprovado', 'Entregue'].includes(x.etapa)).length;
        const vid = videos.filter(x => x.cliente === nome && x.etapa === 'Entregue').length;
        const art = artigos.filter(x => x.cliente === nome && x.etapa === 'Publicado').length;
        const mes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const roas = div(t.receita, t.investido);

        const linhas = [
          `RELATÓRIO DE RESULTADOS · ${nome.toUpperCase()}`,
          `Hera Digital · ${mes}`, '',
          `Olá, ${c.contato || 'tudo bem'}! Segue o resumo do mês.`, '',
          'MÍDIA PAGA',
          camp.length ? [
            `• Investimento: ${fmt.brl(t.investido)} em ${camp.length} campanha(s)`,
            `• ${fmt.num(t.impressoes)} impressões e ${fmt.num(t.cliques)} cliques (CTR ${fmt.pct(div(t.cliques, t.impressoes), 2)})`,
            t.leads ? `• ${fmt.num(t.leads)} leads, a ${fmt.brl2(div(t.investido, t.leads))} cada` : null,
            t.vendas ? `• ${fmt.num(t.vendas)} vendas, ${fmt.brl(t.receita)} em receita` : null,
            t.receita ? `• Retorno sobre o investimento (ROAS): ${fmt.x(roas)}. Cada R$ 1 investido voltou R$ ${fmt.dec(roas, 2)}` : null
          ].filter(Boolean).join('\n') : '• Sem campanhas de mídia paga neste período.', '',
          'REDES SOCIAIS',
          pub.length ? [
            `• ${pub.length} publicação(ões), alcance de ${fmt.num(alcance)} pessoas`,
            `• Engajamento médio de ${fmt.pct(div(inter, alcance))}`,
            melhor ? `• Destaque: "${melhor.tema}" (${melhor.formato}), com ${fmt.num(melhor.alcance)} de alcance` : null
          ].filter(Boolean).join('\n') : '• Sem publicações registradas neste período.', '',
          'PRODUÇÃO',
          `• ${cri} peça(s) de design aprovada(s) · ${vid} vídeo(s) entregue(s) · ${art} artigo(s) publicado(s)`, '',
          'PRÓXIMOS PASSOS',
          roas && roas < 3 ? '• Otimizar públicos e criativos das campanhas com retorno abaixo do esperado' : '• Escalar o orçamento das campanhas com melhor retorno',
          '• Manter a constância de publicações e testar novos ganchos',
          '• Reunião de alinhamento para o planejamento do próximo mês', '',
          'Qualquer dúvida, estamos à disposição.',
          'Equipe Hera Digital · Cem olhos no seu crescimento.'
        ];
        saida.innerHTML = '';
        saida.append(
          H.kpis([
            { rot: 'Investido', val: fmt.brl(t.investido), cor: 'var(--ouro)' },
            { rot: 'Leads', val: fmt.num(t.leads), cor: 'var(--pavao)' },
            { rot: 'Receita', val: fmt.brl(t.receita), cor: 'var(--verde)' },
            { rot: 'ROAS', val: fmt.x(roas) },
            { rot: 'Alcance orgânico', val: fmt.num(alcance), cor: 'var(--rosa)' }
          ]),
          el('div', { class: 'saida' }, linhas.join('\n')));
      }
      if (clientes.length) pinta(); else saida.appendChild(el('div', { class: 'card vazio' }, 'Cadastre clientes na aba Carteira.'));
    } }
  ]
});
