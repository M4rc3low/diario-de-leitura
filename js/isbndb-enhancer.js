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
      alert('Não encontrei uma capa automática. Agora você também pode copiar uma imagem e colar com Ctrl+V, arrastar a imagem para a área da capa ou escolher um arquivo.');
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
    alert('Não foi possível buscar a capa agora. Você pode colar a imagem manualmente com Ctrl+V.');
  } finally {
    button.disabled = false;
    if (button.textContent.includes('Buscando')) button.textContent = 'Buscar capa';
  }
}

function injectCoverPasteStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .cover-manual-tools {
      margin-top: 14px;
      display: grid;
      gap: 10px;
    }

    .cover-paste-zone {
      border: 2px dashed var(--line);
      border-radius: 20px;
      padding: 14px;
      background: #fffdf8;
      color: var(--muted);
      text-align: center;
      line-height: 1.5;
      transition: 0.2s ease;
    }

    .cover-paste-zone strong {
      color: var(--accent-dark);
    }

    .cover-paste-zone.drag-over,
    .cover-paste-zone:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(139, 75, 47, 0.12);
      outline: none;
    }

    .cover-tool-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .cover-file-label,
    .cover-clear-button {
      border: 0;
      border-radius: 16px;
      padding: 12px 14px;
      font-weight: 800;
      text-align: center;
    }

    .cover-file-label {
      background: var(--accent);
      color: #fffaf3;
      cursor: pointer;
    }

    .cover-clear-button {
      background: #f3e5d7;
      color: var(--accent-dark);
    }

    .cover-file-input {
      display: none;
    }

    .cover-status {
      min-height: 22px;
      color: var(--muted);
      font-size: 0.9rem;
      text-align: center;
    }

    @media (max-width: 640px) {
      .cover-tool-row {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

function createCoverManualTools() {
  const preview = document.querySelector('#coverPreview');
  const coverInput = document.querySelector('#coverUrl');

  if (!preview || !coverInput || document.querySelector('#coverPasteZone')) return;

  const tools = document.createElement('div');
  tools.className = 'cover-manual-tools';
  tools.innerHTML = `
    <div class="cover-paste-zone" id="coverPasteZone" tabindex="0">
      <strong>Capa manual:</strong> copie uma imagem e cole com <strong>Ctrl+V</strong>, arraste a imagem aqui ou selecione um arquivo.
    </div>
    <div class="cover-tool-row">
      <label class="cover-file-label" for="coverFileInput">Escolher imagem</label>
      <button type="button" class="cover-clear-button" id="clearCoverBtn">Remover capa</button>
    </div>
    <input class="cover-file-input" type="file" id="coverFileInput" accept="image/*" />
    <div class="cover-status" id="coverStatus"></div>
  `;

  preview.insertAdjacentElement('afterend', tools);
}

function setCoverStatus(message) {
  const status = document.querySelector('#coverStatus');
  if (status) status.textContent = message;
}

function readImageAsCompressedDataUrl(file, maxWidth = 900, maxHeight = 1400, quality = 0.86) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        let { width, height } = image;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      image.onerror = () => reject(new Error('Não foi possível carregar essa imagem.'));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

async function applyManualCover(file) {
  try {
    setCoverStatus('Preparando a imagem da capa...');
    const dataUrl = await readImageAsCompressedDataUrl(file);
    const coverInput = document.querySelector('#coverUrl');

    coverInput.value = dataUrl;
    updateCoverPreview(dataUrl);
    setCoverStatus('Capa manual adicionada. Ela será salva junto com o livro.');
  } catch (error) {
    setCoverStatus(error.message || 'Não foi possível usar essa imagem.');
  }
}

function getImageFileFromClipboard(event) {
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find((item) => item.type.startsWith('image/'));
  return imageItem ? imageItem.getAsFile() : null;
}

function bindManualCoverEvents() {
  const zone = document.querySelector('#coverPasteZone');
  const fileInput = document.querySelector('#coverFileInput');
  const clearButton = document.querySelector('#clearCoverBtn');
  const coverInput = document.querySelector('#coverUrl');

  if (!zone || !fileInput || !clearButton || !coverInput) return;

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) applyManualCover(file);
    event.target.value = '';
  });

  clearButton.addEventListener('click', () => {
    coverInput.value = '';
    updateCoverPreview('');
    setCoverStatus('Capa removida.');
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    zone.addEventListener(eventName, () => zone.classList.remove('drag-over'));
  });

  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = [...event.dataTransfer.files].find((item) => item.type.startsWith('image/'));
    if (file) applyManualCover(file);
  });

  document.addEventListener('paste', (event) => {
    const file = getImageFileFromClipboard(event);
    if (!file) return;

    event.preventDefault();
    applyManualCover(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#searchBookBtn');
  if (button) button.addEventListener('click', enhancedBookCoverSearch, true);

  injectCoverPasteStyles();
  createCoverManualTools();
  bindManualCoverEvents();
});
