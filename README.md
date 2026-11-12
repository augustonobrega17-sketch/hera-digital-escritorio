# Hera Digital · Escritório de Agentes

O escritório da **Hera Digital**, agência de marketing do Augusto: um andar
isométrico em pixel, no 12º andar de um prédio comercial, onde a equipe de
agentes de IA trabalha. Cada agente é um boneco com mesa e computador próprios;
clicar no computador dele abre o **sistema daquele agente** ali dentro, com
botões para ligar, desligar, ver o log e conversar com ele pelo Claude Code.

**O andar**

| Sala | O que tem |
| --- | --- |
| **Sala do chefe** | piso de madeira, mesa do Augusto e do sócio, quadro de ideias, agenda, janelas para a cidade |
| **Sala dos funcionários** | 12 estações para estratégia, tráfego, social, copy, design, dados |
| **Recepção** | dois elevadores, parede de logo, balcão com recepcionista, sala de espera e mosaico de pavão no piso |
| **Sala de jogos** | fliperamas, sinuca, pebolim, pingue-pongue, TV com sofá e pufes |
| **Cozinha** | bancada com cafeteira, pia, cooktop e micro-ondas, geladeira, bebedouro, ilha com banquetas, mesa de almoço e bistrô |
| **Sala de reunião** | mesa de oito lugares e painel de LED |

O prédio é "de verdade": janelas com a cidade lá fora (o céu muda com o
relógio: manhã, tarde, pôr do sol e noite), laje com o andar de baixo, porta de
elevador com indicador de andar, extintor no corredor. Quem chega ao trabalho
sai do elevador na recepção e vai andando até a própria mesa.

**Os sistemas da equipe**

Cada funcionário da Hera tem um sistema de marketing próprio, que abre no
monitor dele (clique no computador da mesa). Eles ficam em `sistemas/`, sobem
sozinhos junto com o escritório e compartilham os mesmos dados (clientes,
campanhas, posts…), então um sistema enxerga o que o outro registrou.

| Funcionário | Sistema | Porta | O que faz |
| --- | --- | --- | --- |
| Lia | Estratégia & Planejamento | 4411 | planos por cliente, SWOT, funil reverso, distribuição de verba |
| Léo | Tráfego Pago | 4412 | campanhas com CTR, CPC, CPL, CPA e ROAS, alertas do dia, calculadoras |
| Nico | Social Media | 4413 | produção em kanban, calendário editorial, métricas, banco de ganchos |
| Duda | Copywriter | 4414 | gerador AIDA/PAS/4U, banco de copies A/B, contador de caracteres |
| Íris | Design | 4415 | fila de criativos, paletas dos clientes, guia de formatos, checklist |
| Theo | Vídeo | 4416 | fila de edição, estrutura de vídeo curto cronometrada, checklist |
| Gabi | SEO & Blog | 4417 | palavras-chave priorizadas, pauta, simulador do Google, checklist on-page |
| Cami | Dados & BI | 4418 | painel da agência inteira e insights automáticos (lê todos os outros) |
| Bia | Atendimento | 4419 | carteira de clientes, aprovações, agenda e relatório mensal automático |
| Rafa | Comercial | 4420 | funil de vendas (fechou, vira cliente sozinho) e gerador de proposta |

- Os dados ficam em `sistemas/_dados/` (fora do git). Na primeira vez eles
  nascem com clientes e números **fictícios** de exemplo; cada sistema tem os
  botões "Começar do zero" e "Restaurar exemplo".
- A base comum (servidor, visual da marca e componentes) está em
  `sistemas/_base/`. A tabela de preços da proposta fica no topo de
  `sistemas/comercial/app.js`.
- Os sistemas só aceitam conexões desta máquina.

**O quadro de demandas (agentes trabalhando de verdade)**

O botão **📥 Demandas** no topo abre o quadro. Você escolhe o funcionário e o
cliente e escreve o pedido como explicaria para uma pessoa. A demanda entra na
fila e o agente executa sozinho com o **Claude Code**, usando a cota do seu
plano Claude. Ele lê os dados dos sistemas e grava a entrega no sistema dele
como rascunho. Você aprova ou pede ajuste: o ajuste continua a mesma conversa.

- Um agente trabalha por vez (para não esgotar a cota do plano), no máximo 15
  minutos por rodada. Prioridade alta passa na frente da fila.
- Enquanto trabalha, o boneco mostra o balão 📥 no andar.
- Os agentes leem e gravam arquivos de dados e podem pesquisar na web. Não rodam
  comandos, não leem `.env` e não publicam, enviam nem mexem em campanha.
- A personalidade de cada um está em `sistemas/<area>/CLAUDE.md`, e as regras da
  agência em `sistemas/CLAUDE.md`. O nome que vale é o que está no escritório.
- Precisa do Claude Code instalado e logado nesta máquina (`claude auth login`).
- O histórico fica em `data/demandas.json` (fora do git). `demandas.modelo` em
  `data/config.json` troca o modelo (padrão: sonnet).

**A marca**

O manual de identidade visual fica em **http://localhost:4321/marca/** (botão
**◉ Marca** no topo). Logo, símbolo e versões estão em `marca/`:
`hera-simbolo.svg`, `hera-logo.svg` (fundo escuro) e `hera-logo-claro.svg`.

- Os bonecos trabalham na própria mesa, descansam na sala de jogos, na cozinha
  ou na recepção no horário que você definir e se juntam na sala de reunião
  quando há reunião.
- O escritório sobe os sistemas locais, vigia quem caiu e religa sozinho.
- Nenhuma dependência: só Node.js.

## Começar

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo.

```bash
git clone <url-deste-repositório> escritorio-de-agentes
cd escritorio-de-agentes
npm start
```

Abra **http://localhost:4321**. A Hera já abre com a equipe principal
contratada (estratégia, tráfego, social, copy, design, dados e atendimento).
Vem também um agente de exemplo (pasta
`exemplo-agente`): clique no computador dele e em **Ligar** para ver o fluxo
completo.

No Windows:
- **`INICIAR ESCRITORIO.cmd`** sobe o escritório e o religa se ele cair.
- **`CRIAR ATALHO.ps1`** cria um atalho na área de trabalho. Para rodar: botão
  direito no arquivo e depois **Executar com o PowerShell**. O atalho liga o
  escritório, se estiver desligado, e abre o navegador.

## Colocar os seus agentes

Na aba **Contratar**, clique em **+ Cadastrar agente** e escolha:

| Sistema do agente | O que preencher |
| --- | --- |
| **Roda nesta máquina** | pasta do projeto, comando (`npm`, `node`, `python`…), argumentos (`run dev`) e uma porta livre |
| **Site / URL** | o endereço. Se o site recusar abrir em iframe, marque "usar o espelho" |
| **Nenhum** | só o boneco, sem sistema |

O escritório sobe o sistema local com a variável `PORT` igual à porta
informada. Se o seu projeto escolhe a porta de outro jeito, passe nos
argumentos (ex.: `run dev -- --port 4402`).

Tudo fica em `data/sistemas.json`, que também pode ser editado à mão. Os campos
estão explicados no topo de `data/sistemas.exemplo.json`.

Por segurança, o escritório escuta só em `127.0.0.1`, executa só o que está no
registro e recusa comando com `& | ; < > $` e crase. Ele também ignora pedido
vindo de outro site aberto no navegador.

## Conversar com um agente

No monitor, **💬 Conversar** abre uma sessão do [Claude Code](https://claude.com/claude-code)
dentro da pasta do sistema:

- **Investigar** só lê e explica.
- **Resolver** pode editar o projeto.

Precisa do Claude Code instalado e logado nesta máquina.

## Reunião dos agentes

Na sala de reunião, **▶ Reunir agora** junta os agentes que têm sistema local.
Cada um lê o próprio projeto e diz três coisas:

1. um número real;
2. uma melhoria;
3. o que precisa de outro agente.

No fim, um briefing junta tudo.

Cada fala é uma chamada ao Claude e consome a cota do seu plano. Por isso o
horário automático vem **desligado**. Para ligar, e para dar uma meta à
reunião, use `data/config.json` (veja abaixo).

## Configuração

Copie `data/config.exemplo.json` para `data/config.json` e ajuste:

- `nome`, `subtitulo`: o topo da tela e o letreiro das paredes.
- `dono`: o seu nome no boneco da Diretoria.
- `empresa`: uma frase sobre o negócio, que vira contexto na reunião.
- `porta`: a porta do escritório (padrão 4321).
- `reuniao.automatica`, `dias`, `hora`: a reunião em horário fixo.
- `reuniao.meta`: `descricao`, `alvo`, `feito`, `unidade` e `ate` aparecem no
  placar e orientam a conversa.

Para mudar as cores, edite as variáveis no topo de `css/style.css`.

## Avisos no celular

**🔔 Avisos** manda notificação pelo app gratuito [ntfy](https://ntfy.sh) ou
pelo WhatsApp via CallMeBot. O escritório avisa quando:

- um sistema caiu e não voltou;
- a reunião terminou;
- uma ação da agenda rodou.

Seus sistemas também podem pedir um aviso:

```http
POST http://localhost:4321/api/avisar
{ "titulo": "Meu agente", "texto": "3 pedidos esperando", "prioridade": "normal" }
```

## Agenda

`data/agenda.json` liga ou desliga um sistema numa data marcada. O exemplo está
no comentário da seção AGENDA em `server.js`.

## O que fica fora do git

Configuração, equipe, avisos (com a chave do CallMeBot), atas e estado ficam em
`data/` e são ignorados pelo git. Só os dois arquivos `*.exemplo.json` são
versionados.

## Estrutura

```
server.js          servidor: arquivos da tela, API, sobe/vigia sistemas, espelho
reuniao.js         reunião dos agentes (Claude Code em cada pasta)
avisos.js          ntfy e CallMeBot
index.html         a tela
js/                motor isométrico, salas, móveis, bonecos, painéis
css/style.css      tema (cores da Hera Digital)
marca/             logo, símbolo e manual de identidade visual
sistemas/          os sistemas de marketing de cada funcionário (base em _base/)
exemplo-agente/    o menor sistema que o escritório sabe operar
data/              seus dados (fora do git, menos os exemplos)
```

## Licença

Uso pessoal permitido. **Proibida a venda, revenda ou redistribuição** (inclusive com outra marca). Veja [LICENSE](LICENSE).
