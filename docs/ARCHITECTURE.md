# Architecture

## Overview

Diario de Leitura is a front-end first reading journal application with a small Node.js proxy for protected ISBNdb API requests.

The application stores reading records locally in the browser and can fetch book metadata and cover information from external book APIs.

## High-level structure

```txt
diario-de-leitura/
├── index.html             # Main application page
├── css/                   # Visual styles
├── js/                    # Frontend application logic
├── server.js              # Local Node.js proxy/server
├── scripts/               # Mobile preparation scripts
├── package.json           # Node and Capacitor scripts
└── docs/                  # Technical documentation
```

## Data flow

```txt
User interface
      ↓
JavaScript application logic
      ↓
localStorage
      ↓
Book API lookup
      ↓
Open Library / Google Books / ISBNdb proxy
```

## API strategy

- Open Library and Google Books can be accessed directly from the client.
- ISBNdb requires an API key and should go through the Node.js proxy.
- API keys must remain in `.env` and must never be committed.

## Mobile strategy

The project includes Capacitor scripts to prepare future Android and iOS builds.

## Recommended evolution

- Improve modular JavaScript organization
- Add automated tests
- Add persistent backend storage
- Add backup and restore workflows
- Improve mobile packaging
- Add screenshots and demo deployment
