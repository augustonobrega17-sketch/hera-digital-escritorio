/* =============================================================
   CONFIGURAÇÃO DA LOJA
   Tudo o que aparece no site sai daqui: nome, textos, banners,
   coleções, produtos, preços, contato.
   As FOTOS ficam na pasta /fotos — basta subir o arquivo com o
   nome indicado (ver fotos/LEIA-ME.txt). Enquanto a foto não
   existir, o site mostra um quadro com o nome do arquivo esperado.
   ============================================================= */
window.LOJA = {
  marca: {
    nome: 'FORJA118',
    slogan: 'Equipamento tático em miniatura',
    logo: 'logo.png',               // fotos/logo.png (opcional; sem ela aparece o nome em texto)
    cidade: 'Feito no Brasil',
  },

  // Quando o site estiver pronto para o público, troque para false:
  // os quadros vazios deixam de mostrar o nome do arquivo.
  mostrarAvisosDeFoto: true,

  contato: {
    whatsapp: '5585997767151',      // DDI + DDD + número, só dígitos
    email: 'contato@suamarca.com.br',
    instagram: 'https://instagram.com/',
    youtube: 'https://youtube.com/',
    facebook: 'https://facebook.com/',
  },

  barraAvisos: [
    'Frete grátis acima de R$ 199 · use o cupom FRETEGRATIS',
    'Arquivos STL com download imediato após o pagamento',
    'Peças impressas em resina 8K, prontas para pintar',
  ],

  banners: [
    {
      foto: 'banner-1.jpg',
      titulo: 'PEÇA SOB MEDIDA',
      texto: 'Precisa de uma cabeça, colete ou arma para fechar o seu projeto? A gente modela do jeito que você imaginou.',
      botao: 'Pedir orçamento',
      acao: 'whatsapp:Olá! Quero um orçamento de peça sob medida.',
    },
    {
      foto: 'banner-2.jpg',
      titulo: 'ENTRE PARA O PELOTÃO',
      texto: '10 arquivos STL novos entregues no seu arsenal todo mês.',
      botao: 'Quero assinar',
      acao: '#assinatura',
    },
    {
      foto: 'banner-3.jpg',
      titulo: 'LANÇAMENTOS DA SEMANA',
      texto: 'Novas cabeças, coletes e armas em escala 1/12 acabaram de chegar.',
      botao: 'Ver lançamentos',
      acao: 'catalogo:novo',
    },
  ],

  // Categorias: aparecem no menu, no carrossel de coleções e no catálogo
  categorias: [
    { id: 'cabecas',   nome: 'Cabeças',            foto: 'colecao-cabecas.jpg',   texto: 'O rosto conta a história. Esculturas com capacete, balaclava e expressões variadas.' },
    { id: 'coletes',   nome: 'Coletes & Blindagem',foto: 'colecao-coletes.jpg',   texto: 'Vista o operador. Porta-placas, coletes pesados, jaquetas e protetores.' },
    { id: 'headgear',  nome: 'Capacetes & Máscaras',foto: 'colecao-headgear.jpg', texto: 'Equipe de cima a baixo: capacetes, máscaras, shemaghs e lenços.' },
    { id: 'armas',     nome: 'Armas & Munição',    foto: 'colecao-armas.jpg',     texto: 'Armado e perigoso. Fuzis, pistolas, facas e ferramentas de brecha.' },
    { id: 'mochilas',  nome: 'Mochilas & Bolsas',  foto: 'colecao-mochilas.jpg',  texto: 'Todo operador precisa carregar algo: mochilas, rádios e hidratação.' },
    { id: 'kits',      nome: 'Kits Completos',     foto: 'colecao-kits.jpg',      texto: 'Monte o operador inteiro de uma vez, do capacete à bota.' },
  ],

  // Prateleiras da página inicial (na ordem em que aparecem)
  prateleiras: ['cabecas', 'coletes', 'headgear', 'armas', 'mochilas'],

  // Variações padrão (usadas quando o produto não define as dele)
  variacoesPadrao: [
    { nome: 'Arquivo STL (download)', acrescimo: 0 },
    { nome: 'Impresso em resina (sem pintura)', acrescimo: 30 },
  ],

  /* PRODUTOS
     id    -> também é o nome da foto: fotos/produtos/<id>.jpg
              fotos extras (opcional): <id>-2.jpg, <id>-3.jpg, <id>-4.jpg
     preco -> preço base em reais
     de    -> (opcional) preço antigo riscado
     selo  -> (opcional) 'Novo', 'Promo', 'Esgotado'...                      */
  produtos: [
    // Cabeças
    { id: 'cabeca-01', cat: 'cabecas', nome: 'Operador com Capacete Balístico (NVG abaixado)', preco: 16, selo: 'Novo' },
    { id: 'cabeca-02', cat: 'cabecas', nome: 'Operador com Capacete Balístico (NVG levantado)', preco: 16, selo: 'Novo' },
    { id: 'cabeca-03', cat: 'cabecas', nome: 'Operador com Capacete Balístico', preco: 16 },
    { id: 'cabeca-04', cat: 'cabecas', nome: 'Capacete com Balaclava II (NVG abaixado)', preco: 16 },
    { id: 'cabeca-05', cat: 'cabecas', nome: 'Capacete com Balaclava II (NVG levantado)', preco: 16 },
    { id: 'cabeca-06', cat: 'cabecas', nome: 'Capacete com Balaclava II', preco: 16 },
    { id: 'cabeca-07', cat: 'cabecas', nome: 'Veterano de Barba Cerrada', preco: 16 },
    { id: 'cabeca-08', cat: 'cabecas', nome: 'Recruta com Boina', preco: 16 },

    // Coletes & blindagem
    { id: 'colete-01', cat: 'coletes', nome: 'Placa Leve Recon', preco: 39.9 },
    { id: 'colete-02', cat: 'coletes', nome: 'Colete Pesado de Assalto', preco: 49.9, selo: 'Mais vendido' },
    { id: 'colete-03', cat: 'coletes', nome: 'Jaqueta de Campo de Coronel (Guerra Fria)', preco: 49.9 },
    { id: 'colete-04', cat: 'coletes', nome: 'Jaqueta Operador + Porta-Placas', preco: 49.9 },
    { id: 'colete-05', cat: 'coletes', nome: 'Colete Modular Gen 4', preco: 39.9 },
    { id: 'colete-06', cat: 'coletes', nome: 'Protetor de Coxa com Coldre Duplo', preco: 24.9 },
    { id: 'colete-07', cat: 'coletes', nome: 'Parka de Inverno (parte inferior)', preco: 29.9 },
    { id: 'colete-08', cat: 'coletes', nome: 'Protetor de Coxa', preco: 22.9, de: 29.9, selo: 'Promo' },

    // Capacetes & máscaras
    { id: 'headgear-01', cat: 'headgear', nome: 'Máscara Tática Palhaço', preco: 34.9 },
    { id: 'headgear-02', cat: 'headgear', nome: 'Máscara Tática Monstro', preco: 34.9 },
    { id: 'headgear-03', cat: 'headgear', nome: 'Shemagh Tático', preco: 19.9 },
    { id: 'headgear-04', cat: 'headgear', nome: 'Capacete Antibomba (EOD)', preco: 34.9 },
    { id: 'headgear-05', cat: 'headgear', nome: 'Colar de Proteção EOD', preco: 19.9 },
    { id: 'headgear-06', cat: 'headgear', nome: 'Capacete Bump com Headset', preco: 34.9 },
    { id: 'headgear-07', cat: 'headgear', nome: 'Elmo Cruzado', preco: 34.9 },
    { id: 'headgear-08', cat: 'headgear', nome: 'Lenço de Pescoço Selva', preco: 19.9 },

    // Armas
    { id: 'arma-01', cat: 'armas', nome: 'Faca Tática II', preco: 12.9 },
    { id: 'arma-02', cat: 'armas', nome: 'Faca Tática I', preco: 12.9 },
    { id: 'arma-03', cat: 'armas', nome: 'Martelo de Arrombamento', preco: 14.9 },
    { id: 'arma-04', cat: 'armas', nome: 'Kukri', preco: 12.9 },
    { id: 'arma-05', cat: 'armas', nome: 'Fuzil de Assalto Modular', preco: 29.9, selo: 'Novo' },
    { id: 'arma-06', cat: 'armas', nome: 'Pistola Compacta com Lanterna', preco: 14.9 },
    { id: 'arma-07', cat: 'armas', nome: 'Escopeta de Brecha', preco: 24.9 },
    { id: 'arma-08', cat: 'armas', nome: 'Fuzil de Precisão com Bipé', preco: 29.9 },

    // Mochilas
    { id: 'mochila-01', cat: 'mochilas', nome: 'Mochila Exoesqueleto', preco: 29.9 },
    { id: 'mochila-02', cat: 'mochilas', nome: 'Mochila de Interferência (Jammer)', preco: 29.9 },
    { id: 'mochila-03', cat: 'mochilas', nome: 'Alças Modulares', preco: 14.9 },
    { id: 'mochila-04', cat: 'mochilas', nome: 'Mochila com Armação de Munição', preco: 29.9 },
    { id: 'mochila-05', cat: 'mochilas', nome: 'Mochila de Assalto 24h', preco: 24.9 },
    { id: 'mochila-06', cat: 'mochilas', nome: 'Bolsa de Hidratação', preco: 14.9 },
    { id: 'mochila-07', cat: 'mochilas', nome: 'Rádio de Costas', preco: 24.9 },
    { id: 'mochila-08', cat: 'mochilas', nome: 'Mochila Médica', preco: 24.9 },

    // Kits completos (aparecem na faixa "Kits completos")
    { id: 'kit-01', cat: 'kits', nome: 'Kit Operador Urbano', preco: 149.9, de: 189.9, selo: 'Kit', variacoes: [
      { nome: 'Arquivos STL (download)', acrescimo: 0 }, { nome: 'Impresso em resina', acrescimo: 120 } ] },
    { id: 'kit-02', cat: 'kits', nome: 'Kit Atirador de Elite Ghillie', preco: 139.9, de: 169.9, selo: 'Kit', variacoes: [
      { nome: 'Arquivos STL (download)', acrescimo: 0 }, { nome: 'Impresso em resina', acrescimo: 120 } ] },
    { id: 'kit-03', cat: 'kits', nome: 'Kit Paraquedista 1944', preco: 129.9, selo: 'Kit', variacoes: [
      { nome: 'Arquivos STL (download)', acrescimo: 0 }, { nome: 'Impresso em resina', acrescimo: 110 } ] },
    { id: 'kit-04', cat: 'kits', nome: 'Kit Tropa de Choque', preco: 139.9, selo: 'Kit', variacoes: [
      { nome: 'Arquivos STL (download)', acrescimo: 0 }, { nome: 'Impresso em resina', acrescimo: 120 } ] },
  ],

  sobre: {
    foto: 'sobre.jpg',
    titulo: 'FEITO POR COLECIONADOR, PARA COLECIONADOR',
    texto: 'Somos hobbistas antes de tudo. Cada item da loja é algo que colocaríamos na nossa própria coleção. Nada de enchimento, nada de enrolação — só peças e figuras em escala 1/12 com qualidade de verdade.',
    botao: 'Fale com a gente',
  },

  assinatura: {
    foto: 'assinatura.jpg',
    titulo: 'ENTRE PARA O PELOTÃO',
    texto: 'Assine e receba 10 arquivos STL inéditos todo mês, direto no seu e-mail, com acesso antecipado aos lançamentos e desconto em peças impressas.',
    preco: 39.9,
    itens: ['10 arquivos STL novos por mês', 'Acesso antecipado aos lançamentos', '15% de desconto em peças impressas', 'Cancele quando quiser'],
    botao: 'Quero assinar',
  },

  faq: [
    { p: 'Como recebo os arquivos STL?', r: 'Logo após a confirmação do pagamento você recebe o link de download no e-mail e no WhatsApp. O link não expira.' },
    { p: 'As peças servem em quais bonecos?', r: 'Todas as peças são modeladas em escala 1/12 (cerca de 15 cm) e servem nas principais linhas de action figures dessa escala.' },
    { p: 'Vocês enviam peças impressas?', r: 'Sim. Imprimimos em resina 8K, sem pintura, e enviamos para todo o Brasil pelos Correios ou transportadora.' },
    { p: 'Qual o prazo de produção das peças impressas?', r: 'De 3 a 7 dias úteis para produção, mais o prazo do frete para a sua região.' },
    { p: 'Posso encomendar uma peça exclusiva?', r: 'Pode! Mande referências pelo WhatsApp e a gente devolve um orçamento em até 48 horas.' },
  ],

  rodape: {
    texto: 'Peças, cabeças e equipamentos em escala 1/12 para colecionadores exigentes.',
    copyright: 'Todos os direitos reservados.',
  },
};
