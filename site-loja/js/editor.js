/* Modo de edição da loja.
   Só liga quando o site está aberto no Claude por quem pode editar:
   - clique em qualquer foto para trocar;
   - painel lateral para textos, preços, produtos e perguntas;
   - "Baixar site" gera um .zip pronto para hospedar (Netlify, Hostinger...).
   Fora do Claude (site publicado) este arquivo não faz nada. */
(function () {
  'use strict';
  if (!window.claude || typeof window.claude.use !== 'function') return;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const { esc, real } = window.Loja;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const PADRAO = clone(window.LOJA);

  let db = null, assets = null, downloads = null;
  let salvo = clone(window.LOJA);   // o que está gravado
  let rascunho = clone(window.LOJA); // o que está na tela
  let fotos = {};                   // caminho -> id do arquivo enviado
  let sujo = false;

  const urlDe = (id) => '/_blob/' + id;
  function aplicarFotos() {
    window.LOJA_FOTOS = Object.fromEntries(Object.entries(fotos).map(([c, id]) => [c, urlDe(id)]));
  }
  // completa campos que faltem no que foi salvo (ex.: seção nova no modelo)
  function completar(cfg) {
    const out = clone(PADRAO);
    for (const k of Object.keys(cfg || {})) out[k] = cfg[k];
    return out;
  }

  /* ---------- Carregamento ---------- */
  document.body.classList.add('carregando');
  const solta = setTimeout(() => document.body.classList.remove('carregando'), 6000);

  (async () => {
    const [d, u, a, dl] = await Promise.all(['db', 'user', 'assets', 'downloads'].map((n) => window.claude.use(n).catch(() => null)));
    db = d; assets = a; downloads = dl;
    if (db) {
      try {
        const [c, f] = await Promise.all([db.doc('loja/config').get(), db.doc('loja/fotos').get()]);
        if (f.exists) fotos = Object.fromEntries((f.data().lista || []).map((x) => [x.c, x.id]));
        if (c.exists && c.data().config) salvo = completar(c.data().config);
        rascunho = clone(salvo);
        aplicarFotos();
        window.Loja.montar(rascunho);
      } catch (e) { /* sem dados salvos: fica o modelo */ }
    }
    clearTimeout(solta);
    document.body.classList.remove('carregando');

    const podeEditar = !!(u && await u.canEdit().catch(() => false)) && !!db;
    if (podeEditar) iniciarEditor();
  })();

  /* ---------- Editor ---------- */
  function iniciarEditor() {
    const botao = document.createElement('button');
    botao.className = 'ed-abrir';
    botao.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg> Editar loja';
    document.body.appendChild(botao);

    const painel = document.createElement('aside');
    painel.className = 'ed-painel';
    painel.innerHTML = `
      <div class="ed-cab">
        <strong>Editar loja</strong>
        <button class="icone" data-ed="fechar" aria-label="Fechar editor">✕</button>
      </div>
      <p class="ed-dica">${assets ? '<b>Fotos:</b> clique em qualquer foto do site (ou nas miniaturas abaixo) para enviar uma nova.' : 'Para enviar fotos é preciso ser dono ou editor deste site.'}</p>
      <div class="ed-corpo" id="edCorpo"></div>
      <div class="ed-rodape">
        <span class="ed-status" id="edStatus">Tudo salvo</span>
        <button class="btn btn-contorno" data-ed="descartar">Desfazer</button>
        <button class="btn" data-ed="salvar">Salvar</button>
        <button class="btn btn-contorno ed-zip" data-ed="zip">Baixar site (.zip) para publicar</button>
      </div>`;
    document.body.appendChild(painel);

    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.hidden = true;
    document.body.appendChild(input);

    const abrirPainel = () => { document.body.classList.add('editando'); desenharForm(); };
    const fecharPainel = () => {
      if (sujo && !confirm('Há alterações não salvas. Fechar mesmo assim? (elas continuam na tela até recarregar)')) return;
      document.body.classList.remove('editando');
    };
    botao.addEventListener('click', abrirPainel);
    painel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ed]'); if (!b) return;
      const acao = b.dataset.ed;
      if (acao === 'fechar') fecharPainel();
      if (acao === 'salvar') salvar();
      if (acao === 'descartar') { rascunho = clone(salvo); marcar(false); window.Loja.montar(rascunho); desenharForm(); }
      if (acao === 'zip') baixarZip();
    });
    window.addEventListener('beforeunload', (e) => { if (sujo) { e.preventDefault(); e.returnValue = ''; } });

    /* ----- troca de foto: clique em qualquer quadro em modo de edição ----- */
    let alvoFoto = null;
    document.addEventListener('click', (e) => {
      if (!document.body.classList.contains('editando') || !assets) return;
      const quadro = e.target.closest('.foto[data-caminho], #logo');
      if (!quadro) return;
      if (e.target.closest('.produto-add')) return;
      e.preventDefault(); e.stopPropagation();
      alvoFoto = quadro.dataset.caminho;
      input.value = '';
      input.click();
    }, true);
    input.addEventListener('change', async () => {
      const arq = input.files[0];
      if (!arq || !alvoFoto) return;
      const caminho = alvoFoto;
      status('Enviando foto…');
      try {
        const blob = await reduzir(arq);
        const r = await assets.upload(blob, { type: blob.type || 'image/jpeg' });
        const antigo = fotos[caminho];
        fotos[caminho] = r.id;
        await db.doc('loja/fotos').set({ lista: Object.entries(fotos).map(([c, id]) => ({ c, id })) });
        if (antigo && !Object.values(fotos).includes(antigo)) assets.delete(antigo).catch(() => {});
        aplicarFotos();
        if (caminho === 'logo.png' && !rascunho.marca.logo) rascunho.marca.logo = 'logo.png';
        const produtoAberto = $('#modalProduto').classList.contains('aberto') && $('#modalConteudo').dataset.produto;
        window.Loja.montar(rascunho);
        if (produtoAberto) window.Loja.abrirProduto(produtoAberto);
        desenharForm();
        status(sujo ? 'Foto salva · textos com alterações não salvas' : 'Foto salva');
        window.Loja.aviso('Foto atualizada');
      } catch (err) {
        const msg = { too_large: 'Foto grande demais (máx. 20 MB).', unsupported_type: 'Formato não aceito: use JPG, PNG ou WEBP.', quota_or_state: 'Espaço de fotos cheio.', rate_limited: 'Muitos envios seguidos, espere um pouco.' }[err && err.code];
        status(msg || 'Não foi possível enviar a foto. Tente de novo.', true);
      }
    });

    /* ----- formulário ----- */
    const SECOES = [
      { titulo: 'Marca e contato', aberto: true, campos: [
        ['marca.nome', 'Nome da loja'], ['marca.slogan', 'Slogan'], ['marca.cidade', 'Frase acima do "Sobre"'],
        ['contato.whatsapp', 'WhatsApp (55 + DDD + número)'], ['contato.email', 'E-mail'],
        ['contato.instagram', 'Instagram (link)'], ['contato.youtube', 'YouTube (link)'], ['contato.facebook', 'Facebook (link)'],
        ['mostrarAvisosDeFoto', 'Mostrar o nome do arquivo nos quadros sem foto', 'bool'],
      ], fotos: [['logo.png', 'Logo (PNG transparente)']] },
      { titulo: 'Faixa de avisos do topo', lista: 'barraAvisos', simples: true, novo: () => 'Novo aviso' },
      { titulo: 'Banners', lista: 'banners', fixo: true, rotulo: (b) => b.titulo,
        foto: (b) => b.foto, campos: [['titulo', 'Título'], ['texto', 'Texto', 'area'], ['botao', 'Texto do botão']] },
      { titulo: 'Coleções', lista: 'categorias', fixo: true, rotulo: (c) => c.nome,
        foto: (c) => c.foto, campos: [['nome', 'Nome'], ['texto', 'Descrição', 'area']] },
      { titulo: 'Produtos', lista: 'produtos', busca: true, rotulo: (p) => `${p.nome} · ${real(p.preco)}`,
        foto: (p) => 'produtos/' + p.id + '.jpg',
        campos: [['nome', 'Nome'], ['cat', 'Coleção', 'cat'], ['preco', 'Preço (R$)', 'num'], ['de', 'Preço antigo riscado (opcional)', 'num'],
          ['selo', 'Etiqueta (ex.: Novo, Promo)'], ['descricao', 'Descrição (opcional)', 'area']],
        novo: () => ({ id: 'p' + Date.now().toString(36), cat: rascunho.categorias[0].id, nome: 'Novo produto', preco: 0 }) },
      { titulo: 'Opções de compra (STL / impresso)', lista: 'variacoesPadrao', rotulo: (v) => v.nome,
        campos: [['nome', 'Nome da opção'], ['acrescimo', 'Valor a mais (R$)', 'num']], novo: () => ({ nome: 'Nova opção', acrescimo: 0 }) },
      { titulo: 'Sobre', campos: [['sobre.titulo', 'Título'], ['sobre.texto', 'Texto', 'area'], ['sobre.botao', 'Texto do botão']],
        fotos: [['sobre.foto', 'Foto do "Sobre"', true]] },
      { titulo: 'Assinatura', campos: [['assinatura.titulo', 'Título'], ['assinatura.texto', 'Texto', 'area'],
        ['assinatura.preco', 'Preço por mês (R$)', 'num'], ['assinatura.botao', 'Texto do botão']],
        fotos: [['assinatura.foto', 'Foto de fundo', true]], extraLista: { chave: 'assinatura.itens', titulo: 'Vantagens do plano' } },
      { titulo: 'Perguntas frequentes', lista: 'faq', rotulo: (f) => f.p,
        campos: [['p', 'Pergunta'], ['r', 'Resposta', 'area']], novo: () => ({ p: 'Nova pergunta', r: '' }) },
      { titulo: 'Rodapé', campos: [['rodape.texto', 'Texto'], ['rodape.copyright', 'Direitos']] },
    ];

    const pega = (obj, cam) => cam.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
    const poe = (obj, cam, v) => { const ks = cam.split('.'); const ult = ks.pop(); ks.reduce((o, k) => (o[k] = o[k] || {}), obj)[ult] = v; };
    const abertos = new Set(['Marca e contato']);
    let filtroProd = '';

    function miniFoto(caminho, legenda) {
      return `<div class="ed-foto">${window.Loja.foto(caminho, legenda, legenda, 'ed-mini')}<span>${esc(legenda)}</span></div>`;
    }
    function campo(base, cam, rotulo, tipo) {
      const v = pega(base, cam);
      const nome = esc(cam);
      if (tipo === 'bool') return `<label class="ed-check"><input type="checkbox" data-c="${nome}" ${v ? 'checked' : ''}> ${esc(rotulo)}</label>`;
      if (tipo === 'area') return `<label class="ed-campo"><span>${esc(rotulo)}</span><textarea rows="3" data-c="${nome}">${esc(v ?? '')}</textarea></label>`;
      if (tipo === 'cat') return `<label class="ed-campo"><span>${esc(rotulo)}</span><select data-c="${nome}">${rascunho.categorias.map((c) => `<option value="${esc(c.id)}" ${c.id === v ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></label>`;
      if (tipo === 'num') return `<label class="ed-campo"><span>${esc(rotulo)}</span><input type="number" step="0.01" min="0" inputmode="decimal" data-c="${nome}" data-num value="${v ?? ''}"></label>`;
      return `<label class="ed-campo"><span>${esc(rotulo)}</span><input type="text" data-c="${nome}" value="${esc(v ?? '')}"></label>`;
    }

    function desenharForm() {
      const corpo = $('#edCorpo');
      const rolagem = corpo.scrollTop;
      corpo.innerHTML = SECOES.map((s) => {
        let html = '';
        if (s.fotos) html += `<div class="ed-fotos">${s.fotos.map(([c, leg, ehCaminho]) => miniFoto(ehCaminho ? pega(rascunho, c) : c, leg)).join('')}</div>`;
        if (s.campos && !s.lista) html += s.campos.map(([c, r, t]) => campo(rascunho, c, r, t)).join('');
        if (s.extraLista) {
          const arr = pega(rascunho, s.extraLista.chave) || [];
          html += `<div class="ed-sub">${esc(s.extraLista.titulo)}</div>` + arr.map((t, i) => `
            <div class="ed-linha"><input type="text" data-c="${esc(s.extraLista.chave)}.${i}" value="${esc(t)}"><button class="ed-x" data-rem="${esc(s.extraLista.chave)}" data-i="${i}" aria-label="Remover">✕</button></div>`).join('')
            + `<button class="ed-mais" data-add-lista="${esc(s.extraLista.chave)}">+ adicionar vantagem</button>`;
        }
        if (s.lista) {
          const arr = rascunho[s.lista] || [];
          if (s.busca) html += `<input type="search" class="ed-busca" placeholder="Buscar produto…" value="${esc(filtroProd)}" data-busca>`;
          if (s.simples) {
            html += arr.map((t, i) => `<div class="ed-linha"><input type="text" data-c="${s.lista}.${i}" value="${esc(t)}"><button class="ed-x" data-rem="${s.lista}" data-i="${i}" aria-label="Remover">✕</button></div>`).join('');
          } else {
            html += arr.map((item, i) => {
              if (s.busca && filtroProd && !item.nome.toLowerCase().includes(filtroProd.toLowerCase())) return '';
              const chave = s.lista + ':' + (item.id || i);
              return `<details class="ed-item" data-chave="${esc(chave)}" ${abertos.has(chave) ? 'open' : ''}>
                <summary>${s.foto ? `<img src="${esc(window.Loja.fotoUrl(s.foto(item)))}" alt="" onerror="this.style.visibility='hidden'">` : ''}<span>${esc(s.rotulo(item) || '(sem nome)')}</span></summary>
                <div class="ed-item-corpo">
                  ${s.foto ? `<div class="ed-fotos">${miniFoto(s.foto(item), s.lista === 'produtos' ? 'Foto principal' : 'Foto')}
                    ${s.lista === 'produtos' ? [2, 3, 4].map((n) => miniFoto(`produtos/${item.id}-${n}.jpg`, `Extra ${n}`)).join('') : ''}</div>` : ''}
                  ${s.campos.map(([c, r, t]) => campo(rascunho, `${s.lista}.${i}.${c}`, r, t)).join('')}
                  ${s.fixo ? '' : `<button class="ed-remover" data-rem="${s.lista}" data-i="${i}">Remover</button>`}
                </div>
              </details>`;
            }).join('');
          }
          if (!s.fixo) html += `<button class="ed-mais" data-novo="${s.lista}">+ adicionar</button>`;
        }
        return `<details class="ed-secao" data-secao="${esc(s.titulo)}" ${abertos.has(s.titulo) ? 'open' : ''}><summary>${esc(s.titulo)}${s.lista ? ` <small>${(rascunho[s.lista] || []).length}</small>` : ''}</summary><div class="ed-secao-corpo">${html}</div></details>`;
      }).join('');
      corpo.scrollTop = rolagem;
    }

    let tRedesenho;
    const corpo = $('#edCorpo');
    corpo.addEventListener('toggle', (e) => {
      const d = e.target; const k = d.dataset.secao || d.dataset.chave; if (!k) return;
      d.open ? abertos.add(k) : abertos.delete(k);
    }, true);
    corpo.addEventListener('input', (e) => {
      const el = e.target;
      if (el.matches('[data-busca]')) {
        filtroProd = el.value; const pos = el.selectionStart;
        desenharForm(); const b = $('[data-busca]', corpo); b.focus(); b.setSelectionRange(pos, pos); return;
      }
      if (!el.dataset.c) return;
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (el.dataset.num !== undefined) v = el.value === '' ? (el.dataset.c.endsWith('.de') ? null : 0) : Number(el.value);
      if (v === null) { const ks = el.dataset.c.split('.'); const ult = ks.pop(); delete pega(rascunho, ks.join('.'))[ult]; }
      else poe(rascunho, el.dataset.c, v);
      marcar(true);
      clearTimeout(tRedesenho);
      tRedesenho = setTimeout(() => {
        window.Loja.montar(rascunho);
        // atualiza só os títulos resumidos, sem perder o foco do campo
        $$('.ed-item', corpo).forEach((d) => {
          const [lista, id] = d.dataset.chave.split(':');
          const s = SECOES.find((x) => x.lista === lista);
          const item = (rascunho[lista] || []).find((x, i) => String(x.id || i) === id);
          if (s && item) $('summary span', d).textContent = s.rotulo(item) || '(sem nome)';
        });
      }, 300);
    });
    corpo.addEventListener('click', (e) => {
      const rem = e.target.closest('[data-rem]');
      const novo = e.target.closest('[data-novo]');
      const addL = e.target.closest('[data-add-lista]');
      if (rem) {
        const arr = pega(rascunho, rem.dataset.rem);
        const item = arr[Number(rem.dataset.i)];
        const nome = typeof item === 'string' ? item : (item.nome || item.p || 'este item');
        if (!confirm(`Remover "${nome}"?`)) return;
        arr.splice(Number(rem.dataset.i), 1);
      } else if (novo) {
        const s = SECOES.find((x) => x.lista === novo.dataset.novo);
        const item = s.novo();
        rascunho[s.lista].push(item);
        if (item.id) { abertos.add(s.lista + ':' + item.id); filtroProd = ''; }
        else abertos.add(s.lista + ':' + (rascunho[s.lista].length - 1));
      } else if (addL) {
        const arr = pega(rascunho, addL.dataset.addLista) || [];
        arr.push('Nova vantagem'); poe(rascunho, addL.dataset.addLista, arr);
      } else return;
      e.preventDefault();
      marcar(true);
      window.Loja.montar(rascunho);
      desenharForm();
    });

    function marcar(v) { sujo = v; status(v ? 'Alterações não salvas' : 'Tudo salvo', false, v); }
    function status(t, erro, pendente) {
      const s = $('#edStatus'); s.textContent = t;
      s.classList.toggle('erro', !!erro); s.classList.toggle('pendente', !!pendente);
    }

    let salvando = false;
    async function salvar() {
      if (salvando) return;
      salvando = true; status('Salvando…');
      try {
        await db.doc('loja/config').set({ config: rascunho, em: Date.now() });
        salvo = clone(rascunho);
        marcar(false);
        window.Loja.aviso('Alterações salvas');
      } catch (err) {
        status(err && err.code === 'invalid_argument' ? 'Você não tem permissão para salvar.' : 'Não foi possível salvar. Tente de novo.', true);
      } finally { salvando = false; }
    }

    /* ----- baixar o site pronto ----- */
    async function baixarZip() {
      if (!downloads) { status('Download indisponível nesta tela.', true); return; }
      status('Montando o .zip…');
      try {
        if (!window.JSZip) await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        const zip = new window.JSZip();
        const texto = async (p) => { const r = await fetch(p); if (!r.ok) throw new Error(p); return r.text(); };
        const [html, css, js] = await Promise.all([texto('modelo.html'), texto('css/estilo.css'), texto('js/loja.js')]);
        zip.file('index.html', html.replace(/\s*<script src="js\/editor\.js"><\/script>/, ''));
        zip.file('css/estilo.css', css);
        zip.file('js/loja.js', js);
        const cfg = clone(rascunho);
        zip.file('js/config.js', '/* Configuração da loja — gerada pelo editor. */\nwindow.LOJA = ' + JSON.stringify(cfg, null, 2) + ';\n');
        let n = 0;
        for (const [caminho, id] of Object.entries(fotos)) {
          const r = await fetch(urlDe(id));
          if (r.ok) { zip.file('fotos/' + caminho, await r.blob()); n++; }
        }
        zip.file('LEIA-ME.txt', `Site ${cfg.marca.nome} pronto para publicar.\n\nPara colocar no ar: entre em netlify.com/drop e arraste esta pasta (descompactada).\nOu envie todos os arquivos para a hospedagem (Hostinger, etc.), mantendo as pastas.\n\nFotos incluídas: ${n}\n`);
        const blob = await zip.generateAsync({ type: 'blob' });
        const nome = cfg.marca.nome.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'loja';
        await downloads.save({ filename: `site-${nome}.zip`, data: blob });
        status(sujo ? 'Zip baixado · lembre de salvar as alterações' : 'Zip baixado');
      } catch (err) {
        if (err && err.code === 'declined') { status(sujo ? 'Alterações não salvas' : 'Tudo salvo', false, sujo); return; }
        status('Não foi possível gerar o .zip.', true);
      }
    }
    function carregarScript(src) {
      return new Promise((ok, falha) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = falha; document.head.appendChild(s); });
    }
  }

  /* reduz fotos muito grandes antes de enviar (máx. 2000 px, JPG 85%) */
  async function reduzir(arq) {
    if (!/^image\/(jpeg|png|webp)$/.test(arq.type)) return arq;
    try {
      const bmp = await createImageBitmap(arq);
      const max = 2000;
      if (bmp.width <= max && bmp.height <= max && arq.size < 1.5e6) return arq;
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      const tipo = arq.type === 'image/png' ? 'image/png' : 'image/jpeg';
      return await new Promise((ok) => cv.toBlob((b) => ok(b || arq), tipo, 0.85));
    } catch (e) { return arq; }
  }
})();
