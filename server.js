require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ISBNDB_BASE_URL = 'https://api2.isbndb.com';
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';

app.use(cors());
app.use(express.json({ limit: '20mb' }));
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

function translateOpenAIError(message = '') {
  const normalized = String(message).toLowerCase();

  if (normalized.includes('billing hard limit') || normalized.includes('hard limit')) {
    return 'O limite de cobrança/créditos da conta OpenAI foi atingido. A geração por IA está configurada, mas a OpenAI bloqueou novas imagens até você aumentar o limite, adicionar créditos ou trocar a chave por uma conta com saldo disponível.';
  }

  if (normalized.includes('insufficient_quota') || normalized.includes('quota')) {
    return 'A conta OpenAI está sem cota ou sem créditos disponíveis para gerar imagem agora.';
  }

  if (normalized.includes('invalid api key') || normalized.includes('incorrect api key')) {
    return 'A chave da OpenAI é inválida. Gere uma nova chave e coloque no arquivo .env.';
  }

  return message || 'Erro ao gerar imagem com IA.';
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

function buildCharacterPrompt({ name, role, notes, visual, bookTitle, style }) {
  const selectedStyle = style || 'ilustração literária semi-realista, bonita, delicada, com aparência de personagem de livro';

  return `Crie uma imagem de personagem fictício para um diário de leitura.

Regras importantes:
- Não use texto escrito na imagem.
- Não copie personagem famoso, ator, atriz, pessoa real ou estilo de artista vivo.
- Crie uma pessoa/personagem original com base na descrição.
- Imagem vertical, estilo capa de personagem, fundo simples e bonito.
- Resultado apropriado para um diário de leitura.

Livro: ${bookTitle || 'não informado'}
Nome do personagem: ${name || 'personagem sem nome'}
Papel na história: ${role || 'não informado'}
Anotações do leitor: ${notes || 'sem anotações'}
Aparência desejada: ${visual || 'usar interpretação criativa a partir das informações disponíveis'}
Estilo visual: ${selectedStyle}`;
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

app.post('/api/ai/character-image', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(200).json({
      warning: 'OPENAI_API_KEY não configurada. Configure a chave no arquivo .env para gerar imagens reais por IA.',
      image: ''
    });
  }

  const { name, role, notes, visual, bookTitle, style } = req.body || {};

  if (!name && !visual && !notes) {
    return res.status(400).json({ error: 'Informe pelo menos nome, descrição ou anotações do personagem.' });
  }

  try {
    const prompt = buildCharacterPrompt({ name, role, notes, visual, bookTitle, style });

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size: '1024x1536',
        quality: 'low',
        output_format: 'jpeg',
        output_compression: 80
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const rawMessage = data.error?.message || data.message || 'Erro ao gerar imagem com IA.';
      return res.status(response.status).json({
        error: translateOpenAIError(rawMessage),
        rawError: rawMessage
      });
    }

    const base64 = data.data?.[0]?.b64_json;

    if (!base64) {
      return res.status(500).json({ error: 'A IA não retornou imagem.' });
    }

    return res.json({
      image: `data:image/jpeg;base64,${base64}`,
      source: OPENAI_IMAGE_MODEL
    });
  } catch (error) {
    return res.status(500).json({
      error: translateOpenAIError(error.message) || 'Falha interna ao gerar imagem do personagem.'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    isbndbConfigured: Boolean(ISBNDB_API_KEY),
    openaiConfigured: Boolean(OPENAI_API_KEY),
    isbndbBaseUrl: ISBNDB_BASE_URL,
    openaiImageModel: OPENAI_IMAGE_MODEL
  });
});

app.listen(PORT, () => {
  console.log(`Diário de Leitura rodando em http://localhost:${PORT}`);
});
