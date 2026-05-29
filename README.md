# Diario de Leitura

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Frontend](https://img.shields.io/badge/frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-blue)
![Node.js](https://img.shields.io/badge/backend-Node.js-green)
![Mobile](https://img.shields.io/badge/mobile-Capacitor-informational)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

Diario de Leitura e uma aplicacao para registrar livros lidos, livros desejados, emprestimos, personagens, frases favoritas, bingo literario, trilha literaria e anotacoes pessoais.

O projeto combina uma experiencia visual de diario/estante com funcionalidades praticas de organizacao, busca de capas e registro de progresso literario.

## Visao de produto

Leitores costumam guardar informacoes sobre livros em cadernos, notas soltas, prints, planilhas ou aplicativos diferentes. Isso dificulta acompanhar leituras, lembrar frases marcantes, registrar personagens e visualizar a propria evolucao.

O Diario de Leitura centraliza essa experiencia em uma interface simples, visual e pessoal, com foco em memoria afetiva, organizacao e acompanhamento de habitos de leitura.

## Funcionalidades principais

- Cadastro de livros lidos
- Lista de livros desejados
- Registro de emprestimos
- Busca de capas e dados por APIs externas
- Avaliacao geral com estrelas
- Avaliacao emocional da leitura
- Anotacoes livres sobre cada livro
- Registro de personagens
- Top 5 frases favoritas
- Bingo literario editavel
- Trilha literaria com marcos de progresso
- Persistencia local no navegador

## APIs utilizadas

A aplicacao pode consultar diferentes fontes para localizar capas e dados dos livros:

1. Open Library
2. Google Books
3. ISBNdb

A ISBNdb exige chave de API. Por seguranca, essa chave nao deve ficar exposta no JavaScript do navegador. O projeto usa um servidor local em Node.js como proxy para esse tipo de consulta.

## Stack tecnica

| Camada | Tecnologia |
| --- | --- |
| Interface | HTML, CSS e JavaScript |
| Backend local | Node.js + Express |
| Variaveis de ambiente | dotenv |
| Integracoes externas | Open Library, Google Books, ISBNdb |
| Mobile | Capacitor |
| Persistencia atual | localStorage |

## Como executar localmente

Instale as dependencias:

```bash
npm install
```

Copie o arquivo de exemplo:

```bash
copy .env.example .env
```

Configure sua chave da ISBNdb no arquivo `.env`:

```env
ISBNDB_API_KEY=sua_chave_aqui
PORT=3000
```

Rode o servidor:

```bash
npm start
```

Abra no navegador:

```text
http://localhost:3000
```

## Como rodar sem ISBNdb

Tambem e possivel abrir o `index.html` com Live Server. Nesse caso, a busca continua funcionando com Open Library e Google Books, mas a ISBNdb so funciona quando o servidor Node esta rodando.

## Estrutura

```txt
diario-de-leitura/
├── index.html
├── README.md
├── package.json
├── server.js
├── .env.example
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── isbndb-enhancer.js
└── scripts/
```

## Qualidade e seguranca

- Chaves de API nao devem ser versionadas.
- O arquivo `.env` deve ficar fora do Git.
- Dados pessoais de leitura devem permanecer locais ou protegidos por backend seguro em uma versao futura.
- Antes de publicar, revisar dependencias e variaveis de ambiente.

## Roadmap

- [ ] Melhorar responsividade mobile
- [ ] Adicionar screenshots reais
- [ ] Criar versao demonstrativa publica
- [ ] Evoluir backup e restauracao de dados
- [ ] Criar persistencia em banco de dados
- [ ] Melhorar empacotamento mobile com Capacitor

## Autor

Desenvolvido por Marcelo Gomes.
