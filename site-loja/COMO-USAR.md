# Site da loja · como usar

Loja escura e tática em escala 1/12, com a mesma estrutura de uma loja de
colecionáveis: barra de avisos, menu com coleções, banners rotativos, carrossel
de coleções, prateleiras de produtos, faixa "sobre", kits, assinatura,
perguntas frequentes e rodapé com newsletter. Tem carrinho, busca, janela de
produto com variações (STL ou impresso) e fechamento do pedido pelo WhatsApp.

É um site estático (HTML + CSS + JS, sem instalar nada).

## 1. Subir as fotos (a única coisa obrigatória)

Abra `fotos/LEIA-ME.txt`: lá está a lista com o **nome exato** e o tamanho de
cada foto. Coloque os arquivos na pasta `fotos/` (as de produto em
`fotos/produtos/`). Enquanto uma foto não existe, o site mostra um quadro
tracejado com o nome do arquivo que falta, então dá para ver na tela o que
ainda está pendente.

- Banners: 1920 × 900 px · Coleções: 800 × 1000 px · Produtos: 1000 × 1000 px
- Galeria do produto (opcional): `cabeca-01-2.jpg`, `cabeca-01-3.jpg`, `cabeca-01-4.jpg`
- Logo (opcional): `fotos/logo.png`. Sem ela, aparece o nome da marca em texto.

## 2. Antes de publicar

No topo de `js/config.js`:

1. `contato.whatsapp`: coloque o número (ex.: `5583999998888`). Os botões de
   compra, orçamento e assinatura abrem o WhatsApp com a mensagem pronta.
2. `contato.email` e as redes sociais.
3. `mostrarAvisosDeFoto: false`: os quadros sem foto deixam de mostrar o nome
   do arquivo.

Nome da loja, textos, preços, produtos e perguntas também ficam em
`js/config.js`. Para criar um produto novo, copie uma linha, troque o `id` e
suba a foto `fotos/produtos/<id>.jpg`.

## 3. Ver no computador

Dê dois cliques em `index.html`, ou rode na pasta:

```bash
python3 -m http.server 8080
```

e abra http://localhost:8080.

## 4. Publicar

Envie a pasta `site-loja` inteira para qualquer hospedagem estática
(Hostinger, Netlify, Vercel, GitHub Pages). No Netlify é só arrastar a pasta
para netlify.com/drop.
