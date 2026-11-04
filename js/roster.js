/* ===========================================================
   roster.js — quem trabalha aqui.
   BOSSES  : você (sempre em serviço, na Diretoria)
   CATALOG : o agente de exemplo + vagas sugeridas para começar
   =========================================================== */
const ROSTER = (() => {

  const KEY = 'hera-digital-equipe-v1';

  /* ===========================================================
     O DONO — o nome vem de data/config.json ("dono")
     =========================================================== */
  const BOSSES = [
    {
      id: 'boss-1', name: (window.ESCRITORIO && ESCRITORIO.dono) || 'Augusto', role: 'Fundador & CEO · Hera Digital',
      emoji: '👑', boss: true, dept: 'diretoria', slotId: 'DIR-1',
      status: 'trabalhando', locked: true,
      source: 'Sala do chefe', sistema: null,
      brief: 'Dono da Hera Digital. Define a estratégia, aprova as campanhas e cuida dos clientes-chave.',
      look: {
        skin: '#d9a17a', hair: '#2a1d14', style: 'curto',
        shirt: '#6C3BFF', pants: '#1a1338', shoes: '#15181f',
        glasses: null, beard: null, tattoo: false, cap: false,
        uniforme: false
      }
    }
  ];

  /* ===========================================================
     BANCO DE TALENTOS
     'detectado' = tem sistema no registro (data/sistemas.json)
     'sugerido'  = vaga de ideia; contrate e depois ligue um sistema a ela
     =========================================================== */
  const CATALOG = [
    {
      key: 'exemplo', name: 'EXEMPLO', role: 'Agente de demonstração', emoji: '🤖',
      cat: 'detectado', system: 'Agente de exemplo', sistema: 'exemplo',
      desc: 'Um sistema mínimo que vem junto, na pasta exemplo-agente: sobe na porta 4401 e mostra uma página.',
      why: 'Serve de molde. Clique no computador dele para ver o escritório ligar, embutir e conversar com um sistema. Depois cadastre os seus.',
      look: { skin: '#c9854f', hair: '#140f0c', style: 'cacheado', shirt: '#38bdf8', pants: '#26304a', glasses: null, beard: null }
    },
    {
      key: 'estrategia', name: 'Lia', role: 'Estratégia & Planejamento', emoji: '🧭', cat: 'sugerido',
      desc: 'Monta o plano de marketing de cada cliente: posicionamento, público, canais, metas e orçamento.',
      why: 'Sem plano, cada área puxa para um lado. Ela dá o norte para tráfego, conteúdo e design.',
      look: { skin: '#f0c29b', hair: '#140f0c', style: 'longo', shirt: '#6C3BFF', pants: '#1a1338', glasses: 'retangular', beard: null }
    },
    {
      key: 'trafego', name: 'Léo', role: 'Gestor de Tráfego Pago', emoji: '🎯', cat: 'sugerido',
      desc: 'Cria e otimiza campanhas no Meta Ads, Google Ads e TikTok Ads de olho em CAC e ROAS.',
      why: 'É quem transforma verba em cliente. Ajuste diário de lance e público faz a diferença no fim do mês.',
      look: { skin: '#c9854f', hair: '#241a13', style: 'fade', shirt: '#12D6C5', pants: '#1a1338', glasses: null, beard: 'cavanhaque' }
    },
    {
      key: 'social', name: 'Nico', role: 'Social Media', emoji: '📱', cat: 'sugerido',
      desc: 'Planeja o calendário, roteiriza reels, escreve legendas e responde a comunidade.',
      why: 'Constância nas redes custa tempo. Com pauta e rascunho prontos, o cliente só aprova.',
      look: { skin: '#e0a878', hair: '#5a3a22', style: 'longo', shirt: '#FF4F8B', pants: '#26204a', glasses: null, beard: null }
    },
    {
      key: 'copy', name: 'Duda', role: 'Copywriter', emoji: '✍️', cat: 'sugerido',
      desc: 'Escreve anúncios, páginas de venda e e-mails, e testa variações de gancho e oferta.',
      why: 'Texto é o que converte. Ter variações prontas acelera qualquer teste A/B.',
      look: { skin: '#f7d7bd', hair: '#8b5a2b', style: 'curto', shirt: '#FFB547', pants: '#1a1338', glasses: 'retangular', beard: null }
    },
    {
      key: 'design', name: 'Íris', role: 'Designer & Direção de Arte', emoji: '🎨', cat: 'sugerido',
      desc: 'Cria criativos, carrosséis, identidades visuais e mantém cada cliente fiel à própria marca.',
      why: 'Criativo bom é metade do resultado do anúncio. E é o que faz a agência parecer premium.',
      look: { skin: '#7a4a2c', hair: '#140f0c', style: 'cacheado', shirt: '#8A5CFF', pants: '#26204a', glasses: 'redondo', beard: null }
    },
    {
      key: 'video', name: 'Theo', role: 'Editor de Vídeo', emoji: '🎬', cat: 'sugerido',
      desc: 'Edita reels, anúncios em vídeo e cortes de lives com legenda, ritmo e gancho nos 3 primeiros segundos.',
      why: 'Vídeo curto é o formato que mais entrega hoje. Edição rápida mantém o calendário em dia.',
      look: { skin: '#f0c29b', hair: '#2a1d14', style: 'fade', shirt: '#1f2a44', pants: '#1a1338', glasses: null, beard: 'cheia' }
    },
    {
      key: 'seo', name: 'Gabi', role: 'SEO & Blog', emoji: '🔎', cat: 'sugerido',
      desc: 'Pesquisa palavras-chave, escreve artigos e cuida do site para aparecer no Google sem pagar clique.',
      why: 'Tráfego orgânico é o cliente que chega de graça todo mês. Demora, mas fica.',
      look: { skin: '#e0a878', hair: '#8b5a2b', style: 'coque', shirt: '#22c55e', pants: '#26204a', glasses: null, beard: null }
    },
    {
      key: 'dados', name: 'Cami', role: 'Dados & BI', emoji: '📊', cat: 'sugerido',
      desc: 'Junta os números de anúncios, site e CRM num painel e explica o que mudou na semana.',
      why: 'Com várias frentes rodando, alguém precisa olhar o todo e dizer o que está dando resultado.',
      look: { skin: '#f7d7bd', hair: '#140f0c', style: 'longo', shirt: '#5B2EE8', pants: '#1a1338', glasses: 'redondo', beard: null }
    },
    {
      key: 'atendimento', name: 'Bia', role: 'Atendimento & Sucesso do Cliente', emoji: '🤝', cat: 'sugerido',
      desc: 'Fala com os clientes, organiza aprovações, prazos e reuniões, e manda o relatório do mês.',
      why: 'Cliente bem atendido renova contrato. Ela é a ponte entre a agência e quem paga as contas.',
      look: { skin: '#7a4a2c', hair: '#140f0c', style: 'coque', shirt: '#14b8a6', pants: '#1a1338', glasses: null, beard: null }
    },
    {
      key: 'comercial', name: 'Rafa', role: 'Comercial & Prospecção', emoji: '💼', cat: 'sugerido',
      desc: 'Encontra empresas com potencial, faz o primeiro contato e monta as propostas da Hera.',
      why: 'É o topo do funil da própria agência: sem cliente novo entrando, a equipe para de crescer.',
      look: { skin: '#c9854f', hair: '#1a120d', style: 'curto', shirt: '#334155', pants: '#1a1338', glasses: 'retangular', beard: 'cheia' }
    }
  ];

  /* ===========================================================
     ESTADO
     =========================================================== */
  let team = [];

  function defaults() {
    const base = BOSSES.map(b => Object.assign({}, b, { look: Object.assign({}, b.look) }));
    // a Hera já abre com a equipe principal contratada, mais o agente de
    // exemplo que mostra como ligar um sistema de verdade
    for (const k of ['exemplo', 'estrategia', 'trafego', 'social', 'copy', 'design', 'dados', 'atendimento']) {
      const c = CATALOG.find(c => c.key === k);
      base.push(fromCatalog(c));
    }
    return base;
  }

  function fromCatalog(c) {
    return {
      id: 'ag-' + c.key,
      key: c.key,
      name: c.name,
      role: c.role,
      emoji: c.emoji,
      system: c.system || null,
      sistema: c.sistema || null,
      path: c.path || null,
      brief: c.desc,
      dept: 'servico',
      slotId: null,
      status: 'trabalhando',
      boss: false,
      locked: false,
      look: AVATAR.makeLook(c.key, c.look)
    };
  }

  /* ===========================================================
     PERSISTÊNCIA

     O disco manda. A equipe já morava só no localStorage do navegador
     e um dia voltou inteira ao padrão: nome que você deu, contratação,
     estação, horário — tudo perdido de uma vez, sem aviso. O navegador
     limpa storage quando quer. Agora o arquivo é data/equipe.json, no
     servidor, e o localStorage é só um espelho para quando ele estiver
     fora do ar.
     =========================================================== */
  const doLocal = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || 'null');
      return d && Array.isArray(d.team) && d.team.length ? d.team : null;
    } catch (e) { return null; }
  };

  async function load() {
    let vindoDoDisco = null;
    try {
      const d = await (await fetch('/api/equipe')).json();
      if (d && Array.isArray(d.team) && d.team.length) vindoDoDisco = d.team;
    } catch (e) { /* servidor fora: vale o que o navegador tiver */ }

    team = vindoDoDisco || doLocal() || defaults();
    recompor();              // equipe salva antes pode não ter os campos novos
    if (!vindoDoDisco) save();   // primeira vez ou migração: carimba no disco
  }

  /** reencaixa campos que chegaram depois de a equipe já ter sido salva,
      como o id do sistema que o agente opera */
  function recompor() {
    for (const a of team) {
      const c = CATALOG.find(c => c.key === a.key);
      if (c) {
        if (!a.sistema && c.sistema) a.sistema = c.sistema;
        if (c.path && a.path !== c.path) a.path = c.path;
      }
      const b = BOSSES.find(b => b.id === a.id);
      if (b && !a.sistema && b.sistema) a.sistema = b.sistema;
      // sem look o boneco não é desenhado: fica um funcionário invisível na
      // mesa. Reconstrói a partir da key, que é determinística — o mesmo
      // agente volta com a mesma cara de sempre.
      if (!a.look || !a.look.skin) {
        const base = (c && c.look) || (b && b.look) || {};
        a.look = AVATAR.makeLook(a.key || a.id, Object.assign({}, base));
      }
    }
  }

  let gravando = null;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ team, v: 1 })); }
    catch (e) { /* storage bloqueado: o disco ainda pega */ }
    // junta as chamadas seguidas num POST só — arrastar um agente dispara
    // save() várias vezes por segundo
    clearTimeout(gravando);
    gravando = setTimeout(() => {
      fetch('/api/equipe', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, v: 1 })
      }).catch(() => { /* offline: fica o espelho do navegador */ });
    }, 300);
  }

  function reset() { team = defaults(); save(); }

  /* ---------- operações ---------- */
  function hire(key) {
    const c = CATALOG.find(c => c.key === key);
    if (!c || team.some(a => a.key === key)) return null;
    const a = fromCatalog(c);
    team.push(a); save();
    return a;
  }

  function hireCustom(data) {
    const key = 'custom-' + Date.now().toString(36);
    const a = {
      id: 'ag-' + key, key,
      name: data.name || 'Novo agente',
      role: data.role || 'Função a definir',
      emoji: data.emoji || '🤖',
      system: data.system || null, path: data.path || null,
      sistema: data.sistema || null, reuniao: data.reuniao !== false,
      brief: data.brief || '',
      dept: 'servico', slotId: null, status: 'trabalhando',
      boss: false, locked: false, custom: true,
      look: AVATAR.makeLook(key, data.look || {})
    };
    team.push(a); save();
    return a;
  }

  function fire(id) {
    const i = team.findIndex(a => a.id === id);
    if (i < 0 || team[i].locked) return false;
    team.splice(i, 1); save();
    return true;
  }

  const get = (id) => team.find(a => a.id === id);
  const all = () => team;
  const isHired = (key) => team.some(a => a.key === key);
  const count = (st) => team.filter(a => a.status === st).length;

  return { BOSSES, CATALOG, load, save, reset, hire, hireCustom, fire,
           get, all, isHired, count, fromCatalog };
})();
