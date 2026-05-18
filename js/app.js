const storageKeys = {
  books: 'diarioLeitura.books',
  wishlist: 'diarioLeitura.wishlist',
  loans: 'diarioLeitura.loans',
  bingo: 'diarioLeitura.bingo'
};

const fallbackCover = 'https://placehold.co/400x600/e4d4c5/2f241d?text=Sem+Capa';

const genreColors = {
  romance: '#d64b75',
  comedia: '#f2a44c',
  'ficcao cientifica': '#3ba5a3',
  aventura: '#7f9a45',
  drama: '#4b8a4b',
  historico: '#9a7a45',
  fabula: '#345f8c',
  biografia: '#5d8aa8',
  fantasia: '#7b3f98',
  terror: '#252525',
  policial: '#c43c35',
  distopia: '#9b59b6',
  gotico: '#8e6f62',
  suspense: '#5f4b8b',
  poesia: '#b86aa1',
  juvenil: '#6bbf45',
  espionagem: '#e65b5b'
};

const defaultBingo = [
  'Ler um livro com capa bonita',
  'Ler um livro indicado por alguém',
  'Ler um livro que virou filme ou série',
  'Ler um livro de fantasia',
  'Ler um livro nacional',
  'Ler um livro com mais de 300 páginas',
  'Ler um romance',
  'Ler um livro fora da zona de conforto',
  'Ler um livro com protagonista forte',
  'Ler um livro que estava parado na estante',
  'Ler um e-book',
  'Ler um livro curto',
  'Espaço livre',
  'Ler um livro emocionante',
  'Ler um suspense',
  'Ler um livro emprestado',
  'Ler um clássico',
  'Ler um livro de autora mulher',
  'Ler um livro que comece com a letra do seu nome',
  'Ler um livro com final surpreendente',
  'Ler um livro triste',
  'Ler um livro divertido',
  'Ler uma biografia',
  'Ler um livro recomendado na internet',
  'Ler um favorito do ano'
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function getStorage(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createStars(rating) {
  const total = Number(rating) || 0;
  return '★'.repeat(total) + '☆'.repeat(5 - total);
}

function formatDate(date) {
  if (!date) return 'sem data';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getGenreColor(genre) {
  const normalized = normalizeText(genre);
  const key = Object.keys(genreColors).find((item) => normalized.includes(item));
  return key ? genreColors[key] : '#c9b29c';
}

function getReadingReasons(book) {
  const reasons = [];
  if (book.reasonRecommendation) reasons.push(`Recomendação${book.recommendedBy ? ` de ${book.recommendedBy}` : ''}`);
  if (book.reasonTheme) reasons.push('Gostei do tema');
  if (book.reasonMovie) reasons.push('Assisti ao filme/série e fiquei curiosa');
  if (book.reasonOther) reasons.push(book.reasonOther);
  return reasons.length ? reasons.join(' • ') : 'Motivo não informado';
}

function switchTab(tabId) {
  $$('.tab-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabId);
  });

  $$('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

function buildSearchTerms(title, author) {
  const cleanTitle = title.replace(/[“”"'`´]/g, '').replace(/\s+/g, ' ').trim();
  const cleanAuthor = author.replace(/[“”"'`´]/g, '').replace(/\s+/g, ' ').trim();
  const terms = [];

  if (cleanTitle && cleanAuthor) terms.push(`${cleanTitle} ${cleanAuthor}`);
  if (cleanTitle && cleanAuthor) terms.push(`intitle:${cleanTitle} inauthor:${cleanAuthor}`);
  if (cleanTitle) terms.push(cleanTitle);

  return [...new Set(terms)];
}

function getBestGoogleImage(imageLinks) {
  if (!imageLinks) return '';
  const url = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.small || imageLinks.thumbnail || imageLinks.smallThumbnail || '';
  return url ? url.replace('http://', 'https://').replace('zoom=1', 'zoom=3') : '';
}

function calculateMatchScore(candidate, title, author) {
  const targetTitle = normalizeText(title);
  const targetAuthor = normalizeText(author);
  const candidateTitle = normalizeText(candidate.title);
  const candidateAuthors = normalizeText(candidate.authors);
  let score = 0;

  if (candidate.coverUrl) score += 40;
  if (candidateTitle === targetTitle) score += 35;
  if (candidateTitle.includes(targetTitle) || targetTitle.includes(candidateTitle)) score += 18;
  if (targetAuthor && candidateAuthors.includes(targetAuthor)) score += 20;
  if (candidate.pageCount) score += 4;
  if (candidate.genre) score += 3;
  if (candidate.source === 'Google Books') score += 6;
  if (candidate.source === 'Open Library') score += 4;

  return score;
}

async function searchOpenLibrary(title, author) {
  const params = new URLSearchParams();
  params.set('title', title);
  if (author) params.set('author', author);
  params.set('limit', '10');

  const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
  const data = await response.json();

  return (data.docs || []).map((book) => {
    const isbn = book.isbn?.[0];
    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : isbn
        ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
        : '';

    return {
      source: 'Open Library',
      title: book.title || title,
      authors: book.author_name?.join(', ') || '',
      pageCount: book.number_of_pages_median || '',
      genre: book.subject?.slice(0, 2).join(', ') || '',
      coverUrl
    };
  });
}

async function searchGoogleBooks(title, author) {
  const terms = buildSearchTerms(title, author);
  const results = [];

  for (const term of terms) {
    const params = new URLSearchParams();
    params.set('q', term);
    params.set('maxResults', '10');
    params.set('printType', 'books');
    params.set('projection', 'lite');

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
    const data = await response.json();

    (data.items || []).forEach((item) => {
      const info = item.volumeInfo || {};
      const coverUrl = getBestGoogleImage(info.imageLinks);
      results.push({
        source: 'Google Books',
        title: info.title || title,
        authors: info.authors?.join(', ') || '',
        pageCount: info.pageCount || '',
        genre: info.categories?.slice(0, 2).join(', ') || '',
        coverUrl
      });
    });
  }

  return results;
}

function fillBookFieldsFromCandidate(candidate) {
  if (candidate.title && !$('#title').value.trim()) $('#title').value = candidate.title;
  if (candidate.authors && !$('#author').value.trim()) $('#author').value = candidate.authors.split(',')[0];
  if (candidate.pageCount && !$('#pages').value) $('#pages').value = candidate.pageCount;
  if (candidate.genre && !$('#genre').value.trim()) $('#genre').value = candidate.genre;

  if (candidate.coverUrl) {
    $('#coverUrl').value = candidate.coverUrl;
    updateCoverPreview(candidate.coverUrl);
  }
}

async function searchBookCover() {
  const title = $('#title').value.trim();
  const author = $('#author').value.trim();

  if (!title) {
    alert('Digite o nome do livro antes de buscar a capa.');
    return;
  }

  const button = $('#searchBookBtn');
  button.textContent = 'Buscando em mais fontes...';
  button.disabled = true;

  try {
    const responses = await Promise.allSettled([
      searchOpenLibrary(title, author),
      searchGoogleBooks(title, author)
    ]);

    const candidates = responses
      .flatMap((response) => response.status === 'fulfilled' ? response.value : [])
      .filter((candidate) => candidate.coverUrl);

    if (!candidates.length) {
      alert('Não encontrei uma capa automática. Tente preencher também o autor ou cole a URL da capa manualmente.');
      return;
    }

    const bestCandidate = candidates
      .map((candidate) => ({ ...candidate, score: calculateMatchScore(candidate, title, author) }))
      .sort((a, b) => b.score - a.score)[0];

    fillBookFieldsFromCandidate(bestCandidate);
    button.textContent = `Capa encontrada: ${bestCandidate.source}`;
    setTimeout(() => {
      button.textContent = 'Buscar capa';
    }, 1800);
  } catch (error) {
    alert('Não foi possível buscar a capa agora. Verifique sua internet ou tente novamente.');
  } finally {
    button.disabled = false;
    if (button.textContent === 'Buscando em mais fontes...') button.textContent = 'Buscar capa';
  }
}

function updateCoverPreview(url) {
  const preview = $('#coverPreview');
  preview.innerHTML = '';

  if (!url) {
    preview.innerHTML = '<span>Sem capa ainda</span>';
    return;
  }

  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Prévia da capa do livro';
  img.onerror = () => {
    preview.innerHTML = '<span>Não foi possível carregar essa imagem</span>';
  };

  preview.appendChild(img);
}

function saveBook(event) {
  event.preventDefault();

  const book = {
    id: crypto.randomUUID(),
    title: $('#title').value.trim(),
    author: $('#author').value.trim(),
    genre: $('#genre').value.trim(),
    pages: $('#pages').value,
    bookFormat: $('#bookFormat').value,
    startDate: $('#startDate').value,
    endDate: $('#endDate').value,
    reasonRecommendation: $('#reasonRecommendation').checked,
    recommendedBy: $('#recommendedBy').value.trim(),
    reasonTheme: $('#reasonTheme').checked,
    reasonMovie: $('#reasonMovie').checked,
    reasonOther: $('#reasonOther').value.trim(),
    favoriteCharacter: $('#favoriteCharacter').value.trim(),
    charactersNotes: $('#charactersNotes').value.trim(),
    characterImagePrompt: $('#characterImagePrompt').value.trim(),
    favoriteQuotes: $('#favoriteQuotes').value.trim(),
    notes: $('#notes').value.trim(),
    memoryImage: $('#memoryImage').value.trim(),
    coverUrl: $('#coverUrl').value.trim() || fallbackCover,
    romanceMood: $('#romanceMood').value,
    funMood: $('#funMood').value,
    sadMood: $('#sadMood').value,
    fearMood: $('#fearMood').value,
    disgustMood: $('#disgustMood').value,
    hotMood: $('#hotMood').value,
    rating: $('#rating').value
  };

  const books = getStorage(storageKeys.books);
  books.unshift(book);
  setStorage(storageKeys.books, books);

  event.target.reset();
  updateCoverPreview('');
  renderAll();
  switchTab('estante');
}

function renderBookshelf() {
  const books = getStorage(storageKeys.books);
  const shelf = $('#bookshelf');
  shelf.innerHTML = '';

  if (!books.length) {
    shelf.innerHTML = '<div class="empty-state">Sua estante ainda está vazia. Cadastre o primeiro livro no diário.</div>';
    return;
  }

  books.forEach((book) => {
    const template = $('#bookCardTemplate').content.cloneNode(true);
    const image = template.querySelector('.book-card__cover');

    image.src = book.coverUrl || fallbackCover;
    image.alt = `Capa do livro ${book.title}`;
    template.querySelector('h3').textContent = book.title;
    template.querySelector('.book-meta').textContent = `${book.author || 'Autor não informado'} • ${book.genre || 'Gênero não informado'} • ${book.pages || '?'} páginas • ${book.bookFormat || 'Formato não informado'}`;
    template.querySelector('.book-rating').textContent = createStars(book.rating);
    template.querySelector('.book-reason').textContent = `Por que li: ${getReadingReasons(book)}`;
    template.querySelector('.book-notes').textContent = book.notes || 'Sem anotações gerais.';
    template.querySelector('.book-characters').textContent = book.charactersNotes ? `Personagens: ${book.charactersNotes}` : 'Sem anotações sobre personagens.';
    template.querySelector('.book-quotes').textContent = book.favoriteQuotes ? `Frases favoritas: ${book.favoriteQuotes}` : 'Sem frases favoritas.';

    shelf.appendChild(template);
  });
}

function renderGenreShelf() {
  const books = getStorage(storageKeys.books);
  const container = $('#genreShelf');
  container.innerHTML = '';

  const rows = [0, 1, 2, 3];
  rows.forEach((rowIndex) => {
    const row = document.createElement('div');
    row.className = 'shelf-row';
    row.dataset.label = `PRATELEIRA ${rowIndex + 1}`;

    const rowBooks = books.slice(rowIndex * 12, rowIndex * 12 + 12);
    const fillerCount = Math.max(12 - rowBooks.length, 0);

    rowBooks.forEach((book, index) => {
      const spine = document.createElement('div');
      spine.className = 'spine';
      spine.style.setProperty('--c', getGenreColor(book.genre));
      spine.style.setProperty('--h', `${62 + ((index + rowIndex) % 5) * 10}px`);
      spine.title = book.title;
      spine.textContent = book.title.slice(0, 10);
      row.appendChild(spine);
    });

    for (let i = 0; i < fillerCount; i++) {
      const spine = document.createElement('div');
      spine.className = 'spine';
      spine.style.setProperty('--h', `${58 + (i % 4) * 11}px`);
      spine.textContent = 'livro';
      row.appendChild(spine);
    }

    container.appendChild(row);
  });
}

function renderEvaluationList() {
  const books = getStorage(storageKeys.books);
  const container = $('#evaluationList');
  container.innerHTML = '';

  if (!books.length) {
    container.innerHTML = '<div class="empty-state">Cadastre um livro para ver a avaliação completa.</div>';
    return;
  }

  books.forEach((book) => {
    const article = document.createElement('article');
    article.className = 'evaluation-card';
    article.innerHTML = `
      <h3>${book.title}</h3>
      <p><strong>Autor:</strong> ${book.author || 'não informado'}</p>
      <p><strong>Gênero:</strong> ${book.genre || 'não informado'}</p>
      <p><strong>Formato:</strong> ${book.bookFormat || 'não informado'}</p>
      <p><strong>Período:</strong> ${formatDate(book.startDate)} até ${formatDate(book.endDate)}</p>
      <p class="book-rating">${createStars(book.rating)}</p>
      <div class="mood-line">
        <span>Romântico <strong>${book.romanceMood || 0}/5</strong></span>
        <span>Divertido <strong>${book.funMood || 0}/5</strong></span>
        <span>Triste <strong>${book.sadMood || 0}/5</strong></span>
        <span>Medo <strong>${book.fearMood || 0}/5</strong></span>
        <span>Nojo <strong>${book.disgustMood || 0}/5</strong></span>
        <span>Hot <strong>${book.hotMood || 0}/5</strong></span>
      </div>
      <p><strong>Momentos favoritos:</strong> ${book.notes || 'não informado'}</p>
      <p><strong>Frase favorita:</strong> ${book.favoriteQuotes?.split('\n')[0] || 'não informado'}</p>
    `;
    container.appendChild(article);
  });
}

function renderTrail() {
  const books = getStorage(storageKeys.books);
  const count = books.length;
  const path = $('#trailPath');
  path.innerHTML = '';
  $('#trailCount').textContent = `${count} livro${count === 1 ? '' : 's'} lido${count === 1 ? '' : 's'}`;

  const unlocked = Math.floor(count / 10);
  $('#trailReward').textContent = unlocked > 0
    ? `Você já desbloqueou ${unlocked} marco${unlocked === 1 ? '' : 's'} especial${unlocked === 1 ? '' : 'is'}.`
    : 'Continue lendo para desbloquear o primeiro marco.';

  for (let i = 1; i <= 60; i++) {
    const step = document.createElement('div');
    step.className = 'trail-step';
    if (i <= count) step.classList.add('done');
    if (i % 10 === 0) step.classList.add('reward');
    step.textContent = i % 10 === 0 ? '🐱' : i;
    step.title = i % 10 === 0 ? `Marco ${i}: desbloqueio especial` : `Livro ${i}`;
    path.appendChild(step);
  }
}

function renderBingo() {
  const saved = getStorage(storageKeys.bingo);
  const bingo = saved.length ? saved : defaultBingo.map((text) => ({ text, done: false }));
  const grid = $('#bingoGrid');
  grid.innerHTML = '';

  bingo.forEach((item, index) => {
    const cell = document.createElement('div');
    cell.className = 'bingo-cell';
    cell.innerHTML = `
      <textarea data-bingo-text="${index}" aria-label="Desafio ${index + 1}">${item.text}</textarea>
      <label><input type="checkbox" data-bingo-done="${index}" ${item.done ? 'checked' : ''} /> Concluído</label>
    `;
    grid.appendChild(cell);
  });
}

function saveBingo(event) {
  event.preventDefault();
  const items = [...$$('[data-bingo-text]')].map((textarea, index) => ({
    text: textarea.value.trim(),
    done: $(`[data-bingo-done="${index}"]`).checked
  }));
  setStorage(storageKeys.bingo, items);
  alert('Bingo literário salvo.');
}

function saveWishlistItem(event) {
  event.preventDefault();

  const item = {
    id: crypto.randomUUID(),
    title: $('#wishTitle').value.trim(),
    reason: $('#wishReason').value.trim()
  };

  const wishlist = getStorage(storageKeys.wishlist);
  wishlist.unshift(item);
  setStorage(storageKeys.wishlist, wishlist);

  event.target.reset();
  renderWishlist();
}

function renderWishlist() {
  const wishlist = getStorage(storageKeys.wishlist);
  const container = $('#wishlist');
  container.innerHTML = '';

  if (!wishlist.length) {
    container.innerHTML = '<div class="empty-state">Nenhum livro desejado cadastrado ainda.</div>';
    return;
  }

  wishlist.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `<strong>${item.title}</strong><p>${item.reason || 'Sem motivo informado.'}</p>`;
    container.appendChild(div);
  });
}

function saveLoan(event) {
  event.preventDefault();

  const loan = {
    id: crypto.randomUUID(),
    type: $('#loanType').value,
    book: $('#loanBook').value.trim(),
    person: $('#loanPerson').value.trim(),
    loanDate: $('#loanDate').value,
    returnDate: $('#returnDate').value
  };

  const loans = getStorage(storageKeys.loans);
  loans.unshift(loan);
  setStorage(storageKeys.loans, loans);

  event.target.reset();
  renderLoans();
}

function renderLoans() {
  const loans = getStorage(storageKeys.loans);
  const container = $('#loansList');
  container.innerHTML = '';

  if (!loans.length) {
    container.innerHTML = '<div class="empty-state">Nenhum empréstimo registrado ainda.</div>';
    return;
  }

  loans.forEach((loan) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <strong>${loan.book}</strong>
      <p>${loan.type} com ${loan.person}</p>
      <p>Empréstimo: ${formatDate(loan.loanDate)} • Devolução: ${formatDate(loan.returnDate)}</p>
    `;
    container.appendChild(div);
  });
}

function renderAll() {
  renderBookshelf();
  renderGenreShelf();
  renderEvaluationList();
  renderTrail();
  renderWishlist();
  renderLoans();
}

function bindEvents() {
  $$('.tab-button').forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  $('#searchBookBtn').addEventListener('click', searchBookCover);
  $('#coverUrl').addEventListener('input', (event) => updateCoverPreview(event.target.value));
  $('#bookForm').addEventListener('submit', saveBook);
  $('#wishlistForm').addEventListener('submit', saveWishlistItem);
  $('#loanForm').addEventListener('submit', saveLoan);
  $('#bingoForm').addEventListener('submit', saveBingo);
}

function init() {
  bindEvents();
  renderBingo();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
