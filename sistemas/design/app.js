/* Íris · Design & Direção de Arte
   Fila de criativos, paletas dos clientes, guia de formatos e checklist de entrega. */
const { el, fmt } = H;

const ETAPAS = ['Briefing', 'Criando', 'Revisão', 'Aprovado', 'Entregue'];
const FORMATOS = ['Feed 1080x1350', 'Quadrado 1080x1080', 'Stories 1080x1920', 'Reels capa 1080x1920', 'Banner 1200x628',
                  'Thumb YouTube 1280x720', 'Capa LinkedIn 1584x396', 'Display 300x250', 'Display 728x90', 'Apresentação 1920x1080', 'Impresso A4'];

const GUIA = [
  ['Instagram', 'Feed retrato', '1080 x 1350', '4:5', 'Ocupa mais tela no celular. É o padrão da Hera para feed.'],
  ['Instagram', 'Feed quadrado', '1080 x 1080', '1:1', 'Use em carrossel quando a grade do perfil pedir.'],
  ['Instagram / TikTok', 'Stories e Reels', '1080 x 1920', '9:16', 'Deixe 250 px livres em cima e 340 px embaixo (área da interface).'],
  ['Facebook / LinkedIn', 'Link e anúncio', '1200 x 628', '1.91:1', 'Texto grande: aparece pequeno no feed.'],
  ['YouTube', 'Miniatura', '1280 x 720', '16:9', 'Rosto + no máximo 4 palavras.'],
  ['LinkedIn', 'Capa de página', '1584 x 396', '4:1', 'O logo da empresa cobre o canto esquerdo.'],
  ['Google Display', 'Retângulo médio', '300 x 250', '6:5', 'Formato que mais roda. Arquivo até 150 KB.'],
  ['Google Display', 'Leaderboard', '728 x 90', '8:1', 'Só logo, uma frase e o botão.'],
  ['WhatsApp', 'Status', '1080 x 1920', '9:16', 'Mesmo arquivo dos Stories.']
];

const CAMPOS = [
  { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
  { k: 'formato', rot: 'Formato', tipo: 'select', opcoes: FORMATOS },
  { k: 'peca', rot: 'Peça', largo: true, dica: 'Ex.: 6 criativos de catálogo para Black Friday' },
  { k: 'briefing', rot: 'Briefing', tipo: 'textarea', largo: true, linhas: 4 },
  { k: 'prazo', rot: 'Prazo', tipo: 'date' },
  { k: 'etapa', rot: 'Etapa', tipo: 'select', opcoes: ETAPAS }
];

const swatches = cores => el('span', {}, String(cores || '').split(/[,\s]+/).filter(c => /^#[0-9a-f]{3,8}$/i.test(c))
  .map(c => el('span', { class: 'swatch', title: c, style: `background:${c}` })));

H.app({
  titulo: 'Design & Direção de Arte', papel: 'Íris · criativos que fazem a marca de cada cliente parecer premium', emoji: '🎨', cor: '#9B7BFF',
  colecoes: ['criativos', 'paletas'],
  abas: [
    { id: 'pedidos', nome: 'Fila de criativos', render: async m => {
      await H.quadro(m, {
        col: 'criativos', titulo: 'Fila de criativos', item: 'pedido', botao: 'Novo pedido', etapas: ETAPAS,
        sub: 'Todo pedido de peça entra aqui com briefing e prazo. Nada de pedido perdido no WhatsApp.',
        campos: CAMPOS, novo: { formato: 'Feed 1080x1350', prazo: H.hoje() },
        resumo: l => H.kpis([
          { rot: 'Em produção', val: l.filter(c => ['Criando', 'Revisão'].includes(c.etapa)).length },
          { rot: 'Novos briefings', val: l.filter(c => c.etapa === 'Briefing').length, cor: 'var(--pavao)' },
          { rot: 'Vencem em 2 dias', val: l.filter(c => c.etapa !== 'Entregue' && H.diasAte(c.prazo) >= 0 && H.diasAte(c.prazo) <= 2).length, cor: 'var(--ouro)' },
          { rot: 'Atrasados', val: l.filter(c => !['Entregue', 'Aprovado'].includes(c.etapa) && H.diasAte(c.prazo) < 0).length, cor: 'var(--rosa)' }
        ]),
        ficha: c => [
          el('b', {}, c.peca || '(sem nome)'),
          el('div', { class: 'meta' }, c.formato),
          el('div', { class: 'meta', style: 'margin-top:4px' }, c.cliente || '—', '·', 'prazo ' + fmt.curta(c.prazo),
            !['Entregue', 'Aprovado'].includes(c.etapa) && H.diasAte(c.prazo) < 0 ? el('span', { class: 'selo ruim' }, 'atrasado') : null)
        ]
      });
    } },

    { id: 'paletas', nome: 'Paletas dos clientes', render: async m => {
      await H.crud(m, {
        col: 'paletas', titulo: 'Paletas e regras de marca', item: 'paleta', botao: 'Nova paleta',
        sub: 'Cores, fontes e o que nunca pode aparecer nas peças de cada cliente.',
        campos: [
          { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
          { k: 'cores', rot: 'Cores (HEX separados por vírgula)', largo: true, dica: '#1B1B1F, #F4EDE4, #C8102E' },
          { k: 'fontes', rot: 'Fontes', largo: true },
          { k: 'observacoes', rot: 'Regras e observações', tipo: 'textarea', largo: true }
        ],
        colunas: [
          { k: 'cliente', rot: 'Cliente' },
          { k: 'cores', rot: 'Cores', fmt: v => swatches(v) },
          { k: 'fontes', rot: 'Fontes' },
          { k: 'observacoes', rot: 'Regras', quebra: true }
        ]
      });
    } },

    { id: 'formatos', nome: 'Guia de formatos', render: m => {
      m.append(el('h2', {}, 'Guia de formatos'), el('p', { class: 'sub' }, 'Tamanhos que a Hera usa em cada rede, com a área segura.'),
        H.tabela({ linhas: GUIA.map(g => ({ rede: g[0], peca: g[1], tam: g[2], prop: g[3], dica: g[4] })), colunas: [
          { k: 'rede', rot: 'Rede' }, { k: 'peca', rot: 'Peça' }, { k: 'tam', rot: 'Tamanho (px)' },
          { k: 'prop', rot: 'Proporção' }, { k: 'dica', rot: 'Dica', quebra: true }] }));
    } },

    { id: 'checklist', nome: 'Checklist de entrega', render: m => {
      m.append(el('h2', {}, 'Checklist de entrega'), el('p', { class: 'sub' }, 'Antes de mandar para aprovação do cliente.'),
        el('div', { class: 'card' }, H.checklist('entrega', [
          'As cores e fontes seguem a paleta do cliente',
          'Logo na versão certa, com área de proteção respeitada',
          'Texto revisado (ortografia, preço, datas, telefone)',
          'Texto ocupa pouco espaço da imagem (anúncio)',
          'Área segura dos Stories e Reels respeitada',
          'Contraste legível no celular, com brilho baixo',
          'Arquivo no tamanho e formato certos (PNG/JPG/MP4)',
          'Nome do arquivo no padrão: cliente_peca_formato_v1',
          'Versões para todos os formatos pedidos no briefing',
          'Fonte e arquivo aberto salvos na pasta do cliente'
        ])));
    } }
  ]
});
