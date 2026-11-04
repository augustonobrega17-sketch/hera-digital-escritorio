/* Gabi · SEO & Blog
   Palavras-chave priorizadas, pauta de artigos, simulador do Google e checklist on-page. */
const { el, fmt, N } = H;

const INTENCOES = ['transacional', 'comercial', 'informacional', 'navegacional'];
const PESO = { transacional: 1.5, comercial: 1.3, informacional: 1, navegacional: .7 };
const ETAPAS = ['Pauta', 'Escrevendo', 'Revisão', 'Publicado'];

/** nota de prioridade: volume, facilidade, intenção e quão perto do topo já está */
function prioridade(k) {
  const facil = (100 - Math.min(100, N(k.dificuldade))) / 100;
  const pos = N(k.posicao);
  const perto = pos >= 4 && pos <= 20 ? 1.4 : pos >= 1 && pos <= 3 ? .6 : 1;   // 4º a 20º lugar: o ganho mais rápido
  return Math.round(Math.sqrt(N(k.volume)) * facil * (PESO[k.intencao] || 1) * perto);
}
const seloPos = p => { p = N(p); return el('span', { class: 'selo ' + (!p ? '' : p <= 3 ? 'ok' : p <= 10 ? 'info' : p <= 20 ? 'alerta' : 'ruim') }, p ? p + 'º' : 'não rankeia'); };
const seloDif = d => el('span', { class: 'selo ' + (N(d) < 30 ? 'ok' : N(d) < 60 ? 'alerta' : 'ruim') }, N(d));

H.app({
  titulo: 'SEO & Blog', papel: 'Gabi · cliente que chega pelo Google, todo mês, sem pagar clique', emoji: '🔎', cor: '#23e08a',
  colecoes: ['keywords', 'artigos'],
  abas: [
    { id: 'palavras', nome: 'Palavras-chave', render: async m => {
      await H.crud(m, {
        col: 'keywords', titulo: 'Palavras-chave', item: 'palavra-chave', botao: 'Nova palavra',
        sub: 'A nota de prioridade junta volume, dificuldade, intenção de compra e posição atual. Comece pelas maiores.',
        campos: [
          { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
          { k: 'palavra', rot: 'Palavra-chave', largo: true },
          { k: 'volume', rot: 'Buscas por mês', tipo: 'number' },
          { k: 'dificuldade', rot: 'Dificuldade (0 a 100)', tipo: 'number' },
          { k: 'intencao', rot: 'Intenção', tipo: 'select', opcoes: INTENCOES },
          { k: 'posicao', rot: 'Posição atual (0 = não aparece)', tipo: 'number' },
          { k: 'url', rot: 'Página que deve rankear', largo: true }
        ],
        novo: { intencao: 'informacional', posicao: 0 },
        resumo: l => H.kpis([
          { rot: 'Palavras monitoradas', val: l.length },
          { rot: 'No top 3', val: l.filter(k => N(k.posicao) >= 1 && N(k.posicao) <= 3).length, cor: 'var(--verde)' },
          { rot: 'Na 1ª página', val: l.filter(k => N(k.posicao) >= 1 && N(k.posicao) <= 10).length, cor: 'var(--pavao)' },
          { rot: 'Buscas/mês em jogo', val: fmt.num(l.reduce((s, k) => s + N(k.volume), 0)), cor: 'var(--ouro)' }
        ]),
        colunas: [
          { k: 'prio', rot: 'Prioridade', num: true, ordem: prioridade, fmt: (v, k) => el('b', {}, prioridade(k)) },
          { k: 'palavra', rot: 'Palavra-chave' }, { k: 'cliente', rot: 'Cliente' },
          { k: 'volume', rot: 'Volume', num: true, fmt: fmt.num },
          { k: 'dificuldade', rot: 'Dif.', num: true, fmt: seloDif },
          { k: 'intencao', rot: 'Intenção' },
          { k: 'posicao', rot: 'Posição', num: true, ordem: k => N(k.posicao) || 999, fmt: seloPos }
        ]
      });
    } },

    { id: 'pauta', nome: 'Pauta de artigos', render: async m => {
      await H.quadro(m, {
        col: 'artigos', titulo: 'Pauta de artigos', item: 'artigo', botao: 'Novo artigo', etapas: ETAPAS,
        sub: 'Cada artigo nasce de uma palavra-chave. A meta da casa: 4 artigos por cliente por mês.',
        campos: [
          { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
          { k: 'titulo', rot: 'Título', largo: true },
          { k: 'palavra', rot: 'Palavra-chave foco', largo: true },
          { k: 'palavras', rot: 'Tamanho (palavras)', tipo: 'number' },
          { k: 'data', rot: 'Publicação', tipo: 'date' },
          { k: 'etapa', rot: 'Etapa', tipo: 'select', opcoes: ETAPAS }
        ],
        novo: { palavras: 1500, data: H.hoje() },
        ficha: a => [
          el('b', {}, a.titulo || '(sem título)'),
          el('div', { class: 'meta' }, '🔑 ' + (a.palavra || '—')),
          el('div', { class: 'meta', style: 'margin-top:4px' }, a.cliente || '—', '·', fmt.num(a.palavras) + ' palavras', '·', fmt.curta(a.data))
        ]
      });
    } },

    { id: 'snippet', nome: 'Simulador do Google', render: m => {
      const st = { titulo: 'Implante dentário em SP: preço e avaliação gratuita | Sorriso Pleno',
                   desc: 'Descubra quanto custa um implante dentário em 2026, como funciona o tratamento e agende sua avaliação gratuita. Parcele em até 18x.',
                   url: 'sorrisopleno.com.br/blog/implante-dentario-preco' };
      const prev = el('div', { class: 'card', style: 'background:#fff;color:#202124;margin-top:14px;font-family:Arial,sans-serif' });
      const cont = el('div', { class: 'dica', style: 'margin-top:8px' });
      const cmp = (k, rot, lim, area) => el('label', { class: 'campo', style: 'grid-column:1/-1' }, rot + ` (ideal até ${lim})`,
        el(area ? 'textarea' : 'input', { value: st[k], rows: 2, oninput: e => { st[k] = e.target.value; pinta(); } }));
      m.append(el('h2', {}, 'Simulador do Google'),
        el('p', { class: 'sub' }, 'Veja como o título e a descrição aparecem no resultado de busca antes de publicar.'),
        el('div', { class: 'card linha-campos' }, cmp('titulo', 'Title tag', 60), cmp('desc', 'Meta description', 160, true), cmp('url', 'Endereço', 75)),
        prev, cont);
      function corta(t, n) { return t.length > n ? t.slice(0, n - 1) + '…' : t; }
      function pinta() {
        prev.innerHTML = '';
        prev.append(
          el('div', { style: 'font-size:12px;color:#4d5156' }, st.url.split('/')[0], el('span', { style: 'color:#70757a' }, ' › ' + st.url.split('/').slice(1).join(' › '))),
          el('div', { style: 'font-size:20px;color:#1a0dab;margin:4px 0;line-height:1.3' }, corta(st.titulo, 60)),
          el('div', { style: 'font-size:14px;color:#4d5156;line-height:1.55' }, corta(st.desc, 160)));
        const t = st.titulo.length, d = st.desc.length;
        cont.innerHTML = '';
        cont.append(el('span', { class: 'contador' + (t > 60 ? ' estourou' : '') }, `Título: ${t}/60`), ' · ',
          el('span', { class: 'contador' + (d > 160 ? ' estourou' : '') }, `Descrição: ${d}/160`), ' · ',
          d < 110 ? 'a descrição está curta: aproveite para vender o clique.' : 'tamanho bom.');
      }
      pinta();
    } },

    { id: 'checklist', nome: 'Checklist on-page', render: m => {
      m.append(el('h2', {}, 'Checklist on-page'), el('p', { class: 'sub' }, 'Antes de publicar qualquer artigo ou página.'),
        el('div', { class: 'card' }, H.checklist('onpage', [
          'Palavra-chave no título (H1), de preferência no começo',
          'Title tag até 60 caracteres e meta description até 160',
          'URL curta, com a palavra-chave e sem acentos',
          'Palavra-chave nos primeiros 100 caracteres do texto',
          'Subtítulos (H2/H3) respondendo às dúvidas da busca',
          'Imagens leves (até 150 KB) com texto alternativo',
          'Pelo menos 3 links internos para outras páginas do cliente',
          'Um link externo para uma fonte confiável',
          'CTA para WhatsApp, formulário ou agendamento',
          'Página abre em menos de 3 segundos no celular',
          'Enviado para indexação no Google Search Console'
        ])));
    } }
  ]
});
