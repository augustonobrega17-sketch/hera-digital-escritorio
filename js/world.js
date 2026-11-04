/* ===========================================================
   world.js — a planta do andar da Hera Digital
   Grade 64 x 34, 12º andar de um prédio comercial.
   Em cima: sala do chefe, sala dos funcionários e recepção com elevadores.
   Embaixo: sala de jogos, cozinha e sala de reunião.
   No meio: o corredor que liga tudo.
   =========================================================== */
const WORLD = (() => {

  const W = 64, H = 34;

  const VOID = 0, FLOOR = 1, WALL = 2, DOOR = 3;

  /* ---------- paleta (manual de marca Hera Digital) ---------- */
  const C = {
    fire1: '#6C3BFF', fire2: '#8A5CFF', fire3: '#FFB547',
    volt1: '#12D6C5', volt2: '#5B2EE8',
    rosa:  '#FF4F8B', ouro: '#FFB547', marmore: '#F5F2FF',
    dark:  '#0F0A24', wall: '#2a2150', wallTop: '#3a2f6a'
  };

  /* ---------- salas ---------- */
  const ROOMS = {
    diretoria: {
      id: 'diretoria', name: 'SALA DO CHEFE', short: 'Chefe',
      bx: 0, by: 0, bw: 15, bh: 19,
      x1: 1, y1: 1, x2: 13, y2: 17,
      accent: C.ouro,
      floorA: '#4a3326', floorB: '#523a2b',
      desc: 'A sala do Augusto. Piso de madeira, janelas para a cidade, quadro de ideias e mesa de sócio.'
    },
    servico: {
      id: 'servico', name: 'SALA DOS FUNCIONÁRIOS', short: 'Funcionários',
      bx: 18, by: 0, bw: 30, bh: 19,
      x1: 19, y1: 1, x2: 46, y2: 17,
      accent: C.volt1,
      floorA: '#24204a', floorB: '#292452',
      desc: 'O estúdio criativo: 12 estações para estratégia, tráfego, conteúdo, design e dados.'
    },
    recepcao: {
      id: 'recepcao', name: 'RECEPÇÃO', short: 'Recepção',
      bx: 50, by: 0, bw: 14, bh: 19,
      x1: 51, y1: 1, x2: 62, y2: 17,
      accent: C.fire2,
      floorA: '#3a3560', floorB: '#423c6a',
      desc: 'Hall dos elevadores, balcão com a parede de logo e sala de espera para clientes.'
    },
    lounge: {
      id: 'lounge', name: 'SALA DE JOGOS', short: 'Jogos',
      bx: 0, by: 22, bw: 30, bh: 12,
      x1: 1, y1: 23, x2: 28, y2: 32,
      accent: C.rosa,
      floorA: '#2e1c48', floorB: '#352052',
      desc: 'Fliperamas, sinuca, pebolim, pingue-pongue, TV com videogame e pufes.'
    },
    cozinha: {
      id: 'cozinha', name: 'COZINHA', short: 'Cozinha',
      bx: 32, by: 22, bw: 16, bh: 12,
      x1: 33, y1: 23, x2: 46, y2: 32,
      accent: '#FF8A3D',
      floorA: '#3d3a52', floorB: '#4b4864',
      desc: 'Bancada com cafeteira, geladeira, ilha com banquetas e mesa para almoçar junto.'
    },
    reuniao: {
      id: 'reuniao', name: 'SALA DE REUNIÃO', short: 'Reunião',
      bx: 48, by: 22, bw: 16, bh: 12,
      x1: 49, y1: 23, x2: 62, y2: 32,
      accent: '#9B7BFF',
      floorA: '#1f2548', floorB: '#252c54',
      desc: 'Mesa de oito lugares e painel de LED. É aqui que os agentes se reúnem.'
    },
    corredor: {
      id: 'corredor', name: 'CORREDOR', short: 'Corredor',
      accent: '#7d74b0',
      floorA: '#1d1838', floorB: '#221c40',
      desc: 'A circulação do andar, ligando a recepção a todas as salas.'
    }
  };

  /* ---------- portas (x, y, orientação) ---------- */
  const DOORS = [
    { x: 14, y: 8,  o: 'v' }, { x: 14, y: 9,  o: 'v' },   // chefe        -> hall vertical
    { x: 5,  y: 18, o: 'h' }, { x: 6,  y: 18, o: 'h' },   // chefe        -> corredor
    { x: 18, y: 8,  o: 'v' }, { x: 18, y: 9,  o: 'v' },   // funcionários -> hall vertical
    { x: 30, y: 18, o: 'h' }, { x: 31, y: 18, o: 'h' },   // funcionários -> corredor
    { x: 55, y: 18, o: 'h' }, { x: 56, y: 18, o: 'h' }, { x: 57, y: 18, o: 'h' }, // recepção -> corredor
    { x: 13, y: 22, o: 'h' }, { x: 14, y: 22, o: 'h' },   // jogos        -> corredor
    { x: 24, y: 22, o: 'h' }, { x: 25, y: 22, o: 'h' },   // jogos        -> corredor (2ª porta)
    { x: 43, y: 22, o: 'h' }, { x: 44, y: 22, o: 'h' },   // cozinha      -> corredor (entre geladeira e bebedouro)
    { x: 54, y: 22, o: 'h' }, { x: 55, y: 22, o: 'h' }    // reunião      -> corredor
  ];

  /* ---------- grade ---------- */
  const kind   = new Uint8Array(W * H);
  const roomOf = new Array(W * H).fill(null);
  const blocked = new Uint8Array(W * H);   // móveis ocupando o tile

  const idx = (x, y) => y * W + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

  function buildGrid() {
    kind.fill(FLOOR);
    for (let i = 0; i < W * H; i++) roomOf[i] = 'corredor';

    // anel externo
    for (let x = 0; x < W; x++) { kind[idx(x, 0)] = WALL; kind[idx(x, H - 1)] = WALL; }
    for (let y = 0; y < H; y++) { kind[idx(0, y)] = WALL; kind[idx(W - 1, y)] = WALL; }

    // faixa morta entre as salas de baixo e as de cima já é corredor (y 19..21)

    for (const r of Object.values(ROOMS)) {
      if (r.bw === undefined) continue;
      const x0 = r.bx, y0 = r.by, x1 = r.bx + r.bw - 1, y1 = r.by + r.bh - 1;
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          if (!inside(x, y)) continue;
          const borda = (x === x0 || x === x1 || y === y0 || y === y1);
          if (borda) { kind[idx(x, y)] = WALL; roomOf[idx(x, y)] = r.id; }
          else       { kind[idx(x, y)] = FLOOR; roomOf[idx(x, y)] = r.id; }
        }
      }
    }

    for (const d of DOORS) if (inside(d.x, d.y)) kind[idx(d.x, d.y)] = DOOR;
  }
  buildGrid();

  const kindAt  = (x, y) => inside(x, y) ? kind[idx(x, y)] : VOID;
  const roomAt  = (x, y) => inside(x, y) ? roomOf[idx(x, y)] : null;
  const isWall  = (x, y) => kindAt(x, y) === WALL;

  /** o tile dá para pisar? (usado pelo A*) */
  function walkable(x, y) {
    if (!inside(x, y)) return false;
    const k = kind[idx(x, y)];
    return (k === FLOOR || k === DOOR) && !blocked[idx(x, y)];
  }
  function setBlocked(x, y, v = 1) {
    if (inside(x, y)) blocked[idx(x, y)] = v;
  }

  /* ---------- alturas de parede ----------
     Uma parede que tem chão ATRÁS dela (em x-1 ou y-1) taparia
     a visão: ela vira parapeito sólido + vidro fumê por cima.
     As demais sobem inteiras e viram painel de LED / logo.        */
  const WALL_H = 108, PARAPET = 40;

  function wallOccludes(x, y) {
    const a = kindAt(x - 1, y), b = kindAt(x, y - 1);
    return a === FLOOR || a === DOOR || b === FLOOR || b === DOOR;
  }

  /* ---------- painéis nas paredes altas ---------- */
  const SIGNS = [
    { o: 'n', x: 1,  y: 0,  len: 7,  kind: 'eventos'  },  // chefe: próximos eventos
    { o: 'n', x: 8,  y: 0,  len: 6,  kind: 'janela'   },  // chefe: janela para a cidade
    { o: 'w', x: 0,  y: 3,  len: 8,  kind: 'quadro'   },  // chefe: quadro branco
    { o: 'w', x: 0,  y: 12, len: 6,  kind: 'janela'   },  // chefe: janela lateral
    { o: 'n', x: 15, y: 0,  len: 3,  kind: 'janela'   },  // hall
    { o: 'n', x: 19, y: 0,  len: 4,  kind: 'janela'   },  // funcionários
    { o: 'n', x: 23, y: 0,  len: 8,  kind: 'equipe'   },  // funcionários: a equipe agora
    { o: 'n', x: 31, y: 0,  len: 9,  kind: 'nome'     },  // nome da agência (config)
    { o: 'n', x: 40, y: 0,  len: 7,  kind: 'janela'   },  // funcionários
    { o: 'n', x: 48, y: 0,  len: 2,  kind: 'janela'   },  // hall
    { o: 'n', x: 51, y: 0,  len: 2,  kind: 'elevador', num: 1 },  // recepção: elevador 1
    { o: 'n', x: 54, y: 0,  len: 6,  kind: 'logo'     },  // recepção: parede de logo
    { o: 'n', x: 61, y: 0,  len: 2,  kind: 'elevador', num: 2 },  // recepção: elevador 2
    { o: 'w', x: 0,  y: 19, len: 3,  kind: 'janela'   },  // fim do corredor
    { o: 'w', x: 0,  y: 24, len: 7,  kind: 'nome'     },  // jogos
    { o: 'w', x: 0,  y: 31, len: 2,  kind: 'janela'   }   // jogos
  ];

  /* ===========================================================
     DESENHO
     =========================================================== */

  /** superfície de parede em espaço "u (px ao longo) × v (px para baixo)" */
  function wallFace(ctx, orient, x, y, lenTiles, topZ, fn) {
    const T = ISO.TW;
    let o, a, b;
    if (orient === 'n') {                       // face virada para +y
      o = ISO.toScreen(x, y + 1, topZ);
      a =  ISO.HW / T; b =  ISO.HH / T;
    } else {                                    // 'w' — face virada para +x
      // começa na ponta de baixo e cresce subindo à direita;
      // pelo outro lado o texto sairia espelhado
      o = ISO.toScreen(x + 1, y + lenTiles, topZ);
      a =  ISO.HW / T; b = -ISO.HH / T;
    }
    ctx.save();
    ctx.transform(a, b, 0, 1, o.x, o.y);
    fn(ctx, lenTiles * T);
    ctx.restore();
  }

  /* ---- chão ----
     O piso é fixo: 1632 losangos por quadro era desperdício puro. Ele é
     pintado uma vez num canvas próprio e depois só copiado; só o brilho
     RGB refletido continua sendo calculado a cada quadro.                */
  let pisoCache = null;
  function montaPiso() {
    const x0 = ISO.toScreen(0, H - 1).x - ISO.TW;
    const x1 = ISO.toScreen(W - 1, 0).x + ISO.TW;
    const y0 = ISO.toScreen(0, 0).y - 4;
    const y1 = ISO.toScreen(W - 1, H - 1).y + ISO.TH + 4;
    const cv = document.createElement('canvas');
    cv.width  = Math.ceil(x1 - x0);
    cv.height = Math.ceil(y1 - y0);
    const c = cv.getContext('2d');
    c.translate(-x0, -y0);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = kind[idx(x, y)];
        if (k !== FLOOR && k !== DOOR) continue;
        const r = ROOMS[roomOf[idx(x, y)]] || ROOMS.corredor;
        let col = ((x + y) & 1) ? r.floorA : r.floorB;
        if (k === DOOR) col = ISO.shade(r.accent, -0.62);
        ISO.tile(c, x, y, col, 'rgba(255,255,255,.028)');
      }
    }
    // faixa pintada no corredor (guia da recepção até as salas)
    c.save();
    c.globalAlpha = .55;
    for (let x = 2; x <= W - 3; x++) {
      if (walkable(x, 20) && roomAt(x, 20) === 'corredor')
        ISO.tile(c, x, 20, ISO.rgba(C.fire2, .14));
    }
    c.restore();
    // tábuas do piso de madeira da sala do chefe
    c.save();
    c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = 1;
    for (let y = 1; y <= 17; y++) for (let x = 1; x <= 13; x++) {
      const a = ISO.toScreen(x + .5, y), b = ISO.toScreen(x + .5, y + 1);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    c.restore();
    pisoCache = { cv, x: x0, y: y0 };
  }

  /* ---- a laje do prédio: o andar é uma fatia de um edifício real ---- */
  const LAJE = 46;
  function drawSlab(ctx) {
    const P = ISO.toScreen;
    // face sul (virada para +y)
    let g = ctx.createLinearGradient(0, P(0, H, 0).y, 0, P(0, H, -LAJE).y);
    g.addColorStop(0, '#3a3160'); g.addColorStop(1, '#151129');
    ISO.quad(ctx, [P(0, H, 0), P(W, H, 0), P(W, H, -LAJE), P(0, H, -LAJE)], g);
    // face leste (virada para +x)
    g = ctx.createLinearGradient(0, P(W, 0, 0).y, 0, P(W, 0, -LAJE).y);
    g.addColorStop(0, '#2a2348'); g.addColorStop(1, '#0f0c20');
    ISO.quad(ctx, [P(W, 0, 0), P(W, H, 0), P(W, H, -LAJE), P(W, 0, -LAJE)], g);
    // friso de LED na borda da laje, nas cores da marca
    ISO.quad(ctx, [P(0, H, -3), P(W, H, -3), P(W, H, -6), P(0, H, -6)], ISO.rgba(C.fire2, .8));
    ISO.quad(ctx, [P(W, 0, -3), P(W, H, -3), P(W, H, -6), P(W, 0, -6)], ISO.rgba(C.volt1, .7));
    // janelas do andar de baixo, vistas de fora
    const hora = new Date().getHours();
    const noite = hora < 6 || hora >= 18;
    for (let x = 30; x < W; x += 2) {
      const acesa = noite && ((x * 7) % 5 < 3);
      ISO.quad(ctx, [P(x, H, -30), P(x + 1.4, H, -30), P(x + 1.4, H, -LAJE), P(x, H, -LAJE)],
               acesa ? 'rgba(255,200,110,.2)' : 'rgba(150,170,255,.07)');
    }
    for (let y = 1; y < H; y += 2) {
      const acesa = noite && ((y * 5) % 4 < 2);
      ISO.quad(ctx, [P(W, y, -30), P(W, y + 1.4, -30), P(W, y + 1.4, -LAJE), P(W, y, -LAJE)],
               acesa ? 'rgba(255,200,110,.16)' : 'rgba(150,170,255,.05)');
    }
    // letreiro na laje
    ctx.save();
    const o = P(3, H, -11);
    ctx.transform(ISO.HW / ISO.TW, ISO.HH / ISO.TW, 0, 1, o.x, o.y);
    ctx.font = "700 22px 'Sora', 'Barlow', sans-serif";
    ctx.fillStyle = 'rgba(245,242,255,.78)';
    ctx.textBaseline = 'top';
    ctx.letterSpacing = '6px';
    ctx.fillText('HERA DIGITAL  ·  12º ANDAR', 0, 0);
    ctx.restore();
  }

  function drawFloor(ctx, t) {
    if (!pisoCache) montaPiso();
    drawSlab(ctx);
    ctx.drawImage(pisoCache.cv, pisoCache.x, pisoCache.y);

    // brilho RGB refletido no piso da sala de serviço
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let x = ROOMS.servico.x1; x <= ROOMS.servico.x2; x += 7) {
      const p = ISO.toScreen(x, 1.5);
      const hue = matiz(t, x);
      ISO.glow(ctx, p.x, p.y, 120, ISO.hsl(hue, 90, 55), .07);
    }
    for (let x = ROOMS.lounge.x1; x <= ROOMS.lounge.x2; x += 8) {
      const p = ISO.toScreen(x, 28);
      const hue = matiz(t * 1.4, x * 2);
      ISO.glow(ctx, p.x, p.y, 150, ISO.hsl(hue, 95, 58), .07);
    }
    ctx.restore();
  }

  /* ---- rótulo flutuante de cada sala ---- */
  function drawRoomLabels(ctx) {
    const put = (r, cx, cy) => {
      const p = ISO.toScreen(cx, cy, 0);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '600 13px Barlow Semi Condensed, sans-serif';
      ctx.fillStyle = ISO.rgba(r.accent, .34);
      ctx.letterSpacing = '4px';
      ctx.fillText(r.name, p.x, p.y);
      ctx.restore();
    };
    put(ROOMS.diretoria, 7, 15.4);
    put(ROOMS.servico, 33, 16.2);
    put(ROOMS.recepcao, 57, 16.6);
    put(ROOMS.lounge, 14.5, 31.6);
    put(ROOMS.cozinha, 44.4, 27.4);
    put(ROOMS.reuniao, 56, 31.4);
  }

  /** matiz do LED: passeia só pelas cores da marca (pavão -> violeta -> rosa) */
  const matiz = (t, k) => 255 + 78 * Math.sin(t * .55 + k * .19);

  const cacheGrad = new Map();

  /* ---- uma parede ---- */
  function drawWallTile(ctx, x, y, t, rgbOn, zoom) {
    // afastado, o vidro fumê da divisória some em menos de um pixel
    const detalhe = (zoom === undefined || zoom > 0.7);
    const occ  = wallOccludes(x, y);
    const room = ROOMS[roomOf[idx(x, y)]] || ROOMS.corredor;
    const h    = occ ? PARAPET : WALL_H;

    const showLeft  = !isWall(x, y + 1);   // face virada para +y
    const showRight = !isWall(x + 1, y);   // face virada para +x
    if (!showLeft && !showRight) {
      ISO.plane(ctx, x, y, 1, 1, WALL_H, C.wallTop);
      return;
    }

    const P = ISO.toScreen;
    const base = C.wall;

    const faces = [];
    if (showLeft)  faces.push({ o: 'n', pts: [P(x, y+1, h), P(x+1, y+1, h), P(x+1, y+1, 0), P(x, y+1, 0)], sh: -0.05 });
    if (showRight) faces.push({ o: 'w', pts: [P(x+1, y, h), P(x+1, y+1, h), P(x+1, y+1, 0), P(x+1, y, 0)], sh: -0.3  });

    for (const f of faces) {
      // corpo
      // as coordenadas da face são fixas em espaço de mundo, então o
      // gradiente pode ser criado uma vez só por tile
      const ck = x + ',' + y + ',' + f.o;
      let g = cacheGrad.get(ck);
      if (!g) {
        g = ctx.createLinearGradient(0, f.pts[0].y, 0, f.pts[2].y);
        g.addColorStop(0, ISO.shade(base, f.sh + 0.06));
        g.addColorStop(1, ISO.shade(base, f.sh - 0.28));
        cacheGrad.set(ck, g);
      }
      ISO.quad(ctx, f.pts, g);

      // rodapé com fita de LED
      if (rgbOn) {
        const hue = matiz(t, x + y);
        const neon = ISO.hsl(hue, 92, 58);
        const y0 = f.pts[3].y, y1 = f.pts[0].y;
        const strip = [
          f.pts[3], f.pts[2],
          { x: f.pts[2].x, y: f.pts[2].y - 5 },
          { x: f.pts[3].x, y: f.pts[3].y - 5 }
        ];
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ISO.quad(ctx, strip, ISO.rgba(neon, .55));
        ctx.restore();
        void y0; void y1;
      }
    }

    // topo
    ISO.plane(ctx, x, y, 1, 1, h, occ ? ISO.rgba('#8fa4d8', .28) : C.wallTop);

    if (occ && detalhe) {
      // vidro fumê acima do parapeito
      for (const f of faces) {
        const top = [
          P(f.o === 'n' ? x : x + 1, f.o === 'n' ? y + 1 : y,     WALL_H),
          P(x + 1, y + 1, WALL_H),
          P(x + 1, y + 1, h),
          P(f.o === 'n' ? x : x + 1, f.o === 'n' ? y + 1 : y,     h)
        ];
        ISO.quad(ctx, top, ISO.rgba('#9fc4ff', .085));
        ISO.quad(ctx, top, null, ISO.rgba('#bcd8ff', .12));
      }
      ISO.plane(ctx, x, y, 1, 1, WALL_H, ISO.rgba(room.accent, rgbOn ? .30 : .12));
    }

    // trilho de LED no topo da parede — é a cara do lugar, nunca some
    if (rgbOn) {
      const hue = matiz(t, x + y);
      const neon = ISO.hsl(hue, 95, 60);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // a fita já brilha sozinha; um glow radial por tile custava mais
      // área pintada que a tela inteira, várias vezes por quadro
      ISO.plane(ctx, x + .02, y + .02, .96, .96, WALL_H + 2, ISO.rgba(neon, .6));
      ctx.restore();
    }

    drawSignTile(ctx, x, y, t, rgbOn);
  }

  /**
   * Fatia da placa que pertence a este tile de parede.
   * Uma placa larga tem uma profundidade só; se ela fosse um item solto na
   * ordenação, os tiles de parede depois dela pintariam por cima e a placa
   * parecia enfiada dentro da parede. Recortando por tile, cada pedaço é
   * pintado junto com a sua própria parede.
   */
  function drawSignTile(ctx, x, y, t, rgbOn) {
    for (const s of SIGNS) {
      const cobre = s.o === 'n'
        ? (s.y === y && x >= s.x && x < s.x + s.len)
        : (s.x === x && y >= s.y && y < s.y + s.len);
      if (!cobre) continue;

      // recorte por clip custava caro; agora copia só a fatia da placa que
      // é deste tile, direto do canvas em cache
      const T = ISO.TW;
      const off = s.o === 'n' ? (x - s.x) * T
                              : (s.y + s.len - 1 - y) * T;
      const cv = placaCanvas(s, t, rgbOn);
      wallFace(ctx, s.o, x, y, 1, WALL_H, (c) =>
        c.drawImage(cv, off, 0, T, WALL_H, 0, 0, T, WALL_H));
    }
  }

  /* ---- porta ---- */
  function drawDoorTile(ctx, x, y, t) {
    const d = DOORS.find(d => d.x === x && d.y === y);
    if (!d) return;
    const hue = matiz(t, x + y);
    const neon = ISO.hsl(hue, 95, 60);
    const P = ISO.toScreen;
    const h = 96;

    // batentes laterais
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (d.o === 'h') {
      ISO.quad(ctx, [P(x, y+1, h), P(x+1, y+1, h), P(x+1, y+1, h-4), P(x, y+1, h-4)], ISO.rgba(neon, .65));
    } else {
      ISO.quad(ctx, [P(x+1, y, h), P(x+1, y+1, h), P(x+1, y+1, h-4), P(x+1, y, h-4)], ISO.rgba(neon, .65));
    }
    const c = ISO.toScreen(x + .5, y + .5, 30);
    ISO.glow(ctx, c.x, c.y, 62, neon, .18);
    ctx.restore();
  }

  /** profundidade do painel, para ele entrar na ordenação junto com
      móveis e bonecos — senão ele seria pintado por cima de todo mundo */
  function signDepth(s) {
    return s.o === 'n' ? (s.x + s.len / 2) + (s.y + 1)
                       : (s.x + 1) + (s.y + s.len / 2);
  }

  /* ---- conteúdo de uma placa, em espaço plano de parede ---- */
  function pintaPlaca(c, s, len, t, rgbOn) {
    if (s.kind === 'nome') {
      const padY = 16, hgt = 62;
      c.fillStyle = 'rgba(4,5,10,.62)';
      ISO.rrect(c, 6, padY, len - 12, hgt, 8); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; c.stroke();
      signNome(c, len, padY, hgt, rgbOn);
    }
    else if (s.kind === 'equipe')   signEquipe(c, len, t, rgbOn);
    else if (s.kind === 'eventos')  signEventos(c, len, rgbOn);
    else if (s.kind === 'quadro')   signQuadro(c, len);
    else if (s.kind === 'janela')   signJanela(c, len, s);
    else if (s.kind === 'logo')     signLogo(c, len, t, rgbOn);
    else if (s.kind === 'elevador') signElevador(c, len, s, t);
  }

  /* ===========================================================
     MARCA — o símbolo da Hera desenhado direto no canvas
     (mesmo desenho de marca/hera-simbolo.svg)
     =========================================================== */
  const GOTA = (typeof Path2D !== 'undefined')
    ? new Path2D('M48 25.5C56 34 60.5 41.5 60.5 50.5a12.5 12.5 0 0 1-25 0C35.5 41.5 40 34 48 25.5Z')
    : null;
  /** símbolo Hera com canto superior esquerdo em (x, y) e lado s */
  function heraSymbol(c, x, y, s, alpha = 1) {
    const k = s / 96;
    c.save();
    c.globalAlpha *= alpha;
    c.translate(x, y); c.scale(k, k);
    const g = c.createLinearGradient(4, 4, 92, 92);
    g.addColorStop(0, '#8A5CFF'); g.addColorStop(.55, '#5B2EE8'); g.addColorStop(1, '#12D6C5');
    c.fillStyle = g;
    ISO.rrect(c, 4, 4, 88, 88, 28); c.fill();
    c.fillStyle = '#F5F2FF';
    ISO.rrect(c, 18, 21, 12, 54, 6); c.fill();
    ISO.rrect(c, 66, 21, 12, 54, 6); c.fill();
    ISO.rrect(c, 28, 49, 40, 7, 3.5); c.fill();
    if (GOTA) {
      const go = c.createLinearGradient(0, 25, 0, 63);
      go.addColorStop(0, '#FFD983'); go.addColorStop(1, '#FF9F2E');
      c.fillStyle = go; c.fill(GOTA);
      c.strokeStyle = '#0F0A24'; c.lineWidth = 3; c.stroke(GOTA);
    }
    c.fillStyle = '#12D6C5'; c.beginPath(); c.arc(48, 51, 6.4, 0, 7); c.fill();
    c.fillStyle = '#0F0A24'; c.beginPath(); c.arc(48, 51, 2.9, 0, 7); c.fill();
    c.restore();
  }

  /** logo horizontal: símbolo + "hera." + DIGITAL. Devolve a largura usada. */
  function heraLogo(c, x, y, alt, cor = '#F5F2FF') {
    heraSymbol(c, x, y, alt);
    c.save();
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.font = `800 ${alt * .56}px 'Sora', 'Barlow', sans-serif`;
    c.letterSpacing = `${-alt * .02}px`;
    c.fillStyle = cor;
    const tx = x + alt * 1.15;
    c.fillText('hera', tx, y + alt * .64);
    const wTxt = c.measureText('hera').width;
    c.fillStyle = C.ouro;
    c.beginPath(); c.arc(tx + wTxt + alt * .1, y + alt * .59, alt * .055, 0, 7); c.fill();
    c.font = `600 ${alt * .135}px 'Sora', 'Barlow', sans-serif`;
    c.letterSpacing = `${alt * .08}px`;
    c.fillStyle = C.volt1;
    c.fillText('DIGITAL', tx + 2, y + alt * .87);
    c.restore();
    return alt * 1.15 + wTxt + alt * .2;
  }

  /* ---- janela com a cidade lá fora: céu muda com o relógio de verdade ---- */
  function ceuAgora() {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    if (h < 5.5 || h >= 19.5) return { a: '#0b0a26', b: '#2a1f5c', noite: true };
    if (h < 7.5)  return { a: '#3b2a6b', b: '#ff9f6b', noite: false, baixo: true };
    if (h < 17)   return { a: '#4f8fe6', b: '#bfe0ff', noite: false };
    return { a: '#47308a', b: '#ff7a59', noite: false, baixo: true };
  }
  function signJanela(c, len, s) {
    const ceu = ceuAgora();
    const x0 = 6, y0 = 12, w = len - 12, h = 84;
    // caixilho
    c.fillStyle = '#151129';
    ISO.rrect(c, x0 - 4, y0 - 4, w + 8, h + 8, 4); c.fill();
    const g = c.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, ceu.a); g.addColorStop(1, ceu.b);
    c.fillStyle = g; c.fillRect(x0, y0, w, h);

    // sol ou lua
    if (ceu.noite) {
      c.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 14; i++) c.fillRect(x0 + ((i * 53 + s.x * 17 + s.y * 7) % w), y0 + ((i * 31) % 40), 1.4, 1.4);
      if ((s.x + s.y) % 3 === 0) {
        c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(x0 + w * .72, y0 + 18, 7, 0, 7); c.fill();
        c.fillStyle = ceu.a; c.beginPath(); c.arc(x0 + w * .72 + 3, y0 + 16, 6, 0, 7); c.fill();
      }
    } else if ((s.x + s.y) % 3 === 0) {
      c.fillStyle = ceu.baixo ? 'rgba(255,190,120,.95)' : 'rgba(255,248,214,.95)';
      c.beginPath(); c.arc(x0 + w * .7, y0 + (ceu.baixo ? 56 : 22), 9, 0, 7); c.fill();
    }

    // prédios: semente fixa por janela, para a cidade não "pular"
    let sem = s.x * 97 + s.y * 131 + 7;
    const rnd = () => { sem = (sem * 16807) % 2147483647; return (sem % 1000) / 1000; };
    for (let camada = 0; camada < 2; camada++) {
      let bx = x0 - 4;
      while (bx < x0 + w) {
        const bw = 10 + rnd() * 18;
        const bh = (camada ? 26 : 40) + rnd() * (camada ? 30 : 34);
        const by = y0 + h - bh;
        c.fillStyle = ceu.noite ? (camada ? '#120d2e' : '#1c1640')
                                : (camada ? '#5a6a96' : '#8494c0');
        c.fillRect(bx, by, bw, bh);
        // janelinhas dos prédios
        for (let wy = by + 4; wy < y0 + h - 3; wy += 6)
          for (let wx = bx + 2; wx < bx + bw - 2; wx += 4) {
            const acesa = rnd() < (ceu.noite ? .35 : .12);
            if (!acesa) continue;
            c.fillStyle = ceu.noite ? 'rgba(255,205,120,.85)' : 'rgba(230,240,255,.45)';
            c.fillRect(wx, wy, 1.8, 2.4);
          }
        // antena
        if (rnd() > .78) { c.fillStyle = c.fillStyle; c.fillRect(bx + bw / 2, by - 8, 1.2, 8); }
        bx += bw + (camada ? 1 : 3);
      }
    }
    // reflexo no vidro + montantes
    c.fillStyle = 'rgba(255,255,255,.07)';
    c.beginPath(); c.moveTo(x0 + w * .15, y0); c.lineTo(x0 + w * .38, y0);
    c.lineTo(x0 + w * .18, y0 + h); c.lineTo(x0 - 0, y0 + h); c.closePath(); c.fill();
    c.fillStyle = '#151129';
    for (let mx = x0 + ISO.TW; mx < x0 + w - 8; mx += ISO.TW) c.fillRect(mx - 2, y0, 4, h);
    c.fillRect(x0, y0 + h * .62, w, 3);
    // peitoril
    c.fillStyle = '#4a4072'; c.fillRect(x0 - 6, y0 + h + 2, w + 12, 4);
  }

  /* ---- parede de logo da recepção ---- */
  function signLogo(c, len, t, rgbOn) {
    // ripado de madeira escura atrás do logo
    c.fillStyle = '#1a1433'; c.fillRect(4, 6, len - 8, 98);
    for (let x = 8; x < len - 8; x += 9) {
      c.fillStyle = (x / 9) % 2 ? '#241c46' : '#20193f';
      c.fillRect(x, 6, 6, 98);
    }
    // halo
    if (rgbOn) {
      const pulso = .5 + .2 * Math.sin(t * 1.4);
      const gr = c.createRadialGradient(len / 2, 52, 10, len / 2, 52, len * .45);
      gr.addColorStop(0, `rgba(138,92,255,${pulso})`); gr.addColorStop(1, 'rgba(138,92,255,0)');
      c.fillStyle = gr; c.fillRect(4, 6, len - 8, 98);
    }
    const alt = 52;
    // mede para centralizar
    c.save();
    c.font = `800 ${alt * .56}px 'Sora', 'Barlow', sans-serif`;
    const larg = alt * 1.15 + c.measureText('hera').width + alt * .2;
    c.restore();
    heraLogo(c, (len - larg) / 2, 22, alt);
    c.save();
    c.textAlign = 'center';
    c.font = "600 9px 'Sora', 'Barlow Semi Condensed', sans-serif";
    c.letterSpacing = '3px';
    c.fillStyle = 'rgba(245,242,255,.6)';
    c.fillText('CEM OLHOS NO SEU CRESCIMENTO', len / 2, 94);
    c.restore();
  }

  /* ---- porta de elevador com indicador de andar ---- */
  function signElevador(c, len, s, t) {
    const x0 = 12, y0 = 22, w = len - 24, h = 86;
    // moldura de inox
    const gm = c.createLinearGradient(x0 - 6, 0, x0 + w + 6, 0);
    gm.addColorStop(0, '#6b6f86'); gm.addColorStop(.5, '#b7bbd0'); gm.addColorStop(1, '#5d6078');
    c.fillStyle = gm; c.fillRect(x0 - 6, y0 - 6, w + 12, h + 6);
    // portas
    const gp = c.createLinearGradient(x0, 0, x0 + w, 0);
    gp.addColorStop(0, '#8a8ea6'); gp.addColorStop(.48, '#d4d7e6'); gp.addColorStop(.52, '#9a9eb5'); gp.addColorStop(1, '#7c8098');
    c.fillStyle = gp; c.fillRect(x0, y0, w, h);
    c.fillStyle = 'rgba(20,16,40,.55)'; c.fillRect(x0 + w / 2 - .8, y0, 1.6, h);
    // reflexo
    c.fillStyle = 'rgba(255,255,255,.16)';
    c.fillRect(x0 + 6, y0 + 4, 3, h - 8); c.fillRect(x0 + w / 2 + 6, y0 + 4, 3, h - 8);
    // indicador de andar
    c.fillStyle = '#0b0820'; ISO.rrect(c, len / 2 - 20, 3, 40, 14, 3); c.fill();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = "700 10px 'Sora', 'Barlow', sans-serif";
    c.fillStyle = C.ouro;
    const sobe = Math.sin(t * .7 + s.num * 2) > 0;
    c.fillText((sobe ? '▲ ' : '▼ ') + '12', len / 2, 10.5);
    // botoeira
    c.fillStyle = '#2a2448'; ISO.rrect(c, len - 10, 52, 7, 18, 2); c.fill();
    c.fillStyle = sobe ? C.volt1 : '#55507a'; c.beginPath(); c.arc(len - 6.5, 57, 1.8, 0, 7); c.fill();
    c.fillStyle = !sobe ? C.volt1 : '#55507a'; c.beginPath(); c.arc(len - 6.5, 65, 1.8, 0, 7); c.fill();
  }

  /* Cada placa é pintada uma vez num canvas próprio e depois só é COPIADA
     para cada tile de parede. Antes ela era redesenhada inteira por tile —
     50 desenhos completos por quadro, vários com shadowBlur, e era daí que
     vinha quase toda a lentidão.                                          */
  const cachePlaca = new Map();
  function placaCanvas(s, t, rgbOn) {
    let c = cachePlaca.get(s);
    if (!c) {
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(s.len * ISO.TW); cv.height = WALL_H;
      c = { cv, ctx: cv.getContext('2d'), t: -1e9, rgb: null };
      cachePlaca.set(s, c);
    }
    // repinta no máximo ~6x por segundo; o olho não vê diferença.
    // a janela só muda com a hora do dia: basta repintar a cada 30 s
    const intervalo = s.kind === 'janela' ? 30 : 0.16;
    if (t - c.t > intervalo || c.t > t || c.rgb !== rgbOn) {
      c.t = t; c.rgb = rgbOn;
      c.ctx.clearRect(0, 0, c.cv.width, c.cv.height);
      pintaPlaca(c.ctx, s, c.cv.width, t, rgbOn);
    }
    return c.cv;
  }

  /* ---- logos e painéis nas paredes altas ---- */
  function drawSigns(ctx, t, rgbOn, lista) {
    for (const s of (lista || SIGNS)) {
      const cv = placaCanvas(s, t, rgbOn);
      wallFace(ctx, s.o, s.x, s.y, s.len, WALL_H, (c) => c.drawImage(cv, 0, 0));
    }
  }

  /* ---- painel da equipe: quem está trabalhando agora ---- */
  function signEquipe(c, len, t, rgbOn) {
    const x0 = 8, y0 = 12, w = len - 16, h = 84;
    c.fillStyle = 'rgba(5,7,13,.88)';
    ISO.rrect(c, x0, y0, w, h, 8); c.fill();
    c.strokeStyle = 'rgba(56,189,248,.35)'; c.lineWidth = 1.4; c.stroke();

    c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = "700 11px 'Barlow Semi Condensed', sans-serif";
    c.fillStyle = '#38bdf8'; c.letterSpacing = '2px';
    c.fillText('EQUIPE AGORA', x0 + 12, y0 + 12);
    c.letterSpacing = '0px';
    c.strokeStyle = 'rgba(255,255,255,.09)';
    c.beginPath(); c.moveTo(x0 + 10, y0 + 22); c.lineTo(x0 + w - 10, y0 + 22); c.stroke();

    const RO = (typeof ROSTER !== 'undefined') ? ROSTER : null;
    const SI = (typeof SISTEMAS !== 'undefined') ? SISTEMAS : null;
    const n = st => RO ? RO.count(st) : 0;
    const noAr = SI ? SI.todos().filter(s => s.estado === 'no ar' || s.estado === 'web').length : 0;
    const cels = [
      { r: 'TRABALHANDO', v: String(n('trabalhando') + n('reuniao')), cor: '#23e08a' },
      { r: 'DESCANSO',    v: String(n('descanso')),                   cor: '#c4b8ff' },
      { r: 'OFFLINE',     v: String(n('offline')),                    cor: '#8b93ad' },
      { r: 'SISTEMAS',    v: String(noAr),                            cor: '#38bdf8' }
    ];
    const cw = (w - 20) / cels.length;
    cels.forEach((cel, i) => {
      const cx = x0 + 10 + i * cw;
      if (i) {
        c.strokeStyle = 'rgba(255,255,255,.07)';
        c.beginPath(); c.moveTo(cx - 2, y0 + 28); c.lineTo(cx - 2, y0 + h - 8); c.stroke();
      }
      c.textAlign = 'left';
      c.font = "600 8.5px 'Barlow Semi Condensed', sans-serif";
      c.fillStyle = 'rgba(180,190,215,.75)';
      c.fillText(cel.r, cx + 8, y0 + 36);
      c.font = "700 20px 'Barlow', sans-serif";
      c.fillStyle = cel.cor;
      if (rgbOn) { c.shadowColor = ISO.rgba(cel.cor, .8); c.shadowBlur = 12; }
      c.fillText(cel.v, cx + 8, y0 + 56);
      c.shadowBlur = 0;
      const amp = rgbOn ? (.45 + .55 * Math.abs(Math.sin(t * 1.1 + i))) : .7;
      c.fillStyle = ISO.rgba(cel.cor, .5);
      c.fillRect(cx + 8, y0 + 66, (cw - 24) * amp, 2.5);
    });
  }

  /* ---- agenda de eventos da diretoria ---- */
  function signEventos(c, len, rgbOn) {
    const evs = (typeof QUADRO !== 'undefined') ? QUADRO.eventos() : [];
    const x0 = 8, y0 = 12, w = len - 16, h = 84;

    c.fillStyle = 'rgba(5,7,13,.9)';
    ISO.rrect(c, x0, y0, w, h, 8); c.fill();
    c.strokeStyle = 'rgba(56,189,248,.32)'; c.lineWidth = 1.4; c.stroke();

    c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = "700 11px 'Barlow Semi Condensed', sans-serif";
    c.fillStyle = '#38bdf8'; c.letterSpacing = '2px';
    if (rgbOn) { c.shadowColor = 'rgba(56,189,248,.7)'; c.shadowBlur = 10; }
    c.fillText('PRÓXIMOS EVENTOS', x0 + 12, y0 + 13);
    c.shadowBlur = 0; c.letterSpacing = '0px';
    c.strokeStyle = 'rgba(255,255,255,.09)';
    c.beginPath(); c.moveTo(x0 + 10, y0 + 23); c.lineTo(x0 + w - 10, y0 + 23); c.stroke();

    if (!evs.length) {
      c.font = "600 10px 'Barlow Semi Condensed', sans-serif";
      c.fillStyle = 'rgba(150,160,190,.6)';
      c.fillText('nenhum evento marcado', x0 + 14, y0 + 42);
      return;
    }
    evs.slice(0, 4).forEach((e, i) => {
      const ry = y0 + 36 + i * 15;
      c.font = "700 10px 'Barlow', sans-serif";
      c.fillStyle = '#c4b8ff';
      c.fillText(e.data, x0 + 14, ry);
      c.font = "600 10px 'Barlow Semi Condensed', sans-serif";
      c.fillStyle = '#e4e9f6';
      c.fillText(e.nome, x0 + 58, ry);
      c.textAlign = 'right';
      c.font = "600 8.5px 'Barlow Semi Condensed', sans-serif";
      c.fillStyle = 'rgba(56,189,248,.8)';
      c.fillText(e.tipo, x0 + w - 14, ry);
      c.textAlign = 'left';
    });
  }

  /* ---- quadro branco de ideias ---- */
  function signQuadro(c, len) {
    const ideias = (typeof QUADRO !== 'undefined') ? QUADRO.ideias() : [];
    const x0 = 10, y0 = 10, w = len - 20, h = 88;

    // moldura de alumínio
    c.fillStyle = '#5b6377';
    ISO.rrect(c, x0 - 3, y0 - 3, w + 6, h + 6, 5); c.fill();
    // superfície branca
    const g = c.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, '#f6f8fb'); g.addColorStop(1, '#dde3ec');
    c.fillStyle = g;
    ISO.rrect(c, x0, y0, w, h, 3); c.fill();
    // reflexo
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath();
    c.moveTo(x0 + w * .55, y0); c.lineTo(x0 + w, y0);
    c.lineTo(x0 + w, y0 + h * .5); c.closePath(); c.fill();

    c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = "700 11px 'Barlow Semi Condensed', sans-serif";
    c.fillStyle = '#d8342a'; c.letterSpacing = '1.5px';
    c.fillText('IDEIAS', x0 + 12, y0 + 14);
    c.letterSpacing = '0px';
    c.font = "600 8px 'Barlow Semi Condensed', sans-serif";
    c.fillStyle = 'rgba(70,80,100,.7)';
    c.fillText('botão 📌 Quadro', x0 + 58, y0 + 14);
    c.strokeStyle = 'rgba(216,52,42,.5)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(x0 + 12, y0 + 22); c.lineTo(x0 + w - 14, y0 + 22); c.stroke();

    const cores = ['#1f5fd0', '#1f8a4c', '#d8342a', '#7b3fc4', '#0f7f92', '#b8620a'];
    ideias.slice(0, 5).forEach((txt, i) => {
      const ry = y0 + 36 + i * 12.5;
      c.fillStyle = cores[i % cores.length];
      c.beginPath(); c.arc(x0 + 17, ry - 1, 2, 0, 7); c.fill();
      c.font = "600 10.5px 'Barlow Semi Condensed', sans-serif";
      c.fillText(txt, x0 + 25, ry);
    });
    if (!ideias.length) {
      c.font = "italic 600 10px 'Barlow Semi Condensed', sans-serif";
      c.fillStyle = 'rgba(70,80,100,.55)';
      c.fillText('quadro vazio', x0 + 25, y0 + 38);
    }
    // canetinhas na bandeja
    ['#d8342a', '#1f5fd0', '#1f8a4c'].forEach((cor, i) => {
      c.fillStyle = cor;
      ISO.rrect(c, x0 + w - 60 + i * 15, y0 + h - 8, 12, 4, 2); c.fill();
    });
  }

  /* ---- placa com o nome do escritório (data/config.json) ---- */
  function signNome(c, len, y0, h, rgbOn) {
    const E = window.ESCRITORIO || {};
    const nome = String(E.nome || 'Escritório de Agentes').toUpperCase();
    const cx = len / 2, cy = y0 + h / 2;
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    let tam = 26;
    c.font = `700 ${tam}px 'Barlow', sans-serif`;
    while (tam > 10 && c.measureText(nome).width > len - 36) { tam--; c.font = `700 ${tam}px 'Barlow', sans-serif`; }
    c.fillStyle = '#ffffff';
    if (rgbOn) { c.shadowColor = 'rgba(124,108,255,.8)'; c.shadowBlur = 14; }
    c.fillText(nome, cx, cy - 6);
    c.shadowBlur = 0;
    if (E.subtitulo) {
      c.font = `500 ${Math.min(10, len / 22)}px 'Barlow Semi Condensed', sans-serif`;
      c.fillStyle = 'rgba(200,210,235,.6)'; c.letterSpacing = '2px';
      c.fillText(String(E.subtitulo).toUpperCase().slice(0, 48), cx, cy + 16);
    }
    c.restore();
  }


  /* ---- luminárias e detalhes de teto no chão (decalques) ---- */
  /** pinta no plano do chão, com o pincel em coordenadas de tile */
  function noChao(ctx, fn) {
    ctx.save();
    ctx.transform(ISO.HW, ISO.HH, -ISO.HW, ISO.HH, 0, 0);
    fn(ctx);
    ctx.restore();
  }

  function drawDecals(ctx, t) {
    // mosaico do olho de pavão no piso da recepção
    noChao(ctx, c => {
      const cx = 56.6, cy = 12.6;
      c.lineWidth = .07;
      [[3.2, 'rgba(138,92,255,.55)'], [2.5, 'rgba(18,214,197,.5)'], [1.8, 'rgba(255,181,71,.55)']]
        .forEach(([r, cor]) => { c.strokeStyle = cor; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); });
      c.fillStyle = 'rgba(15,10,36,.35)';
      c.beginPath(); c.arc(cx, cy, 1.2, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,181,71,.7)';
      c.beginPath(); c.arc(cx, cy, .55, 0, 7); c.fill();
      c.fillStyle = 'rgba(18,214,197,.8)';
      c.beginPath(); c.arc(cx, cy, .3, 0, 7); c.fill();
      // raios da plumagem
      c.strokeStyle = 'rgba(138,92,255,.28)'; c.lineWidth = .05;
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2 + t * .02;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * 1.9, cy + Math.sin(a) * 1.9);
        c.lineTo(cx + Math.cos(a) * 3.1, cy + Math.sin(a) * 3.1);
        c.stroke();
      }
      // capacho na porta da recepção
      c.fillStyle = 'rgba(15,10,36,.55)';
      c.fillRect(55, 16.2, 3, 1.5);
      c.strokeStyle = 'rgba(255,181,71,.35)'; c.lineWidth = .05;
      c.strokeRect(55.1, 16.3, 2.8, 1.3);
    });
  }

  /* ---------- pontos de interesse ---------- */
  const SPAWN = { x: 52, y: 1 };           // porta do elevador 1, na recepção

  return {
    W, H, VOID, FLOOR, WALL, DOOR, C,
    ROOMS, DOORS, SPAWN, WALL_H, PARAPET,
    SIGNS, signDepth,
    kindAt, roomAt, isWall, walkable, setBlocked, wallOccludes,
    drawFloor, drawWallTile, drawDoorTile, drawSigns, drawDecals, drawRoomLabels,
    wallFace, heraSymbol, heraLogo
  };
})();
