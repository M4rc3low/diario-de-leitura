# Diário de Leitura

Projeto front-end para registrar livros lidos, livros desejados, empréstimos, personagens, frases favoritas, bingo literário, trilha literária e anotações pessoais.

## Objetivo

Criar um diário digital de leitura com aparência visual de caderno/estante, permitindo que o usuário registre suas leituras, avalie livros, veja capas em uma estante e organize informações importantes de cada obra.

## Funcionalidades

- Cadastro de livros lidos.
- Busca de livro e capa por API.
- Busca por Open Library, Google Books e ISBNdb.
- Registro do nome do livro, autor, gênero, formato, número de páginas, início e término da leitura.
- Avaliação geral com estrelas.
- Avaliação emocional: romântico, divertido, triste, medo, nojo e hot.
- Espaço livre para anotações, colagens, imagens e lembranças do livro.
- Estante visual com capas dos livros lidos.
- Estante por gênero com legenda de cores.
- Lista de livros que desejo ler.
- Controle de livros emprestados ou pegos emprestados.
- Anotações sobre personagens.
- Campo para descrição visual de personagem.
- Top 5 frases favoritas.
- Bingo literário editável.
- Trilha literária com marco a cada 10 livros lidos.

## APIs usadas

A aplicação usa três fontes para tentar encontrar capas e dados dos livros:

1. Open Library
2. Google Books
3. ISBNdb

A ISBNdb exige chave de API. Por segurança, a chave não deve ficar no JavaScript do navegador. Por isso o projeto possui um servidor local em Node.js que funciona como proxy.

## Como rodar o projeto com ISBNdb

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de exemplo:

```bash
copy .env.example .env
```

3. Abra o arquivo `.env` e coloque sua chave da ISBNdb:

```env
ISBNDB_API_KEY=sua_chave_aqui
PORT=3000
```

4. Rode o servidor:

```bash
npm start
```

5. Abra no navegador:

```text
http://localhost:3000
```

## Como rodar sem ISBNdb

Também é possível abrir o `index.html` com Live Server. Nesse caso, a busca continua funcionando com Open Library e Google Books, mas a ISBNdb só funciona quando o servidor Node está rodando.

## Estrutura

```text
diario-de-leitura/
├── index.html
├── README.md
├── package.json
├── server.js
├── .env.example
├── css/
│   └── styles.css
└── js/
    ├── app.js
    └── isbndb-enhancer.js
```

## Observação

Os registros do diário ficam salvos no `localStorage` do navegador. Em uma próxima etapa, o projeto pode evoluir para salvar os dados em banco de dados, Firebase, Supabase ou API própria.
