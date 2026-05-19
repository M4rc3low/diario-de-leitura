require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY;
const ISBNDB_BASE_URL = 'https://api2.isbndb.com';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

function looksLikeIsbn(value = '') {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 13;
}

function normalizeIsbndbBook(book = {}) {
  const isbn = book.isbn13 || book.isbn || book.isbn10 || '';
  const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || '';
  const subjects = Array.isArray(book.subjects) ? book.subjects.slice(0, 2).join(', ') : '';

  return {
    source: 'ISBNdb',
    title: book.title || book.title_long || '',
    authors,
    pageCount: book.pages || '',
    genre: subjects,
    coverUrl: book.image || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` : ''),
    isbn
  };
}

async function fetchISBNdb(endpoint) {
  const response = await fetch(`${ISBNDB_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: ISBNDB_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || data.error || 'Erro ao consultar ISBNdb.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function searchISBNdbByQuery(query) {
  const data = await fetchISBNdb(`/books/${encodeURIComponent(query)}?page=1&pageSize=10`);
  return Array.isArray(data.books) ? data.books.map(normalizeIsbndbBook) : [];
}

async function searchISBNdbByIsbn(isbn) {
  const data = await fetchISBNdb(`/book/${encodeURIComponent(isbn)}`);
  return data.book ? [normalizeIsbndbBook(data.book)] : [];
}

app.get('/api/isbndb/search', async (req, res) => {
  const query = String(req.query.q || '').trim();

  if (!query) {
    return res.status(400).json({ error: 'Informe o nome do livro ou ISBN para pesquisar.' });
  }

  if (!ISBNDB_API_KEY) {
    return res.status(200).json({
      warning: 'ISBNDB_API_KEY não configurada. A busca continuará usando as outras APIs.',
      books: []
    });
  }

  try {
    const books = looksLikeIsbn(query)
      ? await searchISBNdbByIsbn(onlyDigits(query))
      : await searchISBNdbByQuery(query);

    return res.json({ books });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || 'Falha interna ao consultar ISBNdb.'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    isbndbConfigured: Boolean(ISBNDB_API_KEY),
    isbndbBaseUrl: ISBNDB_BASE_URL
  });
});

app.listen(PORT, () => {
  console.log(`Diário de Leitura rodando em http://localhost:${PORT}`);
});
