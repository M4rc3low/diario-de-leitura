const storageKeys = {
  books: 'diarioLeitura.books',
  wishlist: 'diarioLeitura.wishlist',
  loans: 'diarioLeitura.loans'
};

const fallbackCover = 'https://placehold.co/400x600/e4d4c5/2f241d?text=Sem+Capa';

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

function switchTab(tabId) {
  $$('.tab-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabId);
  });

  $$('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

async function searchBookCover() {
  const title = $('#title').value.trim();

  if (!title) {
    alert('Digite o nome do livro antes de buscar a capa.');
    return;
  }

  const button = $('#searchBookBtn');
  button.textContent = 'Buscando...';
  button.disabled = true;

  try {
    const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`);
    const data = await response.json();
    const book = data.docs?.[0];

    if (!book) {
      alert('Não encontrei esse livro na API. Você pode colar a URL da capa manualmente.');
      return;
    }

    if (book.number_of_pages_median && !$('#pages').value) {
      $('#pages').value = book.number_of_pages_median;
    }

    if (book.subject?.length && !$('#genre').value) {
      $('#genre').value = book.subject.slice(0, 2).join(', ');
    }

    if (book.cover_i) {
      const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
      $('#coverUrl').value = coverUrl;
      updateCoverPreview(coverUrl);
    } else {
      alert('Encontrei o livro, mas ele não tem capa disponível.');
    }
  } catch (error) {
    alert('Não foi possível buscar a capa agora. Verifique sua internet ou tente novamente.');
  } finally {
    button.textContent = 'Buscar capa';
    button.disabled = false;
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
    genre: $('#genre').value.trim(),
    pages: $('#pages').value,
    startDate: $('#startDate').value,
    endDate: $('#endDate').value,
    favoriteCharacter: $('#favoriteCharacter').value.trim(),
    charactersNotes: $('#charactersNotes').value.trim(),
    favoriteQuotes: $('#favoriteQuotes').value.trim(),
    notes: $('#notes').value.trim(),
    memoryImage: $('#memoryImage').value.trim(),
    coverUrl: $('#coverUrl').value.trim() || fallbackCover,
    rating: $('#rating').value
  };

  const books = getStorage(storageKeys.books);
  books.unshift(book);
  setStorage(storageKeys.books, books);

  event.target.reset();
  updateCoverPreview('');
  renderBookshelf();
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
    template.querySelector('.book-meta').textContent = `${book.genre || 'Gênero não informado'} • ${book.pages || '?'} páginas • ${formatDate(book.startDate)} até ${formatDate(book.endDate)}`;
    template.querySelector('.book-rating').textContent = createStars(book.rating);
    template.querySelector('.book-notes').textContent = book.notes || 'Sem anotações gerais.';
    template.querySelector('.book-characters').textContent = book.charactersNotes ? `Personagens: ${book.charactersNotes}` : 'Sem anotações sobre personagens.';
    template.querySelector('.book-quotes').textContent = book.favoriteQuotes ? `Frases favoritas: ${book.favoriteQuotes}` : 'Sem frases favoritas.';

    shelf.appendChild(template);
  });
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

function bindEvents() {
  $$('.tab-button').forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  $('#searchBookBtn').addEventListener('click', searchBookCover);
  $('#coverUrl').addEventListener('input', (event) => updateCoverPreview(event.target.value));
  $('#bookForm').addEventListener('submit', saveBook);
  $('#wishlistForm').addEventListener('submit', saveWishlistItem);
  $('#loanForm').addEventListener('submit', saveLoan);
}

function init() {
  bindEvents();
  renderBookshelf();
  renderWishlist();
  renderLoans();
}

document.addEventListener('DOMContentLoaded', init);
