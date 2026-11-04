/* ===========================================================
   Dados de exemplo da Hera Digital.

   Cada coleção nasce daqui na primeira vez que alguém a abre e, a partir
   daí, vive em sistemas/_dados/<colecao>.json. Os clientes e números são
   FICTÍCIOS, só para os sistemas não abrirem vazios: troque pelos reais
   (ou use "Limpar" em cada sistema).
   =========================================================== */
const C = {
  sorriso: 'Clínica Sorriso Pleno',
  bella:   'Bella Moda Store',
  fit:     'FitLife Academia',
  hor:     'Construtora Horizonte',
  cafe:    'Café Aurora',
  marina:  'Dra. Marina Lopes Dermatologia'
};

module.exports = {

  /* ---------- Atendimento (Bia): a carteira da Hera ---------- */
  clientes: [
    { id: 'c1', nome: C.sorriso, segmento: 'Odontologia', plano: 'Crescimento', fee: 6500, inicio: '2025-08-01', saude: 'ótima', contato: 'Dr. Paulo Reis', proximoContato: '2026-11-10', servicos: 'Tráfego, social, landing page', nps: 9 },
    { id: 'c2', nome: C.bella, segmento: 'E-commerce de moda', plano: 'Premium', fee: 12000, inicio: '2025-03-15', saude: 'ótima', contato: 'Camila Duarte', proximoContato: '2026-11-06', servicos: 'Tráfego, social, criativos, e-mail, BI', nps: 10 },
    { id: 'c3', nome: C.fit, segmento: 'Fitness', plano: 'Essencial', fee: 3800, inicio: '2026-02-01', saude: 'atenção', contato: 'Rodrigo Alves', proximoContato: '2026-11-05', servicos: 'Tráfego e social', nps: 7 },
    { id: 'c4', nome: C.hor, segmento: 'Imobiliário', plano: 'Premium', fee: 15000, inicio: '2024-11-01', saude: 'ótima', contato: 'Fernanda Lima', proximoContato: '2026-11-12', servicos: 'Estratégia, tráfego, vídeo, SEO, BI', nps: 9 },
    { id: 'c5', nome: C.cafe, segmento: 'Food service', plano: 'Essencial', fee: 2900, inicio: '2026-05-10', saude: 'risco', contato: 'Lucas Moreira', proximoContato: '2026-11-04', servicos: 'Social media', nps: 5 },
    { id: 'c6', nome: C.marina, segmento: 'Saúde e estética', plano: 'Crescimento', fee: 5500, inicio: '2025-10-20', saude: 'ótima', contato: 'Dra. Marina Lopes', proximoContato: '2026-11-18', servicos: 'Tráfego, social, SEO', nps: 8 }
  ],

  aprovacoes: [
    { id: 'a1', cliente: C.bella, item: 'Campanha Black Friday: 6 criativos', tipo: 'Criativos', prazo: '2026-11-07', status: 'pendente' },
    { id: 'a2', cliente: C.sorriso, item: 'Calendário de dezembro', tipo: 'Calendário', prazo: '2026-11-15', status: 'pendente' },
    { id: 'a3', cliente: C.hor, item: 'Vídeo do decorado Torre Norte', tipo: 'Vídeo', prazo: '2026-11-08', status: 'ajustes' },
    { id: 'a4', cliente: C.fit, item: 'Landing page plano anual', tipo: 'Página', prazo: '2026-11-05', status: 'aprovado' },
    { id: 'a5', cliente: C.cafe, item: 'Proposta de reativação do perfil', tipo: 'Estratégia', prazo: '2026-11-06', status: 'pendente' }
  ],

  /* ---------- Tráfego (Léo) ---------- */
  campanhas: [
    { id: 't1', cliente: C.bella, plataforma: 'Meta Ads', nome: 'BF | Catálogo | Remarketing', objetivo: 'Vendas', status: 'ativa', orcDia: 450, investido: 9200, impressoes: 820000, cliques: 14600, leads: 0, vendas: 612, receita: 58400, roasMeta: 4 },
    { id: 't2', cliente: C.bella, plataforma: 'Google Ads', nome: 'Shopping | Vestidos', objetivo: 'Vendas', status: 'ativa', orcDia: 300, investido: 6100, impressoes: 410000, cliques: 9800, leads: 0, vendas: 298, receita: 27100, roasMeta: 4 },
    { id: 't3', cliente: C.sorriso, plataforma: 'Meta Ads', nome: 'Leads | Implante | Lookalike', objetivo: 'Leads', status: 'ativa', orcDia: 120, investido: 2650, impressoes: 198000, cliques: 3900, leads: 214, vendas: 19, receita: 66500, roasMeta: 8 },
    { id: 't4', cliente: C.sorriso, plataforma: 'Google Ads', nome: 'Pesquisa | Dentista perto de mim', objetivo: 'Leads', status: 'ativa', orcDia: 90, investido: 1980, impressoes: 41000, cliques: 2600, leads: 131, vendas: 14, receita: 42000, roasMeta: 8 },
    { id: 't5', cliente: C.fit, plataforma: 'Meta Ads', nome: 'Matrícula | Plano anual', objetivo: 'Leads', status: 'ativa', orcDia: 80, investido: 1720, impressoes: 156000, cliques: 1900, leads: 88, vendas: 9, receita: 3150, roasMeta: 3 },
    { id: 't6', cliente: C.hor, plataforma: 'Meta Ads', nome: 'Lançamento Torre Norte | Leads', objetivo: 'Leads', status: 'ativa', orcDia: 600, investido: 14800, impressoes: 990000, cliques: 12100, leads: 476, vendas: 3, receita: 1650000, roasMeta: 20 },
    { id: 't7', cliente: C.hor, plataforma: 'Google Ads', nome: 'Pesquisa | Apartamento 3 quartos', objetivo: 'Leads', status: 'pausada', orcDia: 250, investido: 4300, impressoes: 88000, cliques: 3100, leads: 97, vendas: 0, receita: 0, roasMeta: 20 },
    { id: 't8', cliente: C.marina, plataforma: 'TikTok Ads', nome: 'Skincare | Avaliação gratuita', objetivo: 'Leads', status: 'ativa', orcDia: 70, investido: 1350, impressoes: 260000, cliques: 3300, leads: 102, vendas: 21, receita: 12600, roasMeta: 5 }
  ],

  /* ---------- Estratégia (Lia) ---------- */
  planos: [
    { id: 'p1', cliente: C.bella, objetivo: 'Faturar R$ 1,2 mi no e-commerce no 4º trimestre', publico: 'Mulheres de 22 a 38 anos, classes B e C, que compram moda pelo Instagram', dor: 'Roupa bonita que não chega no prazo ou não veste bem', posicionamento: 'A loja que veste a mulher real, com entrega rápida e troca fácil', proposta: 'Moda acessível com troca grátis em 30 dias', canais: 'Meta Ads (60%), Google Shopping (25%), e-mail e WhatsApp (15%)', orcamento: 45000, meta: 'ROAS 4 e 3.500 pedidos/mês', prazo: '2026-12-31', status: 'em execução', forcas: 'Comunidade engajada; ótimo custo por compra', fraquezas: 'Dependência do Instagram; estoque curto', oportunidades: 'Black Friday e Natal; TikTok Shop', ameacas: 'Grandes marketplaces com frete grátis' },
    { id: 'p2', cliente: C.hor, objetivo: 'Vender 60% das unidades da Torre Norte em 6 meses', publico: 'Famílias de 30 a 50 anos buscando o 1º ou 2º imóvel', dor: 'Medo de comprar na planta e a obra atrasar', posicionamento: 'Construtora que entrega no prazo há 18 anos', proposta: 'Entrada facilitada e garantia de prazo em contrato', canais: 'Meta Ads, Google Pesquisa, vídeo do decorado, SEO local', orcamento: 60000, meta: '1.800 leads qualificados e 72 vendas', prazo: '2027-04-30', status: 'aprovado', forcas: 'Histórico de entregas; localização', fraquezas: 'Marca pouco conhecida no digital', oportunidades: 'Juros caindo; programas de financiamento', ameacas: 'Concorrentes com preço menor' },
    { id: 'p3', cliente: C.cafe, objetivo: 'Reativar o perfil e dobrar o movimento no fim de semana', publico: 'Moradores do bairro e quem trabalha por perto', dor: 'Não conhecem o café nem o cardápio', posicionamento: 'O café de bairro com cara de casa', proposta: 'Brunch de sábado e café especial', canais: 'Instagram orgânico, Google Meu Negócio, Meta Ads local', orcamento: 3500, meta: '+40% de clientes aos sábados', prazo: '2027-01-31', status: 'rascunho', forcas: 'Produto excelente', fraquezas: 'Perfil parado há 4 meses', oportunidades: 'Busca local no Google', ameacas: 'Redes grandes de café' }
  ],

  /* ---------- Social (Nico) ---------- */
  posts: [
    { id: 's1', cliente: C.bella, rede: 'Instagram', formato: 'Reels', tema: '3 looks com 1 vestido', gancho: 'Você não precisa de 10 vestidos, precisa deste', legenda: '', data: '2026-11-05', etapa: 'Agendado', alcance: 0, curtidas: 0, comentarios: 0, salvos: 0, compart: 0 },
    { id: 's2', cliente: C.bella, rede: 'Instagram', formato: 'Carrossel', tema: 'Guia de medidas', gancho: 'Pare de errar o tamanho na compra online', legenda: '', data: '2026-10-28', etapa: 'Publicado', alcance: 48200, curtidas: 3100, comentarios: 210, salvos: 1890, compart: 640 },
    { id: 's3', cliente: C.sorriso, rede: 'Instagram', formato: 'Reels', tema: 'Antes e depois de lentes', gancho: 'Ele achava que sorriso bonito era genética', legenda: '', data: '2026-10-30', etapa: 'Publicado', alcance: 22100, curtidas: 1240, comentarios: 96, salvos: 410, compart: 230 },
    { id: 's4', cliente: C.sorriso, rede: 'TikTok', formato: 'Vídeo', tema: 'Mitos sobre clareamento', gancho: 'Clareamento estraga o dente? Verdade ou mito', legenda: '', data: '2026-11-08', etapa: 'Design', alcance: 0, curtidas: 0, comentarios: 0, salvos: 0, compart: 0 },
    { id: 's5', cliente: C.fit, rede: 'Instagram', formato: 'Stories', tema: 'Desafio 21 dias', gancho: 'Topa o desafio?', legenda: '', data: '2026-11-06', etapa: 'Aprovação', alcance: 0, curtidas: 0, comentarios: 0, salvos: 0, compart: 0 },
    { id: 's6', cliente: C.cafe, rede: 'Instagram', formato: 'Reels', tema: 'Bastidores do brunch', gancho: 'Às 6h da manhã já tem gente aqui fazendo isto', legenda: '', data: '2026-11-09', etapa: 'Roteiro', alcance: 0, curtidas: 0, comentarios: 0, salvos: 0, compart: 0 },
    { id: 's7', cliente: C.marina, rede: 'Instagram', formato: 'Carrossel', tema: 'Rotina de skincare por idade', gancho: 'Sua pele aos 30 não é a mesma de aos 20', legenda: '', data: '2026-10-25', etapa: 'Publicado', alcance: 15400, curtidas: 980, comentarios: 64, salvos: 1220, compart: 310 },
    { id: 's8', cliente: C.hor, rede: 'LinkedIn', formato: 'Post', tema: '18 anos de entregas no prazo', gancho: 'Prometemos 214 vezes. Cumprimos 214 vezes.', legenda: '', data: '2026-11-12', etapa: 'Ideia', alcance: 0, curtidas: 0, comentarios: 0, salvos: 0, compart: 0 }
  ],

  /* ---------- Copy (Duda) ---------- */
  copies: [
    { id: 'k1', cliente: C.bella, tipo: 'Anúncio Meta', titulo: 'BF | Escassez', texto: 'Só até domingo: 40% OFF em toda a loja e troca grátis em 30 dias. Seu look de fim de ano está aqui.', variante: 'A', status: 'vencedora', ctr: 2.4 },
    { id: 'k2', cliente: C.bella, tipo: 'Anúncio Meta', titulo: 'BF | Benefício', texto: 'Vestidos que vestem de verdade, com entrega em 48h. Black Friday com até 40% OFF.', variante: 'B', status: 'em teste', ctr: 1.7 },
    { id: 'k3', cliente: C.sorriso, tipo: 'Google Search', titulo: 'Implante | Pesquisa', texto: 'Implante Dentário em SP | Avaliação Gratuita | Parcele em até 18x', variante: 'A', status: 'em teste', ctr: 6.1 },
    { id: 'k4', cliente: C.fit, tipo: 'E-mail', titulo: 'Plano anual | Última chance', texto: 'Assunto: Sua vaga com 30% OFF expira hoje', variante: 'A', status: 'rascunho', ctr: 0 }
  ],

  /* ---------- Design (Íris) ---------- */
  criativos: [
    { id: 'd1', cliente: C.bella, peca: 'BF: 6 criativos de catálogo', formato: 'Feed 1080x1350', briefing: 'Fundo off-white, foto de produto, selo -40%', prazo: '2026-11-06', etapa: 'Revisão' },
    { id: 'd2', cliente: C.hor, peca: 'Banner Torre Norte', formato: 'Banner 1200x628', briefing: 'Fachada ao entardecer, CTA Agende sua visita', prazo: '2026-11-09', etapa: 'Criando' },
    { id: 'd3', cliente: C.sorriso, peca: 'Capa de destaques', formato: 'Quadrado 1080x1080', briefing: '5 ícones na paleta da clínica', prazo: '2026-11-12', etapa: 'Briefing' },
    { id: 'd4', cliente: C.marina, peca: 'Carrossel skincare', formato: 'Feed 1080x1350', briefing: '7 cards, tons nude, tipografia serifada', prazo: '2026-10-24', etapa: 'Entregue' },
    { id: 'd5', cliente: C.fit, peca: 'Stories desafio 21 dias', formato: 'Stories 1080x1920', briefing: 'Energia, laranja e preto, contagem regressiva', prazo: '2026-11-05', etapa: 'Aprovado' }
  ],
  paletas: [
    { id: 'pl1', cliente: C.bella, cores: '#1B1B1F, #F4EDE4, #C8102E, #D9B99B', fontes: 'Playfair Display + Inter', observacoes: 'Fotos sempre com luz natural' },
    { id: 'pl2', cliente: C.sorriso, cores: '#0F4C81, #5BC0EB, #FFFFFF, #F5F7FA', fontes: 'Poppins', observacoes: 'Nada de imagens de dente com sangue ou ferramentas' },
    { id: 'pl3', cliente: C.hor, cores: '#1F2A38, #C9A86A, #EFEAE2', fontes: 'Montserrat + Lora', observacoes: 'Selo "18 anos entregando no prazo" em toda peça' }
  ],

  /* ---------- Vídeo (Theo) ---------- */
  videos: [
    { id: 'v1', cliente: C.hor, titulo: 'Tour pelo decorado Torre Norte', tipo: 'Anúncio', duracao: 45, gancho: 'Abra a porta do seu novo apartamento', prazo: '2026-11-08', etapa: 'Revisão' },
    { id: 'v2', cliente: C.bella, titulo: '3 looks com 1 vestido', tipo: 'Reels', duracao: 30, gancho: 'Você não precisa de 10 vestidos', prazo: '2026-11-04', etapa: 'Entregue' },
    { id: 'v3', cliente: C.sorriso, titulo: 'Depoimento paciente implante', tipo: 'Reels', duracao: 40, gancho: 'Eu tinha vergonha de sorrir em foto', prazo: '2026-11-11', etapa: 'Captação' },
    { id: 'v4', cliente: C.cafe, titulo: 'Bastidores do brunch', tipo: 'Reels', duracao: 25, gancho: 'Às 6h da manhã já tem gente aqui', prazo: '2026-11-09', etapa: 'Roteiro' }
  ],

  /* ---------- SEO (Gabi) ---------- */
  keywords: [
    { id: 'w1', cliente: C.sorriso, palavra: 'implante dentário preço', volume: 9900, dificuldade: 48, intencao: 'transacional', posicao: 14 },
    { id: 'w2', cliente: C.sorriso, palavra: 'lente de contato dental', volume: 18100, dificuldade: 62, intencao: 'comercial', posicao: 0 },
    { id: 'w3', cliente: C.marina, palavra: 'dermatologista em pinheiros', volume: 1300, dificuldade: 22, intencao: 'transacional', posicao: 4 },
    { id: 'w4', cliente: C.marina, palavra: 'como tratar melasma', volume: 6600, dificuldade: 35, intencao: 'informacional', posicao: 21 },
    { id: 'w5', cliente: C.hor, palavra: 'apartamento 3 quartos na planta', volume: 2400, dificuldade: 41, intencao: 'transacional', posicao: 9 },
    { id: 'w6', cliente: C.hor, palavra: 'como financiar imóvel na planta', volume: 5400, dificuldade: 38, intencao: 'informacional', posicao: 0 }
  ],
  artigos: [
    { id: 'r1', cliente: C.marina, titulo: 'Melasma: causas, tratamento e o que evitar', palavra: 'como tratar melasma', etapa: 'Revisão', data: '2026-11-10', palavras: 1800 },
    { id: 'r2', cliente: C.hor, titulo: 'Guia completo para financiar um imóvel na planta', palavra: 'como financiar imóvel na planta', etapa: 'Escrevendo', data: '2026-11-17', palavras: 2400 },
    { id: 'r3', cliente: C.sorriso, titulo: 'Quanto custa um implante dentário em 2026', palavra: 'implante dentário preço', etapa: 'Publicado', data: '2026-10-15', palavras: 1600 }
  ],

  /* ---------- Comercial (Rafa): o funil da própria Hera ---------- */
  pipeline: [
    { id: 'l1', empresa: 'Pet Shop Amigo Fiel', contato: 'Júlia Ramos', segmento: 'Pet', origem: 'Instagram', valor: 4200, etapa: 'Proposta', proximoPasso: 'Ligar para tirar dúvidas da proposta', data: '2026-11-05' },
    { id: 'l2', empresa: 'Escola Bilíngue Aprender', contato: 'Marcos Tavares', segmento: 'Educação', origem: 'Indicação', valor: 7800, etapa: 'Reunião', proximoPasso: 'Reunião de diagnóstico', data: '2026-11-07' },
    { id: 'l3', empresa: 'Studio Pilates Equilíbrio', contato: 'Renata Souza', segmento: 'Fitness', origem: 'Site', valor: 2900, etapa: 'Contato feito', proximoPasso: 'Mandar cases de fitness', data: '2026-11-06' },
    { id: 'l4', empresa: 'Advocacia Prado & Lima', contato: 'Dr. Henrique Prado', segmento: 'Jurídico', origem: 'Prospecção ativa', valor: 5500, etapa: 'Lead', proximoPasso: 'Primeiro contato no LinkedIn', data: '2026-11-08' },
    { id: 'l5', empresa: 'Hamburgueria Brasa', contato: 'Diego Martins', segmento: 'Food service', origem: 'Evento', valor: 3300, etapa: 'Negociação', proximoPasso: 'Ajustar escopo para caber no orçamento', data: '2026-11-04' },
    { id: 'l6', empresa: 'Ótica Visão Clara', contato: 'Patrícia Gomes', segmento: 'Varejo', origem: 'Indicação', valor: 3600, etapa: 'Perdido', proximoPasso: 'Fechou com agência mais barata', data: '2026-10-20' }
  ]
};
