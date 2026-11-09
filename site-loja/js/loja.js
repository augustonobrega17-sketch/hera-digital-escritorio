/* Loja — monta a página a partir de js/config.js.
   Não precisa mexer aqui para trocar textos, preços ou fotos. */
(function () {
  'use strict';
  const L = window.LOJA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const real = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const FRETE_GRATIS = 199;

  if (!L.mostrarAvisosDeFoto) document.body.classList.add('sem-avisos');

  const ICONE_FOTO = '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>';

  /* Quadro de foto: mostra a imagem ou, se ela não existir, o nome do arquivo esperado. */
  function foto(caminho, tamanho, alt = '', extraClasse = '', carregar = 'lazy') {
    return `<div class="foto ${extraClasse}">
      <img src="fotos/${esc(caminho)}" alt="${esc(alt)}" loading="${carregar}" onerror="this.parentNode.classList.add('vazia')">
      <div class="foto-aviso">${ICONE_FOTO}<span>Envie a foto</span><code>fotos/${esc(caminho)}</code><small>${esc(tamanho)}</small></div>
    </div>`;
  }

  const catPorId = Object.fromEntries(L.categorias.map((c) => [c.id, c]));
  const prodPorId = Object.fromEntries(L.produtos.map((p) => [p.id, p]));
  const variacoesDe = (p) => p.variacoes || L.variacoesPadrao || [{ nome: 'Padrão', acrescimo: 0 }];
  const temVariacaoPaga = (p) => variacoesDe(p).some((v) => v.acrescimo > 0);
  const descricaoPadrao = {
    cabecas: 'Escultura em escala 1/12 com detalhes de pele, tecido e equipamento prontos para pintura. Encaixe compatível com as principais linhas de action figures de 15 cm.',
    coletes: 'Peça de vestimenta tática em escala 1/12, modelada em partes para facilitar a impressão e o encaixe no boneco. Detalhes de costura, fivelas e bolsos.',
    headgear: 'Acessório de cabeça em escala 1/12, com espessura pensada para impressão em resina e encaixe firme sobre as cabeças da loja.',
    armas: 'Arma em escala 1/12 com detalhes finos, empunhadura dimensionada para as mãos de action figures de 15 cm.',
    mochilas: 'Equipamento de carga em escala 1/12, com alças e engates separados para montagem e pintura.',
    kits: 'Kit completo com tudo o que é preciso para montar o operador: cabeça, vestimenta, colete, armas e acessórios, com desconto em relação às peças avulsas.',
  };

  /* ---------- Barra de avisos (rotativa) ---------- */
  (function avisos() {
    const el = $('#avisos');
    let i = 0;
    const mostra = () => { el.innerHTML = `<span>${esc(L.barraAvisos[i])}</span>`; i = (i + 1) % L.barraAvisos.length; };
    mostra();
    if (L.barraAvisos.length > 1) setInterval(mostra, 4500);
  })();

  /* ---------- Logo ---------- */
  (function logo() {
    const el = $('#logo');
    // a última palavra (ou os números no fim, ex.: FORJA118) sai em dourado
    const m = L.marca.nome.match(/^(.*?)(\s+\S+|\d+)$/);
    const texto = m && m[1]
      ? `${esc(m[1].trim())}${/^\s/.test(m[2]) ? ' ' : ''}<b>${esc(m[2].trim())}</b>`
      : esc(L.marca.nome);
    el.innerHTML = `<svg viewBox="0 0 32 32"><path d="M16 3 27 7.5v7.5c0 7-4.6 11.2-11 13-6.4-1.8-11-6-11-13V7.5z"/><path d="m11 16 3.5 3.5L21 13"/></svg><span class="logo-texto">${texto}</span>`;
    if (L.marca.logo) {
      const img = new Image();
      img.onload = () => { el.innerHTML = ''; img.alt = L.marca.nome; el.appendChild(img); };
      img.src = 'fotos/' + L.marca.logo;
    }
    document.title = `${L.marca.nome} · ${L.marca.slogan}`;
  })();

  /* ---------- Menu ---------- */
  const itensMenu = [
    { nome: 'Lançamentos', acao: 'catalogo:novo' },
    { nome: 'Coleções', sub: L.categorias.map((c) => ({ nome: c.nome, acao: 'catalogo:' + c.id })).concat([{ nome: 'Ver tudo', acao: 'catalogo:' }]) },
    { nome: 'Kits', acao: '#kits' },
    { nome: 'Assinatura', acao: '#assinatura' },
    { nome: 'Sobre', acao: '#sobre' },
    { nome: 'Ajuda', acao: '#ajuda' },
  ];
  $('#menu').innerHTML = itensMenu.map((m) => m.sub
    ? `<div><button aria-haspopup="true">${esc(m.nome)}<span class="seta-baixo">▾</span></button>
         <div class="submenu">${m.sub.map((s) => `<a href="#" data-acao="${esc(s.acao)}">${esc(s.nome)}</a>`).join('')}</div></div>`
    : `<div><a href="${m.acao.startsWith('#') ? m.acao : '#'}" data-acao="${esc(m.acao)}">${esc(m.nome)}</a></div>`).join('');
  $('#menuCelular').innerHTML = itensMenu.map((m) => m.sub
    ? `<details><summary>${esc(m.nome)} ▾</summary>${m.sub.map((s) => `<a href="#" data-acao="${esc(s.acao)}">${esc(s.nome)}</a>`).join('')}</details>`
    : `<a href="#" data-acao="${esc(m.acao)}">${esc(m.nome)}</a>`).join('');

  /* ---------- Hero ---------- */
  (function hero() {
    const el = $('#hero');
    el.innerHTML = L.banners.map((b, i) => `
      <div class="slide${i === 0 ? ' ativo' : ''}" aria-roledescription="slide" aria-label="${i + 1} de ${L.banners.length}">
        ${foto(b.foto, '1920 × 900 px (horizontal)', b.titulo, '', i === 0 ? 'eager' : 'lazy')}
        <div class="slide-texto">
          <span class="kicker">${esc(L.marca.slogan)}</span>
          <h${i === 0 ? 1 : 2}>${esc(b.titulo)}</h${i === 0 ? 1 : 2}>
          <p>${esc(b.texto)}</p>
          <a href="#" class="btn" data-acao="${esc(b.acao)}">${esc(b.botao)}</a>
        </div>
      </div>`).join('') + (L.banners.length > 1 ? `
      <div class="hero-controles">
        <button class="seta" data-dir="-1" aria-label="Anterior">‹</button>
        <div class="pontos">${L.banners.map((_, i) => `<button aria-label="Ir para o slide ${i + 1}" class="${i === 0 ? 'ativo' : ''}"></button>`).join('')}</div>
        <button class="seta" data-dir="1" aria-label="Próximo">›</button>
      </div>` : '');
    const slides = $$('.slide', el);
    const pontos = $$('.pontos button', el);
    let atual = 0, timer;
    const vai = (n) => {
      slides[atual].classList.remove('ativo'); pontos[atual]?.classList.remove('ativo');
      atual = (n + slides.length) % slides.length;
      slides[atual].classList.add('ativo'); pontos[atual]?.classList.add('ativo');
      reinicia();
    };
    const reinicia = () => { clearInterval(timer); timer = setInterval(() => vai(atual + 1), 7000); };
    pontos.forEach((p, i) => p.addEventListener('click', () => vai(i)));
    $$('.seta', el).forEach((b) => b.addEventListener('click', () => vai(atual + Number(b.dataset.dir))));
    let x0 = null;
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) vai(atual + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    if (slides.length > 1) reinicia();
  })();

  /* ---------- Coleções ---------- */
  $('#trilhoColecoes').innerHTML = L.categorias.map((c) => `
    <button class="colecao" data-acao="catalogo:${esc(c.id)}">
      ${foto(c.foto, '800 × 1000 px (vertical)', c.nome)}
      <div class="colecao-texto">
        <h3>${esc(c.nome)}</h3>
        <p>${esc(c.texto)}</p>
        <span>Explorar →</span>
      </div>
    </button>`).join('');

  /* ---------- Cartão de produto ---------- */
  function cartao(p) {
    const promo = p.de && p.de > p.preco;
    return `<article class="produto" data-produto="${esc(p.id)}" tabindex="0" aria-label="${esc(p.nome)}">
      <div style="position:relative">
        ${p.selo ? `<span class="selo${promo ? ' promo' : ''}">${esc(p.selo)}</span>` : ''}
        ${foto('produtos/' + p.id + '.jpg', '1000 × 1000 px (quadrada)', p.nome)}
        <button class="produto-add" data-add="${esc(p.id)}" aria-label="Adicionar ${esc(p.nome)} ao carrinho">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div class="produto-nome">${esc(p.nome)}</div>
      <div class="preco">${temVariacaoPaga(p) ? '<span class="a-partir">A partir de</span>' : ''}<strong>${real(p.preco)}</strong>${promo ? `<s>${real(p.de)}</s>` : ''}</div>
    </article>`;
  }

  function secaoProdutos(id, titulo, lista, trilhoId) {
    return `<section class="secao" id="${esc(id)}">
      <div class="secao-cab">
        <h2>${esc(titulo)}</h2>
        <div class="direita">
          <a href="#" class="ver-tudo" data-acao="catalogo:${esc(id.replace('sec-', ''))}">Ver tudo</a>
          <div class="setas" data-alvo="${trilhoId}"><button aria-label="Anterior">‹</button><button aria-label="Próximo">›</button></div>
        </div>
      </div>
      <div class="trilho" id="${trilhoId}">${lista.map(cartao).join('')}</div>
    </section>`;
  }

  $('#prateleiras').innerHTML = L.prateleiras.map((cid) => {
    const c = catPorId[cid];
    if (!c) return '';
    return secaoProdutos('sec-' + cid, c.nome, L.produtos.filter((p) => p.cat === cid), 'trilho-' + cid);
  }).join('');

  const kits = L.produtos.filter((p) => p.cat === 'kits');
  if (kits.length) {
    $('#kits').outerHTML = secaoProdutos('kits', catPorId.kits?.nome || 'Kits completos', kits, 'trilho-kits');
  } else { $('#kits').remove(); }

  // setas dos trilhos
  $$('.setas').forEach((s) => {
    const alvo = document.getElementById(s.dataset.alvo);
    if (!alvo) return;
    const [ant, prox] = $$('button', s);
    const passo = () => alvo.clientWidth * 0.9;
    ant.addEventListener('click', () => alvo.scrollBy({ left: -passo() }));
    prox.addEventListener('click', () => alvo.scrollBy({ left: passo() }));
  });

  /* ---------- Sobre ---------- */
  $('#sobre').innerHTML = `<div class="sobre-in">
    ${foto(L.sobre.foto, '1200 × 900 px', L.sobre.titulo)}
    <div class="sobre-texto">
      <span class="kicker">${esc(L.marca.cidade)}</span>
      <h2>${esc(L.sobre.titulo)}</h2>
      <p>${esc(L.sobre.texto)}</p>
      <div class="selos-confianca">
        <div><b>${L.produtos.length}+</b><span>peças no catálogo</span></div>
        <div><b>1/12</b><span>escala precisa</span></div>
        <div><b>8K</b><span>impressão em resina</span></div>
      </div>
      <a href="#" class="btn btn-contorno" data-acao="whatsapp:Olá! Vim pelo site e queria tirar uma dúvida.">${esc(L.sobre.botao)}</a>
    </div>
  </div>`;

  /* ---------- Assinatura ---------- */
  const A = L.assinatura;
  $('#assinatura').innerHTML = `${foto(A.foto, '1920 × 900 px (fundo)', A.titulo)}
    <div class="assinatura-in">
      <div>
        <span class="kicker">Assinatura mensal</span>
        <h2>${esc(A.titulo)}</h2>
        <p>${esc(A.texto)}</p>
      </div>
      <div class="plano">
        <span class="kicker">Plano Pelotão</span>
        <div class="plano-preco">${real(A.preco)} <small>/ mês</small></div>
        <ul>${A.itens.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
        <a href="#" class="btn btn-largo" data-acao="whatsapp:Olá! Quero assinar o plano ${esc(A.titulo)} (${real(A.preco)}/mês).">${esc(A.botao)}</a>
      </div>
    </div>`;

  /* ---------- FAQ ---------- */
  $('#faq').innerHTML = L.faq.map((f) => `<details><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p></details>`).join('');

  /* ---------- Rodapé ---------- */
  const C = L.contato;
  const ICONES = {
    instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 4.8a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>',
  };
  const ZAP = '<svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5c0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM20.5 3.5A11.8 11.8 0 0 0 1.9 17.7L.2 24l6.4-1.7a11.8 11.8 0 0 0 5.7 1.4A11.8 11.8 0 0 0 20.5 3.5z"/></svg>';
  $('#rodape').innerHTML = `<div class="rodape-in">
      <div>
        <a href="#" class="logo">${$('#logo').innerHTML}</a>
        <p>${esc(L.rodape.texto)}</p>
        <div class="redes">${['instagram', 'youtube', 'facebook'].filter((r) => C[r]).map((r) => `<a href="${esc(C[r])}" target="_blank" rel="noopener" aria-label="${r}">${ICONES[r]}</a>`).join('')}</div>
      </div>
      <div>
        <h4>Loja</h4>
        <ul>
          <li><button data-acao="catalogo:novo">Lançamentos</button></li>
          ${L.categorias.map((c) => `<li><button data-acao="catalogo:${esc(c.id)}">${esc(c.nome)}</button></li>`).join('')}
        </ul>
      </div>
      <div>
        <h4>Ajuda</h4>
        <ul>
          <li><a href="#sobre">Sobre nós</a></li>
          <li><a href="#ajuda">Perguntas frequentes</a></li>
          <li><a href="#" data-acao="whatsapp:Olá! Preciso de ajuda com um pedido.">WhatsApp</a></li>
          <li><a href="mailto:${esc(C.email)}">${esc(C.email)}</a></li>
        </ul>
      </div>
      <div>
        <h4>Entre para o pelotão</h4>
        <p style="margin:0 0 12px">Receba lançamentos, cupons e arquivos grátis no seu e-mail.</p>
        <form class="news" id="news">
          <input type="email" required placeholder="Seu melhor e-mail" aria-label="E-mail">
          <button type="submit">Inscrever</button>
        </form>
      </div>
    </div>
    <div class="rodape-base">
      <span>© ${new Date().getFullYear()} ${esc(L.marca.nome)}. ${esc(L.rodape.copyright)}</span>
      <div class="pagamentos"><span>PIX</span><span>VISA</span><span>MASTER</span><span>ELO</span><span>BOLETO</span></div>
    </div>`;
  $('#news').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('input', e.target).value.trim();
    abrirLink(`mailto:${C.email}?subject=${encodeURIComponent('Quero entrar para a lista')}&body=${encodeURIComponent('Meu e-mail: ' + email)}`);
    e.target.reset();
    aviso('Obrigado! Você está na lista.');
  });

  if (C.whatsapp) {
    const z = document.createElement('a');
    z.className = 'zap'; z.href = '#'; z.dataset.acao = 'whatsapp:Olá! Vim pelo site.';
    z.setAttribute('aria-label', 'Falar no WhatsApp'); z.innerHTML = ZAP;
    document.body.appendChild(z);
  }

  /* ---------- Camadas (gavetas, modal, catálogo) ---------- */
  const veu = $('#veu');
  let camada = null;
  function abrir(el) {
    fechar();
    camada = el;
    el.classList.add(el.classList.contains('gaveta') ? 'aberta' : 'aberto');
    el.setAttribute('aria-hidden', 'false');
    if (!el.classList.contains('catalogo')) veu.classList.add('ativo');
    document.body.classList.add('travado');
  }
  function fechar() {
    if (!camada) return;
    camada.classList.remove('aberta', 'aberto');
    camada.setAttribute('aria-hidden', 'true');
    veu.classList.remove('ativo');
    document.body.classList.remove('travado');
    camada = null;
  }
  veu.addEventListener('click', fechar);
  $('#modalProduto').addEventListener('click', (e) => { if (e.target.id === 'modalProduto') fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
  $('#abrirMenu').addEventListener('click', () => abrir($('#gavetaMenu')));
  $('#abrirCarrinho').addEventListener('click', () => { desenhaCarrinho(); abrir($('#gavetaCarrinho')); });
  $('#abrirBusca').addEventListener('click', () => abrirCatalogo('', true));

  /* ---------- Ações (links data-acao) ---------- */
  function abrirLink(url) { window.open(url, url.startsWith('mailto:') ? '_self' : '_blank', 'noopener'); }
  function whatsapp(msg) {
    if (!C.whatsapp || /^5500/.test(C.whatsapp)) { aviso('Configure o número do WhatsApp em js/config.js'); return; }
    abrirLink(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`);
  }
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { e.preventDefault(); e.stopPropagation(); const p = prodPorId[add.dataset.add]; adicionar(p, variacoesDe(p)[0], 1); return; }
    const card = e.target.closest('[data-produto]');
    if (card) { e.preventDefault(); abrirProduto(card.dataset.produto); return; }
    const a = e.target.closest('[data-acao]');
    if (!a) return;
    const acao = a.dataset.acao;
    if (acao.startsWith('#')) {
      e.preventDefault(); fechar();
      document.querySelector(acao)?.scrollIntoView({ behavior: 'smooth' });
    } else if (acao.startsWith('catalogo:')) {
      e.preventDefault(); abrirCatalogo(acao.slice(9));
    } else if (acao.startsWith('whatsapp:')) {
      e.preventDefault(); whatsapp(acao.slice(9));
    } else if (/^https?:/.test(acao)) {
      e.preventDefault(); abrirLink(acao);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches?.('[data-produto]')) abrirProduto(e.target.dataset.produto);
  });

  /* ---------- Catálogo / busca ---------- */
  let filtroCat = '';
  const normal = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  $('#chips').innerHTML = [{ id: '', nome: 'Tudo' }, { id: 'novo', nome: 'Lançamentos' }].concat(L.categorias)
    .map((c) => `<button data-chip="${esc(c.id)}">${esc(c.nome)}</button>`).join('');
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-chip]'); if (!b) return;
    filtroCat = b.dataset.chip; desenhaCatalogo();
  });
  $('#campoBusca').addEventListener('input', desenhaCatalogo);
  function abrirCatalogo(cat, focar) {
    filtroCat = cat || '';
    $('#campoBusca').value = '';
    desenhaCatalogo();
    abrir($('#catalogo'));
    $('#catalogo').scrollTop = 0;
    if (focar) setTimeout(() => $('#campoBusca').focus(), 50);
  }
  function desenhaCatalogo() {
    const q = normal($('#campoBusca').value.trim());
    const lista = L.produtos.filter((p) =>
      (!filtroCat || (filtroCat === 'novo' ? /novo/i.test(p.selo || '') : p.cat === filtroCat)) &&
      (!q || normal(p.nome + ' ' + (catPorId[p.cat]?.nome || '')).includes(q)));
    $$('#chips button').forEach((b) => b.classList.toggle('ativo', b.dataset.chip === filtroCat));
    $('#catalogoInfo').textContent = lista.length ? `${lista.length} ${lista.length === 1 ? 'produto' : 'produtos'}` : 'Nenhum produto encontrado. Tente outra palavra.';
    $('#gradeCatalogo').innerHTML = lista.map(cartao).join('');
  }

  /* ---------- Janela do produto ---------- */
  function abrirProduto(id) {
    const p = prodPorId[id]; if (!p) return;
    const vars = variacoesDe(p);
    const promo = p.de && p.de > p.preco;
    const fotos = [p.id + '.jpg', p.id + '-2.jpg', p.id + '-3.jpg', p.id + '-4.jpg'];
    let qtd = 1;
    $('#modalConteudo').innerHTML = `
      <button class="icone modal-fechar" aria-label="Fechar">✕</button>
      <div class="galeria">
        <div style="position:relative">
          ${p.selo ? `<span class="selo${promo ? ' promo' : ''}">${esc(p.selo)}</span>` : ''}
          ${foto('produtos/' + fotos[0], '1000 × 1000 px (quadrada)', p.nome, 'foto-principal', 'eager')}
        </div>
        <div class="miniaturas" hidden></div>
      </div>
      <div class="detalhe">
        <span class="categoria">${esc(catPorId[p.cat]?.nome || '')}</span>
        <h3>${esc(p.nome)}</h3>
        <div class="preco"><strong id="mPreco">${real(p.preco)}</strong>${promo ? `<s>${real(p.de)}</s>` : ''}</div>
        <p>${esc(p.descricao || descricaoPadrao[p.cat] || '')}</p>
        ${vars.length > 1 ? `<div class="opcoes" role="radiogroup" aria-label="Versão">${vars.map((v, i) => `
          <label><input type="radio" name="var" value="${i}" ${i === 0 ? 'checked' : ''}><span>${esc(v.nome)}</span><span>${v.acrescimo ? '+ ' + real(v.acrescimo) : ''}</span></label>`).join('')}</div>` : ''}
        <div class="compra">
          <div class="qtd"><button data-q="-1" aria-label="Diminuir">−</button><span id="mQtd">1</span><button data-q="1" aria-label="Aumentar">+</button></div>
          <button class="btn" id="mAdd">Adicionar ao carrinho</button>
        </div>
        <button class="btn btn-contorno" id="mZap">Comprar pelo WhatsApp</button>
        <ul class="garantias">
          <li>Arquivo STL: download imediato, link sem prazo de validade</li>
          <li>Peça impressa: produção em 3 a 7 dias úteis</li>
          <li>Pagamento por PIX, cartão ou boleto</li>
        </ul>
      </div>`;
    const caixa = $('#modalConteudo');
    const varAtual = () => vars[Number($('input[name=var]:checked', caixa)?.value || 0)];
    const atualizaPreco = () => { $('#mPreco').textContent = real((p.preco + varAtual().acrescimo) * qtd); };
    $$('input[name=var]', caixa).forEach((r) => r.addEventListener('change', atualizaPreco));
    $$('[data-q]', caixa).forEach((b) => b.addEventListener('click', () => {
      qtd = Math.max(1, qtd + Number(b.dataset.q)); $('#mQtd').textContent = qtd; atualizaPreco();
    }));
    $('.modal-fechar', caixa).addEventListener('click', fechar);
    $('#mAdd').addEventListener('click', () => { adicionar(p, varAtual(), qtd); fechar(); });
    $('#mZap').addEventListener('click', () => {
      const v = varAtual();
      whatsapp(`Olá! Quero comprar:\n${qtd}× ${p.nome} — ${v.nome}\nTotal: ${real((p.preco + v.acrescimo) * qtd)}`);
    });
    // miniaturas: só aparecem as fotos extras que existem
    const mini = $('.miniaturas', caixa);
    const principal = $('.foto-principal img', caixa);
    const existentes = [];
    let pendentes = fotos.length;
    fotos.forEach((f, i) => {
      const img = new Image();
      img.onload = () => { existentes[i] = f; fim(); };
      img.onerror = fim;
      img.src = 'fotos/produtos/' + f;
    });
    function fim() {
      if (--pendentes) return;
      const ok = existentes.filter(Boolean);
      if (ok.length < 2) return;
      mini.hidden = false;
      mini.innerHTML = ok.map((f, i) => `<button class="${i === 0 ? 'ativo' : ''}" data-f="${esc(f)}"><img src="fotos/produtos/${esc(f)}" alt=""></button>`).join('');
      $$('button', mini).forEach((b) => b.addEventListener('click', () => {
        $$('button', mini).forEach((x) => x.classList.remove('ativo')); b.classList.add('ativo');
        principal.parentNode.classList.remove('vazia');
        principal.src = 'fotos/produtos/' + b.dataset.f;
      }));
    }
    abrir($('#modalProduto'));
  }

  /* ---------- Carrinho ---------- */
  const CHAVE = 'loja-carrinho-v1';
  let carrinho = [];
  try { carrinho = JSON.parse(localStorage.getItem(CHAVE)) || []; } catch (e) { carrinho = []; }
  carrinho = carrinho.filter((i) => prodPorId[i.id]);
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(carrinho)); } catch (e) { /* sem armazenamento */ } atualizaBolha(); };
  const precoItem = (i) => prodPorId[i.id].preco + (i.acrescimo || 0);
  const total = () => carrinho.reduce((s, i) => s + precoItem(i) * i.qtd, 0);
  function atualizaBolha() {
    const n = carrinho.reduce((s, i) => s + i.qtd, 0);
    const b = $('#qtdCarrinho'); b.textContent = n; b.hidden = !n;
  }
  function adicionar(p, v, qtd) {
    const ex = carrinho.find((i) => i.id === p.id && i.variacao === v.nome);
    if (ex) ex.qtd += qtd; else carrinho.push({ id: p.id, variacao: v.nome, acrescimo: v.acrescimo || 0, qtd });
    salvar();
    aviso(`${p.nome} adicionado ao carrinho`);
  }
  function desenhaCarrinho() {
    const lista = $('#carrinhoItens'), rod = $('#carrinhoRodape');
    if (!carrinho.length) {
      lista.innerHTML = `<div class="carrinho-vazio"><svg viewBox="0 0 24 24"><path d="M5 7h14l-1.2 12H6.2z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>Seu carrinho está vazio.<br><br><button class="btn" data-acao="catalogo:">Ver produtos</button></div>`;
      rod.innerHTML = ''; return;
    }
    lista.innerHTML = carrinho.map((i, n) => {
      const p = prodPorId[i.id];
      return `<div class="item">
        ${foto('produtos/' + p.id + '.jpg', '', p.nome)}
        <div><div class="item-nome">${esc(p.nome)}</div><div class="item-var">${esc(i.variacao)}</div>
          <div class="qtd"><button data-ci="${n}" data-d="-1" aria-label="Diminuir">−</button><span>${i.qtd}</span><button data-ci="${n}" data-d="1" aria-label="Aumentar">+</button></div></div>
        <div><div class="item-preco">${real(precoItem(i) * i.qtd)}</div><button class="item-remover" data-rm="${n}">remover</button></div>
      </div>`;
    }).join('');
    const t = total(), falta = Math.max(0, FRETE_GRATIS - t);
    rod.innerHTML = `
      <div class="frete-barra">${falta ? `Faltam <b>${real(falta)}</b> para o frete grátis` : '<b>Você ganhou frete grátis!</b>'}
        <div class="trilha"><i style="width:${Math.min(100, (t / FRETE_GRATIS) * 100)}%"></i></div></div>
      <div class="linha-total"><span>Total</span><span>${real(t)}</span></div>
      <button class="btn btn-largo" id="finalizar">Finalizar pelo WhatsApp</button>
      <small style="color:var(--mudo);text-align:center">Arquivos STL não pagam frete.</small>`;
    $('#finalizar').addEventListener('click', () => {
      const linhas = carrinho.map((i) => `• ${i.qtd}× ${prodPorId[i.id].nome} (${i.variacao}) — ${real(precoItem(i) * i.qtd)}`);
      whatsapp(`Olá! Quero finalizar meu pedido:\n\n${linhas.join('\n')}\n\nTotal: ${real(total())}`);
    });
  }
  $('#carrinhoItens').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ci]'); const rm = e.target.closest('[data-rm]');
    if (b) { const i = carrinho[b.dataset.ci]; i.qtd += Number(b.dataset.d); if (i.qtd < 1) carrinho.splice(b.dataset.ci, 1); }
    else if (rm) carrinho.splice(rm.dataset.rm, 1);
    else return;
    salvar(); desenhaCarrinho();
  });
  $$('[data-fechar]').forEach((b) => b.addEventListener('click', fechar));
  atualizaBolha();

  /* ---------- Aviso rápido ---------- */
  let tAviso;
  function aviso(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('ativo');
    clearTimeout(tAviso); tAviso = setTimeout(() => t.classList.remove('ativo'), 2600);
  }
})();
