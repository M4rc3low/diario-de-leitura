# Diário de Leitura

[![CI](https://github.com/M4rc3low/diario-de-leitura/actions/workflows/ci.yml/badge.svg)](https://github.com/M4rc3low/diario-de-leitura/actions/workflows/ci.yml)
![Frontend](https://img.shields.io/badge/frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-blue)
![Node.js](https://img.shields.io/badge/backend-Node.js-green)
![Mobile](https://img.shields.io/badge/mobile-Capacitor-informational)
![License](https://img.shields.io/badge/license-MIT-green)

Aplicação para registrar livros lidos, livros desejados, empréstimos, personagens, frases favoritas, bingo literário, trilha literária e anotações pessoais.

O projeto combina uma experiência visual de diário/estante com funcionalidades práticas de organização, busca de capas e registro de progresso literário.

## Visão de produto

Leitores costumam guardar informações sobre livros em cadernos, notas, prints, planilhas ou aplicativos diferentes. Isso dificulta acompanhar leituras, lembrar frases marcantes, registrar personagens e visualizar a própria evolução.

O Diário de Leitura centraliza essa experiência em uma interface visual e pessoal, com foco em memória afetiva, organização e acompanhamento de hábitos de leitura.

## Funcionalidades principais

- Cadastro de livros lidos
- Lista de livros desejados
- Registro de empréstimos
- Busca de capas e dados por APIs externas
- Avaliação geral com estrelas
- Avaliação emocional da leitura
- Anotações livres sobre cada livro
- Registro de personagens
- Top 5 frases favoritas
- Bingo literário editável
- Trilha literária com marcos de progresso
- Persistência local no navegador

## APIs utilizadas

A aplicação pode consultar diferentes fontes para localizar capas e dados dos livros:

1. Open Library
2. Google Books
3. ISBNdb

A ISBNdb exige chave de API. Por segurança, essa chave não fica exposta no JavaScript do navegador: o projeto utiliza um servidor Node.js como proxy para esse tipo de consulta.

## Stack técnica

| Camada | Tecnologia |
| --- | --- |
| Interface | HTML, CSS e JavaScript |
| Backend local | Node.js + Express |
| Variáveis de ambiente | dotenv |
| Integrações externas | Open Library, Google Books, ISBNdb |
| Mobile | Capacitor |
| Persistência atual | localStorage |
| CI | GitHub Actions |

## Como executar localmente

```bash
npm install
```

Crie seu `.env` a partir do arquivo de exemplo.

Linux/macOS:

```bash
cp .env.example .env
```

Windows:

```powershell
copy .env.example .env
```

Configure sua chave da ISBNdb:

```env
ISBNDB_API_KEY=sua_chave_aqui
PORT=3000
```

Rode o servidor:

```bash
npm start
```

Abra `http://localhost:3000`.

## Como rodar sem ISBNdb

Também é possível abrir o `index.html` com um servidor estático. Nesse caso, a busca continua funcionando com Open Library e Google Books, mas a ISBNdb depende do servidor Node.js para manter a chave fora do frontend.

## Estrutura

```text
diario-de-leitura/
├── index.html
├── package.json
├── server.js
├── .env.example
├── css/
├── js/
│   ├── app.js
│   └── isbndb-enhancer.js
├── scripts/
└── .github/workflows/ci.yml
```

## Qualidade e CI

A pipeline instala as dependências e valida a sintaxe dos principais arquivos JavaScript com `node --check` em pushes e pull requests para `main`.

- Chaves de API não devem ser versionadas.
- O arquivo `.env` deve ficar fora do Git.
- Dados pessoais de leitura devem permanecer locais ou protegidos por backend seguro em uma versão futura.
- Antes de publicar, revise dependências, variáveis de ambiente e integrações externas.

## Roadmap

- [ ] Melhorar responsividade mobile
- [ ] Adicionar screenshots reais
- [ ] Criar versão demonstrativa pública
- [ ] Evoluir backup e restauração de dados
- [ ] Criar persistência em banco de dados
- [ ] Melhorar empacotamento mobile com Capacitor
- [ ] Evoluir validações para testes automatizados de comportamento

## Autor

Desenvolvido por Marcelo Gomes.
