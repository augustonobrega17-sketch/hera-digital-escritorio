/* Theo · Editor de Vídeo
   Fila de edição, estrutura de vídeo curto cronometrada e checklist de publicação. */
const { el, fmt, N } = H;

const ETAPAS = ['Roteiro', 'Captação', 'Edição', 'Revisão', 'Entregue'];
const TIPOS = ['Reels', 'TikTok', 'Shorts', 'Anúncio', 'YouTube', 'Corte de live', 'Depoimento'];

const CAMPOS = [
  { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
  { k: 'tipo', rot: 'Tipo', tipo: 'select', opcoes: TIPOS },
  { k: 'titulo', rot: 'Título', largo: true },
  { k: 'gancho', rot: 'Gancho (0 a 3 s)', largo: true },
  { k: 'duracao', rot: 'Duração (segundos)', tipo: 'number' },
  { k: 'prazo', rot: 'Prazo', tipo: 'date' },
  { k: 'etapa', rot: 'Etapa', tipo: 'select', opcoes: ETAPAS },
  { k: 'link', rot: 'Link dos arquivos (Drive)', largo: true },
  { k: 'roteiro', rot: 'Roteiro', tipo: 'textarea', largo: true, linhas: 5 }
];

/* divisão de um vídeo curto: a proporção vale para 15 s ou 90 s */
const BLOCOS = [
  { nome: 'Gancho', p: .1, min: 2, max: 3, cor: '#FF4F8B', dica: 'Frase ou imagem que prende. Corte seco, rosto ou texto grande na tela.' },
  { nome: 'Contexto', p: .15, cor: '#FFB547', dica: 'Por que isso importa para quem está assistindo.' },
  { nome: 'Desenvolvimento', p: .45, cor: '#8A5CFF', dica: 'O conteúdo em si. Troque de plano a cada 2 ou 3 s.' },
  { nome: 'Prova', p: .15, cor: '#12D6C5', dica: 'Resultado, depoimento, antes e depois ou número.' },
  { nome: 'CTA', p: .15, cor: '#23e08a', dica: 'Uma ação só: comentar, salvar, chamar no direct ou clicar no link.' }
];

function estrutura(total) {
  total = Math.max(6, N(total));
  let t = 0;
  return BLOCOS.map((b, i) => {
    let dur = b.nome === 'Gancho' ? Math.min(b.max, Math.max(b.min, Math.round(total * b.p))) : Math.round(total * b.p);
    if (i === BLOCOS.length - 1) dur = total - t;
    const bloco = Object.assign({}, b, { ini: t, fim: t + dur, dur });
    t += dur;
    return bloco;
  });
}

H.app({
  titulo: 'Editor de Vídeo', papel: 'Theo · reels, anúncios e cortes com gancho nos 3 primeiros segundos', emoji: '🎬', cor: '#FF8A3D',
  colecoes: ['videos'],
  abas: [
    { id: 'edicao', nome: 'Fila de edição', render: async m => {
      await H.quadro(m, {
        col: 'videos', titulo: 'Fila de edição', item: 'vídeo', botao: 'Novo vídeo', etapas: ETAPAS,
        sub: 'Do roteiro à entrega, com prazo e link do material bruto.',
        campos: CAMPOS, novo: { tipo: 'Reels', duracao: 30, prazo: H.hoje() },
        resumo: l => H.kpis([
          { rot: 'Na fila', val: l.filter(v => v.etapa !== 'Entregue').length },
          { rot: 'Em edição', val: l.filter(v => v.etapa === 'Edição').length, cor: 'var(--cor)' },
          { rot: 'Minutos entregues', val: fmt.dec(l.filter(v => v.etapa === 'Entregue').reduce((s, v) => s + N(v.duracao), 0) / 60, 1), cor: 'var(--verde)' },
          { rot: 'Atrasados', val: l.filter(v => v.etapa !== 'Entregue' && H.diasAte(v.prazo) < 0).length, cor: 'var(--rosa)' }
        ]),
        ficha: v => [
          el('b', {}, v.titulo || '(sem título)'),
          el('div', { class: 'meta' }, el('span', { class: 'selo' }, v.tipo), (N(v.duracao) || '?') + ' s', '·', fmt.curta(v.prazo),
            v.etapa !== 'Entregue' && H.diasAte(v.prazo) < 0 ? el('span', { class: 'selo ruim' }, 'atrasado') : null),
          el('div', { class: 'meta', style: 'margin-top:4px' }, v.cliente || '—'),
          v.link ? el('a', { href: v.link, target: '_blank', rel: 'noopener', style: 'font-size:12px' }, 'abrir arquivos ↗') : null
        ]
      });
    } },

    { id: 'estrutura', nome: 'Estrutura de vídeo curto', render: m => {
      const st = { dur: 30, tema: '' };
      const area = el('div');
      m.append(el('h2', {}, 'Estrutura de vídeo curto'),
        el('p', { class: 'sub' }, 'Diga a duração e o tema: o sistema divide o tempo e monta o esqueleto do roteiro.'),
        el('div', { class: 'card linha-campos', style: 'margin-bottom:14px' },
          el('label', { class: 'campo' }, 'Duração (segundos)', el('input', { type: 'number', value: st.dur, oninput: e => { st.dur = N(e.target.value); pinta(); } })),
          el('label', { class: 'campo', style: 'grid-column:span 2' }, 'Tema', el('input', { placeholder: 'Ex.: 3 erros no clareamento caseiro', oninput: e => { st.tema = e.target.value; pinta(); } }))),
        area);
      function pinta() {
        const bl = estrutura(st.dur);
        const total = bl[bl.length - 1].fim;
        const roteiro = bl.map(b => `[${b.ini}s–${b.fim}s] ${b.nome.toUpperCase()}${st.tema && b.nome === 'Gancho' ? ` (sobre ${st.tema})` : ''}\n→ ${b.dica}`).join('\n\n');
        area.innerHTML = '';
        area.append(
          el('div', { class: 'card', style: 'margin-bottom:14px' },
            el('h3', {}, 'Linha do tempo · ' + total + ' s'),
            el('div', { style: 'display:flex;height:42px;border-radius:12px;overflow:hidden' },
              bl.map(b => el('div', { title: b.nome, style: `flex:${b.dur};background:${b.cor};display:grid;place-items:center;color:#0F0A24;font:700 11px var(--f-d);white-space:nowrap;overflow:hidden` }, b.nome + ' ' + b.dur + 's')))),
          el('div', { class: 'grade g2' },
            bl.map(b => el('div', { class: 'card', style: `border-left:3px solid ${b.cor}` },
              el('h3', {}, `${b.nome} · ${b.ini}s a ${b.fim}s`), el('p', { class: 'dica', style: 'margin:0' }, b.dica)))),
          el('div', { class: 'card', style: 'margin-top:14px' },
            el('div', { class: 'cab', style: 'margin-bottom:8px' }, el('h3', { style: 'margin:0' }, 'Esqueleto do roteiro'),
              el('div', { class: 'acoes' }, el('button', { class: 'btn mini', onclick: () => H.copiar(roteiro) }, 'Copiar'))),
            el('div', { class: 'saida' }, roteiro)));
      }
      pinta();
    } },

    { id: 'checklist', nome: 'Checklist de publicação', render: m => {
      m.append(el('h2', {}, 'Checklist de publicação'), el('p', { class: 'sub' }, 'Antes de exportar e mandar para o cliente.'),
        el('div', { class: 'card' }, H.checklist('publicacao', [
          'Gancho nos 3 primeiros segundos, sem logo nem vinheta antes',
          'Legendas na tela (a maioria assiste sem som)',
          'Legendas dentro da área segura (longe das bordas e da interface)',
          'Música com licença de uso comercial',
          'Formato 9:16 em 1080x1920 para Reels, TikTok e Shorts',
          'Áudio normalizado e sem chiado',
          'CTA claro no fim (falado e escrito)',
          'Capa escolhida, com título legível na grade',
          'Exportado em MP4 H.264, até 60 fps',
          'Arquivo nomeado no padrão e salvo na pasta do cliente'
        ])));
    } }
  ]
});
