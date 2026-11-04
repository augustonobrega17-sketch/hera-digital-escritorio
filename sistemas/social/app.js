/* Nico · Social Media
   Produção de conteúdo (kanban), calendário, métricas e banco de ganchos. */
const { el, fmt, N, div } = H;

const ETAPAS = ['Ideia', 'Roteiro', 'Design', 'Aprovação', 'Agendado', 'Publicado'];
const REDES = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook', 'Pinterest'];
const FORMATOS = ['Reels', 'Carrossel', 'Stories', 'Post', 'Vídeo', 'Shorts', 'Live'];
const COR_REDE = { Instagram: '#FF4F8B', TikTok: '#12D6C5', LinkedIn: '#5B9BFF', YouTube: '#FF5A5A', Facebook: '#8A5CFF', Pinterest: '#FFB547' };

const CAMPOS = [
  { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
  { k: 'rede', rot: 'Rede', tipo: 'select', opcoes: REDES },
  { k: 'formato', rot: 'Formato', tipo: 'select', opcoes: FORMATOS },
  { k: 'data', rot: 'Data de publicação', tipo: 'date' },
  { k: 'etapa', rot: 'Etapa', tipo: 'select', opcoes: ETAPAS },
  { k: 'tema', rot: 'Tema', largo: true },
  { k: 'gancho', rot: 'Gancho (primeira frase / 3 primeiros segundos)', largo: true },
  { k: 'legenda', rot: 'Legenda', tipo: 'textarea', largo: true, linhas: 4 },
  { k: 'alcance', rot: 'Alcance', tipo: 'number' },
  { k: 'curtidas', rot: 'Curtidas', tipo: 'number' },
  { k: 'comentarios', rot: 'Comentários', tipo: 'number' },
  { k: 'salvos', rot: 'Salvos', tipo: 'number' },
  { k: 'compart', rot: 'Compartilhamentos', tipo: 'number' }
];
const interacoes = p => N(p.curtidas) + N(p.comentarios) + N(p.salvos) + N(p.compart);
const engaj = p => div(interacoes(p), p.alcance);
const seloRede = r => el('span', { class: 'selo', style: `background:${COR_REDE[r] || '#666'}2e;color:${COR_REDE[r] || '#ddd'}` }, r);

const GANCHOS = [
  'Pare de [erro comum] se você quer [resultado].',
  'Ninguém te conta isto sobre [tema], mas deveria.',
  '3 erros que fazem você [perder algo] sem perceber.',
  'Eu [fiz algo] por 30 dias e o resultado foi este.',
  'Se você [situação do público], este vídeo é para você.',
  'O jeito mais rápido de [resultado] (sem [sacrifício]).',
  'Você está fazendo [ação] errado. O certo é assim:',
  'Antes de [decisão], assista isto.',
  '[Número]% das pessoas não sabem disto sobre [tema].',
  'Verdade ou mito: [crença comum sobre o tema]?',
  'O que ninguém mostra nos bastidores de [negócio].',
  'Salve este post para quando precisar [resultado].',
  'Isto parece simples, mas mudou [resultado] dos nossos clientes.',
  'Pergunta que mais recebemos: [dúvida frequente].'
];

H.app({
  titulo: 'Social Media', papel: 'Nico · calendário, produção e comunidade de cada cliente', emoji: '📱', cor: '#FF4F8B',
  colecoes: ['posts'],
  abas: [
    { id: 'producao', nome: 'Produção', render: async m => {
      await H.quadro(m, {
        col: 'posts', titulo: 'Produção de conteúdo', item: 'post', botao: 'Novo post', etapas: ETAPAS,
        sub: 'Da ideia ao publicado. Quando publicar, lance alcance e interações para alimentar as métricas.',
        campos: CAMPOS, novo: { rede: 'Instagram', formato: 'Reels', data: H.hoje() },
        resumo: l => H.kpis([
          { rot: 'Na esteira', val: l.filter(p => p.etapa !== 'Publicado').length },
          { rot: 'Esperando aprovação', val: l.filter(p => p.etapa === 'Aprovação').length, cor: 'var(--ouro)' },
          { rot: 'Agendados', val: l.filter(p => p.etapa === 'Agendado').length, cor: 'var(--pavao)' },
          { rot: 'Atrasados', val: l.filter(p => p.etapa !== 'Publicado' && p.etapa !== 'Agendado' && H.diasAte(p.data) < 0).length, cor: 'var(--rosa)' }
        ]),
        ficha: p => [
          el('b', {}, p.tema || '(sem tema)'),
          el('div', { class: 'meta' }, seloRede(p.rede), p.formato, '·', fmt.curta(p.data),
            H.diasAte(p.data) < 0 && !['Publicado', 'Agendado'].includes(p.etapa) ? el('span', { class: 'selo ruim' }, 'atrasado') : null),
          el('div', { class: 'meta', style: 'margin-top:4px' }, p.cliente || '—')
        ]
      });
    } },

    { id: 'calendario', nome: 'Calendário', render: async m => {
      const posts = await H.col('posts', true);
      let ref = new Date(); ref.setDate(1);
      let filtro = '';
      const area = el('div');
      const filtroEl = await H.filtroCliente(v => { filtro = v; pinta(); });
      m.append(el('div', { class: 'cab' }, el('div', {}, el('h2', {}, 'Calendário editorial'), el('p', { class: 'sub', style: 'margin:0' }, 'Clique num post para abrir na aba Produção.')),
        el('div', { class: 'acoes' },
          el('button', { class: 'btn', onclick: () => { ref.setMonth(ref.getMonth() - 1); pinta(); } }, '◀'),
          el('button', { class: 'btn', onclick: () => { ref = new Date(); ref.setDate(1); pinta(); } }, 'Hoje'),
          el('button', { class: 'btn', onclick: () => { ref.setMonth(ref.getMonth() + 1); pinta(); } }, '▶'))),
        el('div', { class: 'filtros' }, filtroEl), area);
      function pinta() {
        area.innerHTML = '';
        const ano = ref.getFullYear(), mes = ref.getMonth();
        area.appendChild(el('h3', {}, ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })));
        const grade = el('div', { class: 'calendario' }, ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(d => el('div', { class: 'semana' }, d)));
        const ini = new Date(ano, mes, 1); ini.setDate(1 - ini.getDay());
        const hj = H.hoje();
        for (let i = 0; i < 42; i++) {
          const d = new Date(ini); d.setDate(ini.getDate() + i);
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const doDia = posts.filter(p => p.data === iso && (!filtro || p.cliente === filtro));
          grade.appendChild(el('div', { class: 'dia' + (d.getMonth() !== mes ? ' fora' : '') + (iso === hj ? ' hoje' : '') },
            el('b', {}, d.getDate()),
            doDia.map(p => el('span', { class: 'ev', title: `${p.cliente} · ${p.tema} (${p.etapa})`,
              style: `background:${COR_REDE[p.rede] || '#8A5CFF'}33;border-left:3px solid ${COR_REDE[p.rede] || '#8A5CFF'}`,
              onclick: () => document.querySelector('.aba[data-id="producao"]').click() }, `${p.formato} · ${p.cliente}`))));
        }
        area.appendChild(grade);
      }
      pinta();
    } },

    { id: 'metricas', nome: 'Métricas', render: async m => {
      const pub = (await H.col('posts', true)).filter(p => p.etapa === 'Publicado');
      const alc = pub.reduce((s, p) => s + N(p.alcance), 0);
      const porCliente = Object.entries(pub.reduce((a, p) => ((a[p.cliente] = a[p.cliente] || []).push(p), a), {}))
        .map(([k, ps]) => ({ rot: k, val: div(ps.reduce((s, p) => s + interacoes(p), 0), ps.reduce((s, p) => s + N(p.alcance), 0)) }));
      m.append(el('h2', {}, 'Métricas dos posts publicados'),
        el('p', { class: 'sub' }, 'Taxa de engajamento = (curtidas + comentários + salvos + compartilhamentos) ÷ alcance. Acima de 5% é ótimo.'),
        H.kpis([
          { rot: 'Posts publicados', val: pub.length },
          { rot: 'Alcance total', val: fmt.num(alc), cor: 'var(--pavao)' },
          { rot: 'Engajamento médio', val: fmt.pct(div(pub.reduce((s, p) => s + interacoes(p), 0), alc)), cor: 'var(--ouro)' },
          { rot: 'Salvamentos', val: fmt.num(pub.reduce((s, p) => s + N(p.salvos), 0)), sub: 'o sinal mais forte de conteúdo útil' }
        ]),
        el('div', { class: 'card', style: 'margin-bottom:14px' }, el('h3', {}, 'Engajamento por cliente'), H.barras(porCliente, v => fmt.pct(v))),
        H.tabela({ linhas: pub, colunas: [
          { k: 'data', rot: 'Data', fmt: fmt.data }, { k: 'cliente', rot: 'Cliente' },
          { k: 'rede', rot: 'Rede', fmt: seloRede }, { k: 'formato', rot: 'Formato' },
          { k: 'tema', rot: 'Tema', quebra: true },
          { k: 'alcance', rot: 'Alcance', num: true, fmt: fmt.num },
          { k: 'salvos', rot: 'Salvos', num: true, fmt: fmt.num },
          { k: 'eng', rot: 'Engajamento', num: true, ordem: engaj, fmt: (v, p) => el('span', { class: 'selo ' + (engaj(p) >= .05 ? 'ok' : engaj(p) >= .02 ? 'alerta' : 'ruim') }, fmt.pct(engaj(p))) }
        ], vazio: 'Nenhum post publicado ainda.' }));
    } },

    { id: 'ganchos', nome: 'Banco de ganchos', render: m => {
      const tema = el('input', { placeholder: 'Escreva o tema (ex.: clareamento dental) para preencher os ganchos', oninput: () => pinta() });
      const area = el('div', { class: 'grade g2' });
      m.append(el('h2', {}, 'Banco de ganchos'),
        el('p', { class: 'sub' }, 'Os 3 primeiros segundos decidem se o vídeo é assistido. Troque o que está entre colchetes e copie.'),
        el('div', { class: 'filtros' }, tema), area);
      function pinta() {
        area.innerHTML = '';
        GANCHOS.forEach(g => {
          const txt = tema.value.trim() ? g.replace(/\[tema\]/g, tema.value.trim()) : g;
          area.appendChild(el('div', { class: 'card', style: 'display:flex;gap:10px;align-items:center' },
            el('span', { style: 'flex:1' }, txt), el('button', { class: 'btn mini', onclick: () => H.copiar(txt) }, 'Copiar')));
        });
      }
      pinta();
    } }
  ]
});
