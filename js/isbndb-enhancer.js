async function searchISBNdb(title, author) {
  const query = [title, author].filter(Boolean).join(' ').trim();

  if (!query) return [];

  try {
    const response = await fetch(`/api/isbndb/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data.books) ? data.books : [];
  } catch (error) {
    return [];
  }
}

async function enhancedBookCoverSearch(event) {
  event.preventDefault();
  event.stopImmediatePropagation();

  const title = document.querySelector('#title').value.trim();
  const author = document.querySelector('#author').value.trim();
  const button = document.querySelector('#searchBookBtn');

  if (!title) {
    alert('Digite o nome do livro antes de buscar a capa.');
    return;
  }

  button.textContent = 'Buscando em ISBNdb, Google Books e Open Library...';
  button.disabled = true;

  try {
    const responses = await Promise.allSettled([
      searchISBNdb(title, author),
      searchGoogleBooks(title, author),
      searchOpenLibrary(title, author)
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
    }, 2200);
  } catch (error) {
    alert('Não foi possível buscar a capa agora. Verifique sua internet ou tente novamente.');
  } finally {
    button.disabled = false;
    if (button.textContent.includes('Buscando')) button.textContent = 'Buscar capa';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#searchBookBtn');
  if (!button) return;

  button.addEventListener('click', enhancedBookCoverSearch, true);
});
