/* Duda · Copywriter
   Gerador por fórmula, banco de copies com teste A/B e contador de caracteres. */
const { el, fmt, N } = H;

const TIPOS = ['Anúncio Meta', 'Google Search', 'Landing page', 'E-mail', 'WhatsApp', 'Roteiro de vídeo', 'Legenda'];
const STATUS = ['rascunho', 'em teste', 'vencedora', 'descartada'];
const seloStatus = s => el('span', { class: 'selo ' + ({ vencedora: 'ok', 'em teste': 'info', descartada: 'ruim' }[s] || 'alerta') }, s || 'rascunho');

const CAMPOS = [
  { k: 'cliente', rot: 'Cliente', tipo: 'cliente' },
  { k: 'tipo', rot: 'Tipo', tipo: 'select', opcoes: TIPOS },
  { k: 'titulo', rot: 'Nome interno', dica: 'Ex.: BF | Escassez' },
  { k: 'variante', rot: 'Variante', tipo: 'select', opcoes: ['A', 'B', 'C', 'D'] },
  { k: 'status', rot: 'Status', tipo: 'select', opcoes: STATUS },
  { k: 'ctr', rot: 'CTR / taxa de conversão (%)', tipo: 'number' },
  { k: 'texto', rot: 'Texto', tipo: 'textarea', largo: true, linhas: 6 }
];

/* limites que mais quebram campanha na hora de subir */
const LIMITES = [
  ['Meta Ads · texto principal (antes do "ver mais")', 125],
  ['Meta Ads · título', 40],
  ['Google Ads · título', 30],
  ['Google Ads · descrição', 90],
  ['Assunto de e-mail (leitura no celular)', 50],
  ['Meta description (SEO)', 160],
  ['Title tag (SEO)', 60],
  ['Bio do Instagram', 150],
  ['Legenda do Instagram', 2200],
  ['Post do LinkedIn (antes do "ver mais")', 210]
];

/** fórmulas clássicas de copy, preenchidas com o briefing */
function gerar(b) {
  const p = b.produto || '[produto]', pub = b.publico || '[público]', dor = b.dor || '[dor]',
        ben = b.beneficio || '[benefício]', prova = b.prova || '[prova]', of = b.oferta || '[oferta]', cta = b.cta || '[chamada para ação]';
  return [
    ['AIDA', `Atenção: ${pub}, ${dor.toLowerCase()} não precisa ser normal.\n\nInteresse: com ${p}, você consegue ${ben.toLowerCase()}.\n\nDesejo: ${prova}.\n\nAção: ${of}. ${cta}.`],
    ['PAS (Problema, Agitação, Solução)', `${dor}?\n\nE o pior: cada dia que passa, isso custa tempo, dinheiro e paciência. Você já tentou de tudo e nada resolve de vez.\n\n${p} foi feito para ${pub.toLowerCase()} que querem ${ben.toLowerCase()}. ${prova}.\n\n${of}. ${cta}.`],
    ['Antes, Depois e Ponte', `Antes: ${dor.toLowerCase()}.\nDepois: imagine ${ben.toLowerCase()}.\nA ponte: ${p}. ${prova}.\n\n${cta}.`],
    ['4U (Útil, Urgente, Único, Ultra-específico)', `${ben} com ${p}: ${of.toLowerCase()}, só por tempo limitado.`],
    ['Headlines para testar', [
      `Como ${ben.toLowerCase()} sem ${dor.toLowerCase()}`,
      `${pub}: o jeito mais simples de ${ben.toLowerCase()}`,
      `Chega de ${dor.toLowerCase()}. Conheça ${p}`,
      `${prova}. Agora é a sua vez`,
      `O erro que impede você de ${ben.toLowerCase()}`,
      `${of}: ${ben.toLowerCase()} a partir de hoje`,
      `Por que ${pub.toLowerCase()} estão trocando tudo por ${p}`,
      `${ben} em poucos dias? Veja como`
    ].map((h, i) => (i + 1) + '. ' + h).join('\n')],
    ['Anúncio curto (Meta, até 125 caracteres)', `${dor}? ${p}: ${ben.toLowerCase()}. ${cta}.`],
    ['Assunto de e-mail (3 opções)', `1. ${ben} (sem ${dor.toLowerCase()})\n2. ${of} termina hoje\n3. ${pub}, isto é para você`]
  ];
}

H.app({
  titulo: 'Copywriter', papel: 'Duda · texto que vende: anúncios, páginas e e-mails', emoji: '✍️', cor: '#FFB547',
  colecoes: ['copies'],
  abas: [
    { id: 'gerador', nome: 'Gerador de copy', render: async m => {
      const b = { cliente: '', produto: '', publico: '', dor: '', beneficio: '', prova: '', oferta: '', cta: 'Clique e fale com a gente' };
      const campos = [
        ['produto', 'Produto ou serviço', 'Ex.: implante dentário com avaliação gratuita'],
        ['publico', 'Público', 'Ex.: adultos de 35 a 60 anos'],
        ['dor', 'Dor', 'Ex.: vergonha de sorrir em fotos'],
        ['beneficio', 'Benefício principal', 'Ex.: voltar a sorrir com segurança'],
        ['prova', 'Prova', 'Ex.: mais de 2.000 pacientes atendidos'],
        ['oferta', 'Oferta', 'Ex.: avaliação gratuita e parcelamento em 18x'],
        ['cta', 'Chamada para ação', '']
      ];
      const saida = el('div', { class: 'grade', style: 'margin-top:14px' });
      const cliSel = await H.filtroCliente(v => { b.cliente = v; });
      cliSel.firstChild.textContent = 'Cliente (opcional)';
      m.append(el('h2', {}, 'Gerador de copy'),
        el('p', { class: 'sub' }, 'Preencha o briefing e receba o texto nas fórmulas clássicas. É um ponto de partida: ajuste o tom de cada cliente.'),
        el('div', { class: 'card' },
          el('div', { class: 'filtros' }, cliSel),
          el('div', { class: 'linha-campos' }, campos.map(([k, r, d]) =>
            el('label', { class: 'campo' }, r, el('input', { placeholder: d, value: b[k], oninput: e => { b[k] = e.target.value; pinta(); } }))))),
        saida);
      function pinta() {
        saida.innerHTML = '';
        for (const [nome, txt] of gerar(b)) {
          saida.appendChild(el('div', { class: 'card' },
            el('div', { class: 'cab', style: 'margin-bottom:8px' }, el('h3', { style: 'margin:0' }, nome),
              el('div', { class: 'acoes' },
                el('span', { class: 'contador' }, txt.length + ' caracteres'),
                el('button', { class: 'btn mini', onclick: () => H.copiar(txt) }, 'Copiar'),
                el('button', { class: 'btn mini pri', onclick: async () => {
                  const lista = await H.col('copies');
                  await H.salvar('copies', [{ id: H.uid('k'), cliente: b.cliente, tipo: nome.startsWith('Assunto') ? 'E-mail' : 'Anúncio Meta',
                    titulo: nome + (b.produto ? ' | ' + b.produto.slice(0, 30) : ''), texto: txt, variante: 'A', status: 'rascunho', ctr: 0 }, ...lista]);
                  H.toast('Salvo no banco de copies.');
                } }, 'Salvar no banco'))),
            el('div', { class: 'saida' }, txt)));
        }
      }
      pinta();
    } },

    { id: 'banco', nome: 'Banco de copies', render: async m => {
      await H.crud(m, {
        col: 'copies', titulo: 'Banco de copies', item: 'copy', botao: 'Nova copy',
        sub: 'Toda copy que foi ao ar, com a variante e o resultado. A vencedora vira referência para o próximo teste.',
        campos: CAMPOS, novo: { tipo: 'Anúncio Meta', variante: 'A', status: 'rascunho' },
        resumo: l => H.kpis([
          { rot: 'Copies', val: l.length },
          { rot: 'Em teste', val: l.filter(c => c.status === 'em teste').length, cor: 'var(--pavao)' },
          { rot: 'Vencedoras', val: l.filter(c => c.status === 'vencedora').length, cor: 'var(--verde)' },
          { rot: 'Melhor CTR', val: l.length ? fmt.dec(Math.max(...l.map(c => N(c.ctr))), 1) + '%' : '—', cor: 'var(--ouro)' }
        ]),
        colunas: [
          { k: 'cliente', rot: 'Cliente' }, { k: 'tipo', rot: 'Tipo' }, { k: 'titulo', rot: 'Nome' },
          { k: 'variante', rot: 'Var.' },
          { k: 'texto', rot: 'Texto', quebra: true, fmt: v => String(v || '').slice(0, 140) + (String(v || '').length > 140 ? '…' : '') },
          { k: 'ctr', rot: 'CTR', num: true, fmt: v => N(v) ? fmt.dec(v, 1) + '%' : '—' },
          { k: 'status', rot: 'Status', fmt: seloStatus }
        ]
      });
    } },

    { id: 'contador', nome: 'Contador de caracteres', render: m => {
      const txt = el('textarea', { rows: 6, placeholder: 'Cole o texto aqui…', oninput: () => pinta() });
      const area = el('div', { class: 'card', style: 'margin-top:14px' });
      m.append(el('h2', {}, 'Contador de caracteres'),
        el('p', { class: 'sub' }, 'Confira se o texto cabe em cada plataforma antes de subir a campanha.'), txt, area);
      function pinta() {
        const n = txt.value.length, palavras = (txt.value.trim().match(/\S+/g) || []).length;
        area.innerHTML = '';
        area.append(el('h3', {}, `${n} caracteres · ${palavras} palavras · ${fmt.dec(palavras / 200, 1)} min de leitura`),
          el('div', { class: 'barras' }, LIMITES.map(([rot, lim]) => el('div', { class: 'barra' },
            el('span', { class: 'rot', title: rot }, rot),
            el('span', { class: 'trilho' }, el('i', { style: `width:${Math.min(100, n / lim * 100)}%;background:${n > lim ? 'var(--rosa)' : 'var(--cor)'}` })),
            el('span', { class: 'val contador' + (n > lim ? ' estourou' : '') }, `${n}/${lim}`)))));
      }
      pinta();
    } }
  ]
});
