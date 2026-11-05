/* ===========================================================
   Meta Ads ao vivo · conta [5G] Brisanet
   Busca campanhas e métricas direto da Graph API (só leitura),
   guarda o último retrato em sistemas/_dados/meta-5g.json e
   atualiza sozinho a cada META_INTERVALO_MIN minutos (padrão 10).

   Configuração em sistemas/trafego/.env.local (fora do git):
     META_TOKEN=...            token com ads_read
     META_CONTA=act_941108400856705
     META_API_VERSION=v24.0
     META_INTERVALO_MIN=10
   =========================================================== */
const fs = require('fs');
const path = require('path');

const PASTA = __dirname;
const CACHE = path.join(PASTA, '..', '_dados', 'meta-5g.json');

function lerEnv() {
  const env = {};
  try {
    for (const linha of fs.readFileSync(path.join(PASTA, '.env.local'), 'utf8').split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch (e) { /* sem arquivo: usa só process.env */ }
  return k => process.env[k] || env[k] || '';
}
const cfg = lerEnv();
let TOKEN = cfg('META_TOKEN');   // relido a cada atualização: trocar no .env.local basta, sem reiniciar
const CONTA = cfg('META_CONTA') || 'act_941108400856705';
const VERSAO = cfg('META_API_VERSION') || 'v24.0';
const INTERVALO = Math.max(3, Number(cfg('META_INTERVALO_MIN')) || 10) * 60e3;
const BASE = `https://graph.facebook.com/${VERSAO}`;

const espera = ms => new Promise(r => setTimeout(r, ms));
const N = v => Number(v) || 0;
const div = (a, b) => (N(b) ? N(a) / N(b) : 0);

/* ---------------- Graph API ---------------- */
async function api(caminho, params = {}, metodo = 'GET', tentativa = 0) {
  const url = new URL(caminho.startsWith('http') ? caminho : `${BASE}/${caminho}`);
  const corpo = new URLSearchParams();
  const put = (k, v) => (metodo === 'GET' ? url.searchParams.set(k, v) : corpo.set(k, v));
  for (const [k, v] of Object.entries(params)) put(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  if (!url.searchParams.has('access_token')) put('access_token', TOKEN);
  const resp = await fetch(url, metodo === 'GET' ? {} : { method: metodo, body: corpo });
  const json = await resp.json().catch(() => ({}));
  if (json.error) {
    const cod = json.error.code;
    if ([1, 2, 4, 17, 32, 613, 80000, 80004].includes(cod) && tentativa < 5) {
      await espera(4000 * (tentativa + 1));
      return api(caminho, params, metodo, tentativa + 1);
    }
    const e = new Error(`${json.error.message} (code ${cod})`);
    e.code = cod;
    throw e;
  }
  return json;
}
async function paginas(caminho, params) {
  const itens = [];
  let json = await api(caminho, { limit: 500, ...params });
  itens.push(...(json.data || []));
  while (json.paging && json.paging.next) { json = await api(json.paging.next); itens.push(...(json.data || [])); }
  return itens;
}
/** insights: tenta direto; se a Meta pedir menos dados, vai pelo relatório assíncrono */
async function insights(params) {
  try { return await paginas(`${CONTA}/insights`, params); }
  catch (e) {
    const job = await api(`${CONTA}/insights`, params, 'POST');
    for (let i = 0; i < 200; i++) {
      const st = await api(job.report_run_id, { fields: 'async_status' });
      if (st.async_status === 'Job Completed') return paginas(`${job.report_run_id}/insights`, {});
      if (/Failed|Skipped/.test(st.async_status)) throw e;
      await espera(2500);
    }
    throw e;
  }
}

const F_CAMP = 'campaign_id,campaign_name,objective,spend,impressions,reach,frequency,clicks,inline_link_clicks,cpm,actions,conversions,outbound_clicks,date_start,date_stop';
const F_CONTA = 'spend,impressions,reach,frequency,clicks,inline_link_clicks,cpm,actions,conversions,outbound_clicks,date_start,date_stop';
const F_ADSET = 'campaign_id,adset_id,spend,results,date_start,date_stop';

function iso(d) { return d.toISOString().slice(0, 10); }
function periodos() {
  const h = new Date();
  const dia = n => { const d = new Date(h); d.setDate(d.getDate() - n); return iso(d); };
  return {
    total: { date_preset: 'maximum' },
    ult30: { date_preset: 'last_30d' },
    ant30: { time_range: { since: dia(60), until: dia(31) } },
    ult7:  { date_preset: 'last_7d' },
    hoje:  { date_preset: 'today' }
  };
}

async function coletar() {
  const P = periodos();
  const tarefas = {
    conta: () => api(CONTA, { fields: 'id,name,account_status,currency,timezone_name,amount_spent,spend_cap,balance,business_name' }),
    campanhas: () => paginas(`${CONTA}/campaigns`, { fields: 'id,name,status,effective_status,objective,bid_strategy,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,created_time,updated_time' }),
    adsets: () => paginas(`${CONTA}/adsets`, { fields: 'id,campaign_id,name,status,effective_status,optimization_goal,promoted_object,destination_type,daily_budget,lifetime_budget' }),
    mensalCamp: () => insights({ level: 'campaign', date_preset: 'maximum', time_increment: 'monthly', fields: F_CAMP }),
    mensalAdset: () => insights({ level: 'adset', date_preset: 'maximum', time_increment: 'monthly', fields: F_ADSET }),
    diario: () => insights({ level: 'account', date_preset: 'maximum', time_increment: 1, fields: 'spend,impressions,clicks,inline_link_clicks,actions,conversions,date_start' })
  };
  for (const [nome, p] of Object.entries(P)) {
    tarefas['camp_' + nome] = () => insights({ level: 'campaign', ...p, fields: F_CAMP });
    tarefas['adset_' + nome] = () => insights({ level: 'adset', ...p, fields: F_ADSET });
    tarefas['conta_' + nome] = () => insights({ level: 'account', ...p, fields: F_CONTA });
  }
  const bruto = { coletadoEm: new Date().toISOString(), periodos: P };
  const fila = Object.entries(tarefas);
  const erros = [];
  let fatal = null;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (fila.length) {
      const [nome, fn] = fila.shift();
      try { bruto[nome] = await fn(); }
      catch (e) {
        if (e.code === 190) { fatal = e; fila.length = 0; }   // token vencido: não adianta insistir
        erros.push(`${nome}: ${e.message}`);
      }
    }
  }));
  if (fatal) throw fatal;
  bruto.erros = erros;
  if (!bruto.campanhas || !bruto.camp_total) throw new Error(erros.join(' · ') || 'falha na coleta');
  return bruto;
}

/* ---------------- análise ---------------- */
const RESULTADOS = {
  'actions:omni_landing_page_view': { rot: 'Visualizações da página', custo: 'Custo por visualização', cat: 'trafego' },
  'actions:landing_page_view': { rot: 'Visualizações da página', custo: 'Custo por visualização', cat: 'trafego' },
  'actions:link_click': { rot: 'Cliques no link', custo: 'Custo por clique', cat: 'trafego' },
  'reach': { rot: 'Alcance', custo: 'Custo por mil pessoas', cat: 'alcance', mil: true },
  'video_continuous_2_sec_watched_actions': { rot: 'Views de 2s', custo: 'Custo por view', cat: 'alcance' },
  'video_thruplay_watched_actions': { rot: 'ThruPlays', custo: 'Custo por ThruPlay', cat: 'alcance' },
  'actions:offsite_conversion.fb_pixel_lead': { rot: 'Leads no site', custo: 'Custo por lead', cat: 'conversao' },
  'actions:onsite_conversion.lead_grouped': { rot: 'Leads (formulário)', custo: 'Custo por lead', cat: 'conversao' },
  'conversions:contact_website': { rot: 'Contatos no site', custo: 'Custo por contato', cat: 'conversao' },
  'actions:onsite_conversion.messaging_conversation_started_7d': { rot: 'Conversas no WhatsApp', custo: 'Custo por conversa', cat: 'conversao' },
  'actions:offsite_conversion.fb_pixel_add_to_cart': { rot: 'Adições ao carrinho', custo: 'Custo por carrinho', cat: 'conversao' },
  'actions:onsite_conversion.purchase': { rot: 'Compras no WhatsApp', custo: 'Custo por compra', cat: 'conversao' },
  'actions:offsite_conversion.fb_pixel_purchase': { rot: 'Compras no site', custo: 'Custo por compra', cat: 'conversao' }
};
const infoInd = ind => RESULTADOS[ind] || { rot: ind.replace(/^(actions|conversions):/, ''), custo: 'Custo por resultado', cat: 'conversao' };

const acao = (lista, tipo) => N((lista || []).find(a => a.action_type === tipo)?.value);
const lpvDe = r => acao(r.actions, 'landing_page_view') || acao(r.actions, 'omni_landing_page_view');

/** métricas de tráfego e entrega de uma linha de insights */
function metricas(r) {
  if (!r) return null;
  const gasto = N(r.spend), impr = N(r.impressions), cl = N(r.clicks), link = N(r.inline_link_clicks), lpv = lpvDe(r);
  return {
    gasto, impr, alcance: N(r.reach), freq: N(r.frequency), cliques: cl, cliquesLink: link,
    saidas: acao(r.outbound_clicks, 'outbound_click'), lpv,
    ctr: div(cl, impr), ctrLink: div(link, impr), cpc: div(gasto, cl), cpcLink: div(gasto, link),
    cpm: div(gasto, impr) * 1000, custoLpv: div(gasto, lpv), conexao: div(lpv, link),
    leads: acao(r.actions, 'offsite_conversion.fb_pixel_lead') + acao(r.actions, 'onsite_conversion.lead_grouped'),
    contatos: acao(r.conversions, 'contact_website'),
    conversas: acao(r.actions, 'onsite_conversion.messaging_conversation_started_7d'),
    carrinhos: acao(r.actions, 'offsite_conversion.fb_pixel_add_to_cart'),
    compras: acao(r.actions, 'onsite_conversion.purchase') + acao(r.actions, 'offsite_conversion.fb_pixel_purchase'),
    inicio: r.date_start, fim: r.date_stop
  };
}

/** soma os "Resultados" (como no Gerenciador) dos conjuntos, por campanha e tipo de resultado */
function resultadosPorCampanha(linhas) {
  const out = {};
  for (const r of linhas || []) {
    const c = (out[r.campaign_id] = out[r.campaign_id] || {});
    const res = (r.results || []).find(x => x.indicator && x.indicator !== 'mixed');
    const ind = res ? res.indicator : 'sem_resultado';
    const o = (c[ind] = c[ind] || { valor: 0, gasto: 0 });
    o.valor += N(res?.values?.[0]?.value);
    o.gasto += N(r.spend);
  }
  return out;
}
function principal(porInd) {
  const lista = Object.entries(porInd || {}).filter(([k]) => k !== 'sem_resultado').sort((a, b) => b[1].gasto - a[1].gasto);
  if (!lista.length) return null;
  const [ind, o] = lista[0];
  const i = infoInd(ind);
  return { ind, rot: i.rot, rotCusto: i.custo, cat: i.cat, valor: o.valor, gasto: o.gasto, cpr: div(o.gasto, o.valor) * (i.mil ? 1000 : 1), mil: !!i.mil };
}
function listaResultados(porInd) {
  return Object.entries(porInd || {}).filter(([k]) => k !== 'sem_resultado').map(([ind, o]) => {
    const i = infoInd(ind);
    return { ind, rot: i.rot, rotCusto: i.custo, cat: i.cat, valor: o.valor, gasto: o.gasto, cpr: div(o.gasto, o.valor) * (i.mil ? 1000 : 1), mil: !!i.mil };
  }).sort((a, b) => b.gasto - a.gasto);
}

function etapaDe(nome) {
  const n = nome.toLowerCase();
  if (/awareness|alcance|videoviews|topo/.test(n) && !/pageview/.test(n)) return 'Topo · alcance e vídeo';
  if (/pageview|trafego|tráfego/.test(n)) return 'Tráfego · visitas';
  if (/meio/.test(n)) return 'Meio de funil';
  return 'Fundo · conversão';
}
function produtoDe(nome) {
  const n = nome.toLowerCase();
  if (/fwa/.test(n)) return 'FWA (internet fixa 5G)';
  if (/esim/.test(n)) return '5G eSIM';
  if (/simcard|portabilidade/.test(n)) return '5G Chip / Portabilidade';
  return '5G geral';
}

const fmtR = v => 'R$ ' + N(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtP = (v, c = 1) => (N(v) * 100).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }) + '%';
const fmtN = v => N(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

function analisar(b) {
  const P = ['total', 'ult30', 'ant30', 'ult7', 'hoje'];
  const porCamp = {}, resCamp = {}, conta = {};
  for (const p of P) {
    porCamp[p] = Object.fromEntries((b['camp_' + p] || []).map(r => [r.campaign_id, metricas(r)]));
    resCamp[p] = resultadosPorCampanha(b['adset_' + p]);
    conta[p] = metricas((b['conta_' + p] || [])[0]) || metricas({});
  }

  // médias da conta por tipo de resultado (custo ponderado), para comparar campanhas parecidas
  const bench = {};
  for (const p of ['total', 'ult30', 'ant30', 'ult7', 'hoje']) {
    const acc = {};
    for (const porInd of Object.values(resCamp[p])) for (const [ind, o] of Object.entries(porInd)) {
      if (ind === 'sem_resultado') continue;
      const a = (acc[ind] = acc[ind] || { valor: 0, gasto: 0, n: 0 });
      a.valor += o.valor; a.gasto += o.gasto; a.n++;
    }
    bench[p] = Object.fromEntries(Object.entries(acc).map(([ind, a]) => {
      const i = infoInd(ind);
      return [ind, { ...a, rot: i.rot, rotCusto: i.custo, cat: i.cat, mil: !!i.mil, cpr: div(a.gasto, a.valor) * (i.mil ? 1000 : 1) }];
    }));
  }

  // séries mensais
  const mesesCamp = {};
  for (const r of b.mensalCamp || []) {
    const mes = r.date_start.slice(0, 7);
    (mesesCamp[r.campaign_id] = mesesCamp[r.campaign_id] || {})[mes] = metricas(r);
  }
  const mesesRes = {};
  for (const r of b.mensalAdset || []) {
    const mes = r.date_start.slice(0, 7);
    const res = (r.results || []).find(x => x.indicator && x.indicator !== 'mixed');
    if (!res) continue;
    const c = (mesesRes[r.campaign_id] = mesesRes[r.campaign_id] || {});
    const m = (c[mes] = c[mes] || {});
    const o = (m[res.indicator] = m[res.indicator] || { valor: 0, gasto: 0 });
    o.valor += N(res.values?.[0]?.value); o.gasto += N(r.spend);
  }

  const adsetsPorCamp = {};
  for (const a of b.adsets || []) (adsetsPorCamp[a.campaign_id] = adsetsPorCamp[a.campaign_id] || []).push(a);

  const campanhas = (b.campanhas || []).map(c => {
    const per = {};
    for (const p of P) per[p] = { ...(porCamp[p][c.id] || metricas({})), principal: principal(resCamp[p][c.id]), resultados: listaResultados(resCamp[p][c.id]) };
    const princ = per.total.principal;
    const meses = Object.keys(mesesCamp[c.id] || {}).sort().map(mes => {
      const m = mesesCamp[c.id][mes];
      const r = princ && mesesRes[c.id]?.[mes]?.[princ.ind];
      const i = princ ? infoInd(princ.ind) : {};
      return { mes, ...m, resultados: r ? r.valor : 0, cpr: r ? div(r.gasto, r.valor) * (i.mil ? 1000 : 1) : 0 };
    });
    const conjuntos = adsetsPorCamp[c.id] || [];
    const ativosConj = conjuntos.filter(a => a.effective_status === 'ACTIVE');
    const orcDia = N(c.daily_budget) / 100 || ativosConj.reduce((s, a) => s + N(a.daily_budget) / 100, 0);
    const camp = {
      id: c.id, nome: c.name, status: c.effective_status, statusBruto: c.status, objetivo: c.objective,
      lance: c.bid_strategy || null, orcDia, orcTotal: N(c.lifetime_budget) / 100, cbo: !!(c.daily_budget || c.lifetime_budget),
      inicio: c.start_time, fim: c.stop_time || null, criada: c.created_time,
      conjuntos: conjuntos.length, conjuntosAtivos: ativosConj.length,
      otimizacoes: [...new Set(ativosConj.map(a => a.optimization_goal + (a.promoted_object?.custom_event_type ? ' · ' + a.promoted_object.custom_event_type : '')))],
      etapa: etapaDe(c.name), produto: produtoDe(c.name),
      // leva para o site (e não para WhatsApp/Messenger): só aí a taxa de conexão faz sentido
      site: !(conjuntos.length && conjuntos.every(a => /WHATSAPP|MESSENGER|INSTAGRAM_DIRECT|MESSAGING/.test(a.destination_type || '') || /CONVERSATIONS|MESSAGING/.test(a.optimization_goal || ''))) &&
            !/messaging|onsite_conversion\.purchase/.test(princ?.ind || ''),
      ultimaEntrega: [...meses].reverse().find(m => m.gasto > 0)?.mes || null,
      per, meses
    };
    camp.recs = recomendar(camp, bench);
    camp.decisao = decidir(camp);
    return camp;
  }).filter(c => c.per.total.gasto > 0 || c.status === 'ACTIVE');

  // série diária e mensal da conta
  const diario = (b.diario || []).map(r => ({
    d: r.date_start, gasto: N(r.spend), impr: N(r.impressions), cliquesLink: N(r.inline_link_clicks), lpv: lpvDe(r),
    leads: acao(r.actions, 'offsite_conversion.fb_pixel_lead') + acao(r.actions, 'onsite_conversion.lead_grouped'),
    contatos: acao(r.conversions, 'contact_website'),
    conversas: acao(r.actions, 'onsite_conversion.messaging_conversation_started_7d'),
    carrinhos: acao(r.actions, 'offsite_conversion.fb_pixel_add_to_cart')
  }));
  const mensal = {};
  for (const d of diario) {
    const m = (mensal[d.d.slice(0, 7)] = mensal[d.d.slice(0, 7)] || { mes: d.d.slice(0, 7), gasto: 0, impr: 0, cliquesLink: 0, lpv: 0, leads: 0, contatos: 0, conversas: 0, carrinhos: 0 });
    for (const k of ['gasto', 'impr', 'cliquesLink', 'lpv', 'leads', 'contatos', 'conversas', 'carrinhos']) m[k] += d[k];
  }

  const agrupa = (chave, p) => {
    const g = {};
    for (const c of campanhas) {
      const o = (g[c[chave]] = g[c[chave]] || { nome: c[chave], gasto: 0, campanhas: 0, ativas: 0 });
      o.gasto += c.per[p].gasto; o.campanhas++; if (c.status === 'ACTIVE') o.ativas++;
    }
    return Object.values(g).sort((a, b) => b.gasto - a.gasto);
  };
  const grupos = {};
  for (const p of P) grupos[p] = { etapa: agrupa('etapa', p), produto: agrupa('produto', p) };

  return {
    conta: b.conta, periodos: b.periodos, coletadoEm: b.coletadoEm, erros: b.erros || [],
    totais: conta, bench, grupos, campanhas,
    diario, mensal: Object.values(mensal).sort((a, b) => a.mes.localeCompare(b.mes)),
    resumo: resumoConta(campanhas, conta, bench)
  };
}

/* ---------------- recomendações por campanha ---------------- */
function recomendar(c, bench) {
  const r = [];
  const add = (nivel, titulo, texto) => r.push({ nivel, titulo, texto });
  const P = c.per.ult30, A = c.per.ant30, S = c.per.ult7, H = c.per.hoje, T = c.per.total;
  const pr = P.principal, pa = A.principal;
  const ativa = c.status === 'ACTIVE';

  if (!ativa) {
    const pt = T.principal, bt = pt && bench.total[pt.ind];
    if (pt && bt && bt.n > 1 && pt.cat !== 'alcance' && pt.valor >= 50 && T.gasto >= 3000 && pt.cpr <= bt.cpr * 0.8)
      add('oportunidade', 'Pausada, mas foi das mais eficientes',
        `No histórico, ${pt.rotCusto.toLowerCase()} de ${fmtR(pt.cpr)}, ${fmtP(1 - pt.cpr / bt.cpr, 0)} abaixo da média da conta (${fmtR(bt.cpr)}). Vale duplicar com criativos novos ou reativar com orçamento de teste.`);
    else if (T.gasto > 0)
      add('info', 'Pausada', `Última entrega em ${c.ultimaEntrega || '—'}. Investiu ${fmtR(T.gasto)} no total${pt ? `, ${fmtN(pt.valor)} ${pt.rot.toLowerCase()} a ${fmtR(pt.cpr)} cada` : ''}.`);
    return r;
  }

  if (S.gasto === 0) {
    add('critico', 'Ativa, mas sem entrega há 7 dias',
      'A campanha está ligada e não gastou nada na última semana. Confira anúncios reprovados, conjuntos pausados, orçamento, público pequeno demais ou problema de pagamento.');
    return r;
  }

  if (pr && pr.cat === 'conversao' && P.gasto >= 300 && pr.valor === 0)
    add('critico', 'Gastando sem converter', `${fmtR(P.gasto)} nos últimos 30 dias sem nenhum resultado. Verifique se o pixel está disparando o evento e, se estiver, pause e realoque a verba.`);

  // custo por resultado vs 30 dias anteriores
  if (pr && pa && pr.ind === pa.ind && pa.valor >= 10 && pr.valor >= 5) {
    const v = pr.cpr / pa.cpr - 1;
    if (v >= 0.25)
      add(v >= 0.5 ? 'critico' : 'atencao', `${pr.rotCusto} subiu ${fmtP(v, 0)}`,
        `Foi de ${fmtR(pa.cpr)} para ${fmtR(pr.cpr)} em 30 dias. Troque os criativos com pior CTR, cheque a frequência e a página de destino antes de mexer em orçamento.`);
    else if (v <= -0.15)
      add('oportunidade', `${pr.rotCusto} caiu ${fmtP(-v, 0)}`, `De ${fmtR(pa.cpr)} para ${fmtR(pr.cpr)}. A campanha está melhorando; mantenha os criativos que estão rodando.`);
  }

  // comparação com campanhas que buscam o mesmo resultado
  const bm = pr && bench.ult30[pr.ind];
  if (pr && bm && bm.n > 1 && pr.valor >= 10) {
    const rel = pr.cpr / bm.cpr;
    if (rel >= 1.4)
      add(rel >= 2 ? 'critico' : 'atencao', `${fmtP(rel - 1, 0)} mais cara que a média da conta`,
        `${pr.rotCusto}: ${fmtR(pr.cpr)} contra ${fmtR(bm.cpr)} das outras campanhas que otimizam para ${pr.rot.toLowerCase()}. Corte de 20 a 30% da verba e mova para as campanhas mais baratas do mesmo tipo.`);
    else if (rel <= 0.75)
      add('oportunidade', 'Candidata a escalar',
        `${pr.rotCusto} de ${fmtR(pr.cpr)}, ${fmtP(1 - rel, 0)} abaixo da média da conta (${fmtR(bm.cpr)}). Suba o orçamento de 15 a 20% a cada 3 ou 4 dias enquanto o custo se mantiver.`);
  }

  if (P.freq >= (pr && pr.cat === 'alcance' ? 4 : 3))
    add(P.freq >= 5 ? 'critico' : 'atencao', `Frequência alta: ${P.freq.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`,
      'A mesma pessoa viu os anúncios muitas vezes em 30 dias. Suba criativos novos e amplie o público (Advantage+, lookalikes maiores ou mais cidades).');

  if (pr && pr.cat !== 'alcance' && P.impr >= 10000 && P.ctrLink < 0.006)
    add('atencao', `CTR no link baixo: ${fmtP(P.ctrLink, 2)}`,
      'Menos de 0,6% de quem vê o anúncio clica. Teste novos ganchos nos 3 primeiros segundos, oferta mais clara (preço, velocidade, bônus) e formatos em vídeo vertical.');

  if (c.site && P.cliquesLink >= 500 && P.lpv > 0 && P.conexao < 0.6)
    add('atencao', `Só ${fmtP(P.conexao, 0)} dos cliques chegam na página`,
      `De ${fmtN(P.cliquesLink)} cliques no link, ${fmtN(P.lpv)} carregaram a página. Meça a landing no PageSpeed, tire redirecionamentos e confira se o pixel carrega logo no início da página. Se estiver no Audience Network, teste sem ele.`);

  if (A.cpm > 0 && P.cpm / A.cpm - 1 >= 0.3)
    add('info', `CPM subiu ${fmtP(P.cpm / A.cpm - 1, 0)}`,
      `De ${fmtR(A.cpm)} para ${fmtR(P.cpm)}. O leilão ficou mais caro (sazonalidade ou público saturado). Ampliar o público costuma baixar o CPM.`);

  if (pr && pr.cat === 'conversao' && c.conjuntosAtivos > 1 && div(S.principal?.valor, c.conjuntosAtivos) < 50)
    add('atencao', 'Conjuntos sem volume para sair do aprendizado',
      `${fmtN(S.principal?.valor || 0)} resultados na semana para ${c.conjuntosAtivos} conjuntos ativos (menos de 50 por conjunto). Junte conjuntos parecidos para o algoritmo aprender mais rápido.`);

  if (c.otimizacoes.length > 1)
    add('info', 'Conjuntos otimizando para eventos diferentes',
      `Esta campanha mistura ${c.otimizacoes.join(', ')}. Separar por objetivo deixa a leitura do custo por resultado mais limpa.`);

  if (pr && pr.cat === 'trafego')
    add('info', 'Campanha de tráfego: medir o que vem depois',
      `Gera visitas a ${fmtR(pr.cpr)} cada. Use essas visitas como público de remarketing (visitantes de 30 dias) nas campanhas de conversão e acompanhe no GA4 quantas viram lead.`);

  const mediaDia = S.gasto / 7;
  if (H.gasto > 0 && mediaDia > 0 && H.gasto > mediaDia * 1.5)
    add('atencao', 'Gasto de hoje acima do normal', `Hoje já foram ${fmtR(H.gasto)}, contra uma média de ${fmtR(mediaDia)} por dia na última semana.`);

  if (c.fim) {
    const dias = Math.round((new Date(c.fim) - Date.now()) / 864e5);
    if (dias >= 0 && dias <= 7) add('info', `Termina em ${dias} dia(s)`, 'Planeje a substituta ou estenda a data se o resultado estiver bom.');
  }
  if (!r.some(x => x.nivel !== 'info'))
    add('ok', 'Dentro do esperado', 'Sem sinais de alerta nos últimos 30 dias. Mantenha e continue testando criativos.');
  return r;
}
function decidir(c) {
  const n = new Set(c.recs.map(r => r.nivel));
  if (c.status !== 'ACTIVE') return n.has('oportunidade') ? 'Reativar?' : 'Pausada';
  if (c.recs.some(r => r.titulo.startsWith('Gastando sem converter') || r.titulo.startsWith('Ativa, mas sem entrega'))) return 'Pausar ou corrigir';
  if (n.has('critico')) return 'Otimizar já';
  if (c.recs.some(r => r.titulo === 'Candidata a escalar')) return 'Escalar';
  if (n.has('atencao')) return 'Ajustar';
  return 'Manter';
}

/* ---------------- leitura geral da conta ---------------- */
function resumoConta(camps, T, bench) {
  const out = [];
  const add = (nivel, titulo, texto) => out.push({ nivel, titulo, texto });
  const ativas = camps.filter(c => c.status === 'ACTIVE');
  const P = T.ult30, A = T.ant30;

  if (A.gasto > 0) {
    const vg = P.gasto / A.gasto - 1;
    add('info', `Investimento dos últimos 30 dias: ${fmtR(P.gasto)} (${vg >= 0 ? '+' : ''}${fmtP(vg, 0)})`,
      `Nos 30 dias anteriores foram ${fmtR(A.gasto)}. ${ativas.length} campanhas ativas agora.`);
  }

  // custo por tipo de resultado, mês contra mês
  for (const [ind, b] of Object.entries(bench.ult30).sort((a, b) => b[1].gasto - a[1].gasto).slice(0, 4)) {
    const a = bench.ant30[ind];
    if (!a || !a.valor || !b.valor) continue;
    const v = b.cpr / a.cpr - 1;
    if (Math.abs(v) >= 0.1)
      add(v > 0 ? 'atencao' : 'oportunidade', `${b.rotCusto} da conta ${v > 0 ? 'subiu' : 'caiu'} ${fmtP(Math.abs(v), 0)}`,
        `${b.rot}: ${fmtR(a.cpr)} → ${fmtR(b.cpr)} (${fmtN(b.valor)} no período, ${fmtR(b.gasto)} investidos).`);
  }

  // realocação: mesma meta, custos muito diferentes
  const porInd = {};
  for (const c of ativas) { const p = c.per.ult30.principal; if (p && p.valor >= 10) (porInd[p.ind] = porInd[p.ind] || []).push(c); }
  for (const [ind, cs] of Object.entries(porInd)) {
    if (cs.length < 2) continue;
    cs.sort((a, b) => a.per.ult30.principal.cpr - b.per.ult30.principal.cpr);
    const melhor = cs[0], pior = cs[cs.length - 1];
    const pm = melhor.per.ult30.principal, pp = pior.per.ult30.principal;
    if (pp.cpr >= pm.cpr * 1.5)
      add('oportunidade', `Mover verba: ${infoInd(ind).rot.toLowerCase()}`,
        `"${pior.nome}" paga ${fmtR(pp.cpr)} por resultado e "${melhor.nome}" paga ${fmtR(pm.cpr)}. Tirar 20% de uma e colocar na outra tende a baixar o custo médio sem perder volume.`);
  }

  const site = camps.filter(c => c.site).reduce((a, c) => (a.l += c.per.ult30.cliquesLink, a.v += c.per.ult30.lpv, a), { l: 0, v: 0 });
  const con = div(site.v, site.l);
  if (site.l > 0 && site.v > 0 && con < 0.65)
    add('atencao', `Taxa de conexão das campanhas de site: ${fmtP(con, 0)}`,
      `De cada 100 cliques que levam ao site, só ${Math.round(con * 100)} carregam a página (WhatsApp fica fora desta conta). Velocidade da landing é o ganho mais barato da conta: cada ponto aqui baixa o custo de todas as campanhas de site.`);

  const tr = camps.filter(c => c.etapa === 'Tráfego · visitas').reduce((s, c) => s + c.per.ult30.gasto, 0);
  if (P.gasto > 0 && tr / P.gasto >= 0.3)
    add('info', `${fmtP(tr / P.gasto, 0)} da verba em campanhas de visita`,
      'Campanhas de visualização de página não otimizam para lead. Confirme no GA4/CRM que essas visitas viram vendas; se não virarem, mova parte para campanhas de lead/contato.');

  const freq = ativas.filter(c => c.per.ult30.freq >= 3).length;
  if (freq) add('atencao', `${freq} campanha(s) com frequência acima de 3`, 'Público cansando de ver os mesmos anúncios. Priorize criativos novos nelas.');
  return out;
}

/* ---------------- estado e atualização ---------------- */
let estado = { analise: null, atualizadoEm: null, atualizando: false, erro: null, proxima: null };
try {
  const c = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  estado.analise = analisar(c);
  estado.atualizadoEm = c.coletadoEm;
} catch (e) { /* primeira vez */ }

let pendente = null;
function atualizar() {
  if (pendente) return pendente;
  TOKEN = lerEnv()('META_TOKEN');
  if (!TOKEN) { estado.erro = 'Falta META_TOKEN em sistemas/trafego/.env.local'; return Promise.resolve(); }
  estado.atualizando = true;
  pendente = coletar().then(b => {
    estado.analise = analisar(b);
    estado.atualizadoEm = b.coletadoEm;
    estado.erro = b.erros.length ? b.erros.join(' · ') : null;
    try {
      fs.mkdirSync(path.dirname(CACHE), { recursive: true });
      const tmp = CACHE + '.' + process.pid + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(b));
      fs.renameSync(tmp, CACHE);
    } catch (e) { console.warn('meta: não gravei o cache', e.message); }
    console.log(`meta: ${estado.analise.campanhas.length} campanhas atualizadas`);
  }).catch(e => {
    estado.erro = e.code === 190
      ? 'O token da Meta venceu, então os números abaixo são da última coleta. Gere um token novo com ads_read, troque META_TOKEN em sistemas/trafego/.env.local e clique em "Atualizar agora".'
      : [...new Set(e.message.split(' · ').map(s => s.replace(/^\w+: /, '')))].join(' · ');
    console.warn('meta:', e.code === 190 ? 'token vencido (code 190)' : e.message);
  }).finally(() => {
    estado.atualizando = false;
    estado.proxima = new Date(Date.now() + INTERVALO).toISOString();
    pendente = null;
  });
  return pendente;
}
atualizar();
setInterval(atualizar, INTERVALO).unref();

/* página própria do painel Brisanet: http://localhost:4412/brisanet */
const PAGINAS = {
  '/brisanet': ['brisanet.html', 'text/html; charset=utf-8'],
  '/brisanet/': ['brisanet.html', 'text/html; charset=utf-8'],
  '/brisanet.js': ['brisanet.js', 'text/javascript; charset=utf-8']
};

/** rotas /api/meta/... e /brisanet para o servidor do sistema; devolve true quando atendeu */
function rota(req, res, rotaUrl, json) {
  const pag = req.method === 'GET' && PAGINAS[rotaUrl];
  if (pag) {
    fs.readFile(path.join(PASTA, pag[0]), (err, buf) => {
      if (err) { res.writeHead(404).end('404'); return; }
      res.writeHead(200, { 'Content-Type': pag[1], 'Cache-Control': 'no-store' });
      res.end(buf);
    });
    return true;
  }
  if (rotaUrl === '/api/meta/5g' && req.method === 'GET') {
    json(res, 200, { ok: !!estado.analise, atualizadoEm: estado.atualizadoEm, atualizando: estado.atualizando,
      proxima: estado.proxima, intervaloMin: INTERVALO / 60e3, erro: estado.erro, dados: estado.analise });
    return true;
  }
  if (rotaUrl === '/api/meta/5g/atualizar' && req.method === 'POST') {
    atualizar();
    json(res, 202, { ok: true, atualizando: true });
    return true;
  }
  return false;
}

module.exports = { rota, analisar, coletar };
