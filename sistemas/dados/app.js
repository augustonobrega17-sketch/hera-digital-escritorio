/* Cami · Dados & BI
   Painel da agência inteira: lê clientes, campanhas, posts, pipeline, criativos,
   vídeos, artigos e aprovações dos outros sistemas e gera insights. Só leitura. */
const { el, fmt, N, div } = H;

const COLS = ['clientes', 'campanhas', 'posts', 'pipeline', 'criativos', 'videos', 'artigos', 'aprovacoes', 'keywords'];
async function carregar() {
  const d = {};
  await Promise.all(COLS.map(async c => { d[c] = await H.col(c, true); }));
  return d;
}
const somar = (l, k) => l.reduce((s, x) => s + N(x[k]), 0);
const agrupar = (l, k) => l.reduce((a, x) => ((a[x[k] || '—'] = a[x[k] || '—'] || []).push(x), a), {});
const atualizar = el('button', { class: 'btn', onclick: () => document.querySelector('.aba.on').click() }, '↻ Atualizar');

function porCliente(d) {
  return d.clientes.map(c => {
    const camp = d.campanhas.filter(x => x.cliente === c.nome);
    const pub = d.posts.filter(x => x.cliente === c.nome && x.etapa === 'Publicado');
    const inv = somar(camp, 'investido'), rec = somar(camp, 'receita');
    return { nome: c.nome, fee: N(c.fee), saude: c.saude, nps: N(c.nps), inv, rec, roas: div(rec, inv),
             leads: somar(camp, 'leads'), posts: pub.length, alcance: somar(pub, 'alcance'),
             pend: d.aprovacoes.filter(x => x.cliente === c.nome && x.status !== 'aprovado').length };
  });
}

/** leitura automática dos números: o que a Cami diria na reunião de segunda */
function insights(d) {
  const out = [];
  const pc = porCliente(d);
  const mrr = somar(d.clientes, 'fee');
  const maior = pc.slice().sort((a, b) => b.fee - a.fee)[0];
  if (maior && mrr) out.push(['💰', `${maior.nome} representa ${fmt.pct(div(maior.fee, mrr), 0)} da receita da Hera.${div(maior.fee, mrr) > .3 ? ' Concentração alta: perder esse cliente dói. Vale diversificar a carteira.' : ''}`]);
  pc.filter(c => c.saude === 'risco').forEach(c => out.push(['🚨', `${c.nome} está em risco (NPS ${c.nps}). Agendar reunião de resgate com a Bia e mostrar resultado rápido.`]));
  pc.filter(c => c.inv && c.roas && c.roas < 2).forEach(c => out.push(['📉', `${c.nome}: ROAS ${fmt.x(c.roas)} na mídia paga. Abaixo de 2x o cliente sente que paga para anunciar sem retorno.`]));
  pc.filter(c => c.roas >= 6).forEach(c => out.push(['🚀', `${c.nome}: ROAS ${fmt.x(c.roas)}. Ótimo argumento para propor aumento de verba e upgrade de plano.`]));
  pc.filter(c => !c.posts).forEach(c => out.push(['📭', `${c.nome} não tem post publicado registrado. Conferir com o Nico se o calendário está rodando.`]));
  pc.filter(c => c.pend >= 2).forEach(c => out.push(['⏳', `${c.nome} tem ${c.pend} aprovações paradas. Isso atrasa a produção de toda a equipe.`]));
  const atrasCri = d.criativos.filter(x => !['Aprovado', 'Entregue'].includes(x.etapa) && H.diasAte(x.prazo) < 0).length;
  const atrasVid = d.videos.filter(x => x.etapa !== 'Entregue' && H.diasAte(x.prazo) < 0).length;
  if (atrasCri + atrasVid) out.push(['🎨', `${atrasCri} criativo(s) e ${atrasVid} vídeo(s) com prazo vencido.`]);
  const abertos = d.pipeline.filter(x => !['Fechado', 'Perdido'].includes(x.etapa));
  if (abertos.length) out.push(['💼', `${abertos.length} oportunidades abertas somam ${fmt.brl(somar(abertos, 'valor'))}/mês. Se metade fechar, o MRR sobe ${fmt.pct(div(somar(abertos, 'valor') / 2, mrr), 0)}.`]);
  return out;
}

H.app({
  titulo: 'Dados & BI', papel: 'Cami · a agência inteira em um painel', emoji: '📊', cor: '#7AA2FF',
  abas: [
    { id: 'painel', nome: 'Painel da agência', render: async m => {
      const d = await carregar();
      const mrr = somar(d.clientes, 'fee'), inv = somar(d.campanhas, 'investido'), rec = somar(d.campanhas, 'receita');
      const leads = somar(d.campanhas, 'leads');
      const pub = d.posts.filter(p => p.etapa === 'Publicado');
      const abertos = d.pipeline.filter(x => !['Fechado', 'Perdido'].includes(x.etapa));
      const plat = Object.entries(agrupar(d.campanhas, 'plataforma')).map(([k, l]) => ({ rot: k, val: somar(l, 'investido') }));
      const pc = porCliente(d);
      m.append(el('div', { class: 'cab' }, el('div', {}, el('h2', {}, 'Painel da Hera Digital'),
          el('p', { class: 'sub', style: 'margin:0' }, 'Números ao vivo de todos os sistemas da equipe.')), el('div', { class: 'acoes' }, atualizar)),
        H.kpis([
          { rot: 'Receita da Hera (MRR)', val: fmt.brl(mrr), cor: 'var(--ouro)', sub: d.clientes.length + ' clientes' },
          { rot: 'Mídia gerenciada', val: fmt.brl(inv), cor: 'var(--violeta-2)' },
          { rot: 'Receita gerada p/ clientes', val: fmt.brl(rec), cor: 'var(--verde)' },
          { rot: 'ROAS médio', val: fmt.x(div(rec, inv)), cor: 'var(--pavao)' },
          { rot: 'Leads gerados', val: fmt.num(leads), sub: 'CPL ' + fmt.brl2(div(inv, leads)) },
          { rot: 'Pipeline comercial', val: fmt.brl(somar(abertos, 'valor')), cor: 'var(--rosa)', sub: abertos.length + ' oportunidades' }
        ]),
        el('div', { class: 'grade g2' },
          el('div', { class: 'card' }, el('h3', {}, 'Receita gerada por cliente'), H.barras(pc.filter(c => c.rec).sort((a, b) => b.rec - a.rec).map(c => ({ rot: c.nome, val: c.rec })), fmt.brl, '#23e08a')),
          el('div', { class: 'card' }, el('h3', {}, 'Fee mensal por cliente'), H.barras(pc.sort((a, b) => b.fee - a.fee).map(c => ({ rot: c.nome, val: c.fee })), fmt.brl, '#FFB547')),
          el('div', { class: 'card' }, el('h3', {}, 'Mídia por plataforma'), H.barras(plat.sort((a, b) => b.val - a.val), fmt.brl, '#8A5CFF')),
          el('div', { class: 'card' }, el('h3', {}, 'Produção da equipe'), H.barras([
            { rot: 'Posts publicados', val: pub.length, cor: '#FF4F8B' },
            { rot: 'Posts na esteira', val: d.posts.length - pub.length, cor: '#FF4F8B88' },
            { rot: 'Criativos entregues', val: d.criativos.filter(x => ['Aprovado', 'Entregue'].includes(x.etapa)).length, cor: '#9B7BFF' },
            { rot: 'Vídeos entregues', val: d.videos.filter(x => x.etapa === 'Entregue').length, cor: '#FF8A3D' },
            { rot: 'Artigos publicados', val: d.artigos.filter(x => x.etapa === 'Publicado').length, cor: '#23e08a' }
          ], fmt.num))));
    } },

    { id: 'clientes', nome: 'Por cliente', render: async m => {
      const d = await carregar();
      m.append(el('div', { class: 'cab' }, el('div', {}, el('h2', {}, 'Resultado por cliente'),
          el('p', { class: 'sub', style: 'margin:0' }, 'Fee, mídia, retorno, conteúdo e pendências de cada conta. Clique no cabeçalho para ordenar.')), el('div', { class: 'acoes' }, atualizar)),
        H.tabela({ linhas: porCliente(d), colunas: [
          { k: 'nome', rot: 'Cliente' },
          { k: 'saude', rot: 'Saúde', fmt: s => el('span', { class: 'selo ' + ({ 'ótima': 'ok', 'atenção': 'alerta', 'risco': 'ruim' }[s] || '') }, s || '—') },
          { k: 'fee', rot: 'Fee', num: true, fmt: v => fmt.brl(v) },
          { k: 'inv', rot: 'Mídia', num: true, fmt: v => fmt.brl(v) },
          { k: 'rec', rot: 'Receita gerada', num: true, fmt: v => fmt.brl(v) },
          { k: 'roas', rot: 'ROAS', num: true, fmt: v => v ? el('span', { class: 'selo ' + (v >= 4 ? 'ok' : v >= 2 ? 'alerta' : 'ruim') }, fmt.x(v)) : '—' },
          { k: 'leads', rot: 'Leads', num: true, fmt: fmt.num },
          { k: 'posts', rot: 'Posts', num: true },
          { k: 'alcance', rot: 'Alcance', num: true, fmt: fmt.num },
          { k: 'pend', rot: 'Aprovações paradas', num: true, fmt: v => v ? el('span', { class: 'selo alerta' }, v) : '0' },
          { k: 'nps', rot: 'NPS', num: true }
        ] }));
    } },

    { id: 'insights', nome: 'Insights automáticos', render: async m => {
      const d = await carregar();
      const ins = insights(d);
      m.append(el('div', { class: 'cab' }, el('div', {}, el('h2', {}, 'Insights automáticos'),
          el('p', { class: 'sub', style: 'margin:0' }, 'A leitura dos números que vale levar para a reunião de segunda.')), el('div', { class: 'acoes' }, atualizar,
          el('button', { class: 'btn', onclick: () => H.copiar(ins.map(i => i[0] + ' ' + i[1]).join('\n')) }, 'Copiar'))),
        el('div', { class: 'card' }, ins.length ? ins.map(i => el('div', { class: 'insight' }, el('i', {}, i[0]), el('span', {}, i[1])))
                                                : el('p', { class: 'vazio' }, 'Ainda não há dados suficientes.')));
    } }
  ]
});
