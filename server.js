require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function normalizeIsbndbBook(book = {}) {
  const isbn = book.isbn13 || book.isbn || book.isbn10 || '';

  return {
    source: 'ISBNdb',
    title: book.title || book.title_long || '',
    authors: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || '',
    pageCount: book.pages || '',
    genre: Array.isArray(book.subjects) ? book.subjects.slice(0, 2).join(', ') : '',
    coverUrl: book.image || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` : ''),
    isbn
  };
}

app.get('/api/isbndb/search', async (req, res) => {
  const query = String(req.query.q || '').trim();

  if (!query) {
    return res.status(400).json({ error: 'Informe o nome do livro para pesquisar.' });
  }

  if (!ISBNDB_API_KEY) {
    return res.status(200).json({
      warning: 'ISBNDB_API_KEY não configurada. A busca continuará usando as outras APIs.',
      books: []
    });
  }

  try {
    const response = await fetch(`https://api2.isbndb.com/books/${encodeURIComponent(query)}?page=1&pageSize=10`, {
      headers: {
        Authorization: ISBNDB_API_KEY
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Erro ao consultar ISBNdb.',
        status: response.status
      });
    }

    const data = await response.json();
    const books = Array.isArray(data.books) ? data.books.map(normalizeIsbndbBook) : [];

    return res.json({ books });
  } catch (error) {
    return res.status(500).json({ error: 'Falha interna ao consultar ISBNdb.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, isbndbConfigured: Boolean(ISBNDB_API_KEY) });
});

app.listen(PORT, () => {
  console.log(`Diário de Leitura rodando em http://localhost:${PORT}`);
});
