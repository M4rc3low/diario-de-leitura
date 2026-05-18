# Diário de Leitura

Projeto front-end para registrar livros lidos, livros desejados, empréstimos, personagens, frases favoritas e anotações pessoais.

## Objetivo

Criar um diário digital de leitura com aparência visual de caderno/estante, permitindo que o usuário registre suas leituras, avalie livros, veja capas em uma estante e organize informações importantes de cada obra.

## Funcionalidades planejadas

- Cadastro de livros lidos.
- Busca de livro e capa por API pública.
- Registro do nome do livro, gênero, número de páginas, início e término da leitura.
- Avaliação do livro com estrelas.
- Espaço livre para anotações, colagens, imagens e lembranças do livro.
- Estante visual com capas dos livros lidos.
- Lista de livros que desejo ler.
- Controle de livros emprestados ou pegos emprestados.
- Anotações sobre personagens.
- Top 5 frases favoritas.
- Sugestões automáticas para enriquecer o diário.

## API usada

A primeira versão usa a API pública do Open Library para buscar informações básicas do livro e capa.

## Estrutura inicial

```text
diario-de-leitura/
├── index.html
├── README.md
├── css/
│   └── styles.css
└── js/
    └── app.js
```

## Observação

Esta versão é uma base inicial em HTML, CSS e JavaScript puro. Os dados ficam salvos no `localStorage` do navegador. Depois, o projeto pode evoluir para React, Firebase, Supabase ou uma API própria.