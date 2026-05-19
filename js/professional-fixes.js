(() => {
  const PRO_STORAGE = {
    books: 'diarioLeitura.books',
    wishlist: 'diarioLeitura.wishlist',
    loans: 'diarioLeitura.loans'
  };

  let editingBookId = null;
  let editingWishId = null;
  let editingLoanId = null;
  let tempCharacters = [];
  let tempCollages = [];

  const readJson = (key) => JSON.parse(localStorage.getItem(key) || '[]');
  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const byId = (id) => document.getElementById(id);
  const safeText = (value) => String(value || '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

  function injectProfessionalStyles() {
    if (byId('professionalFixesStyles')) return;

    const style = document.createElement('style');
    style.id = 'professionalFixesStyles';
    style.textContent = `
      .professional-panel { margin: 18px 0; padding: 18px; border: 1px solid var(--line); border-radius: 24px; background: #fffdf8; }
      .professional-panel h3 { margin-bottom: 8px; font-size: 1.65rem; color: var(--accent-dark); }
      .professional-panel p { color: var(--muted); line-height: 1.55; }
      .mini-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
      .mini-button { border: 0; border-radius: 14px; padding: 10px 13px; background: #f3e5d7; color: var(--accent-dark); font-weight: 800; cursor: pointer; }
      .mini-button.primary { background: var(--accent); color: #fffaf3; }
      .mini-button.danger { background: #f8dddd; color: #9b2626; }
      .mini-button.success { background: #e3f1df; color: #2e6c2e; }
      .character-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .character-card, .collage-card, .record-row { border: 1px solid var(--line); border-radius: 18px; background: #fffaf3; padding: 14px; margin-top: 12px; }
      .character-card img, .collage-card img { width: 100%; max-height: 180px; object-fit: cover; border-radius: 14px; background: #ead8c7; }
      .character-list, .collage-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-top: 12px; }
      .collage-drop-zone { border: 2px dashed var(--line); border-radius: 18px; padding: 16px; text-align: center; color: var(--muted); background: #fffaf3; }
      .collage-drop-zone.drag-over { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(139, 75, 47, 0.12); }
      .hidden-input { display: none; }
      .book-card .mini-actions { border-top: 1px solid var(--line); padding-top: 10px; }
      .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #f3e5d7; color: var(--accent-dark); font-weight: 800; font-size: 0.86rem; }
      .status-pill.done { background: #e3f1df; color: #2e6c2e; }
      .idea-action-card { display: grid; gap: 10px; }
      .idea-action-card button { justify-self: start; }
      .edit-warning { margin: 12px 0; padding: 12px; border-radius: 16px; background: #fff0c9; color: #755000; font-weight: 800; }
      @media (max-width: 760px) { .character-form-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  function fileToCompressedDataUrl(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) return reject(new Error('Arquivo inválido. Escolha uma imagem.'));
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  function createCharacterPlaceholder(name, visual) {
    const initials = String(name || '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';
    const hue = Math.abs([...String(name + visual)].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 360;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="hsl(${hue}, 52%, 78%)"/>
            <stop offset="100%" stop-color="hsl(${(hue + 55) % 360}, 45%, 48%)"/>
          </linearGradient>
        </defs>
        <rect width="800" height="1000" rx="48" fill="url(#g)"/>
        <circle cx="400" cy="330" r="130" fill="rgba(255,255,255,.72)"/>
        <rect x="205" y="515" width="390" height="260" rx="120" fill="rgba(255,255,255,.62)"/>
        <text x="400" y="365" text-anchor="middle" font-size="110" font-family="Georgia" fill="#2f241d" font-weight="700">${initials}</text>
        <text x="400" y="850" text-anchor="middle" font-size="42" font-family="Georgia" fill="#2f241d" font-weight="700">${safeText(name || 'Personagem')}</text>
        <text x="400" y="910" text-anchor="middle" font-size="24" font-family="Arial" fill="#2f241d">Imagem conceitual editável</text>
      </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function insertCharacterManager() {
    if (byId('characterManager')) return;
    const anchor = byId('characterImagePrompt')?.closest('label') || byId('charactersNotes')?.closest('label');
    if (!anchor) return;

    const panel = document.createElement('div');
    panel.className = 'professional-panel';
    panel.id = 'characterManager';
    panel.innerHTML = `
      <h3>Personagens do livro</h3>
      <p>Cadastre quantos personagens quiser. Você pode gerar uma imagem conceitual simples, ou colar/enviar uma imagem depois.</p>
      <div class="character-form-grid">
        <label>Nome do personagem<input type="text" id="characterNamePro" placeholder="Ex.: Lily Bloom" /></label>
        <label>Papel na história<input type="text" id="characterRolePro" placeholder="Protagonista, vilão, par romântico..." /></label>
      </div>
      <label>Descrição/anotações<textarea id="characterNotesPro" rows="3" placeholder="Personalidade, conflitos, evolução, atitudes marcantes..."></textarea></label>
      <label>Aparência para imagem<textarea id="characterVisualPro" rows="3" placeholder="Cabelo, roupa, idade aproximada, expressão, cenário, estilo visual..."></textarea></label>
      <div class="mini-actions">
        <button type="button" class="mini-button" id="generateCharacterImageBtn">Gerar imagem simples</button>
        <label class="mini-button" for="characterImageFile">Enviar imagem</label>
        <input type="file" class="hidden-input" id="characterImageFile" accept="image/*" />
        <button type="button" class="mini-button primary" id="addCharacterBtn">Adicionar personagem</button>
      </div>
      <div id="characterPreviewStatus" class="backup-status" style="display:none"></div>
      <div class="character-list" id="characterListPro"></div>
    `;
    anchor.insertAdjacentElement('afterend', panel);

    byId('generateCharacterImageBtn')?.addEventListener('click', () => {
      const name = byId('characterNamePro').value.trim();
      const visual = byId('characterVisualPro').value.trim();
      if (!name) return alert('Informe o nome do personagem primeiro.');
      const image = createCharacterPlaceholder(name, visual);
      byId('characterPreviewStatus').style.display = 'block';
      byId('characterPreviewStatus').textContent = 'Imagem simples gerada. Clique em Adicionar personagem para salvar.';
      byId('characterPreviewStatus').dataset.image = image;
    });

    byId('characterImageFile')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const image = await fileToCompressedDataUrl(file, 900, 1200, 0.84);
      byId('characterPreviewStatus').style.display = 'block';
      byId('characterPreviewStatus').textContent = 'Imagem enviada. Clique em Adicionar personagem para salvar.';
      byId('characterPreviewStatus').dataset.image = image;
      event.target.value = '';
    });

    byId('addCharacterBtn')?.addEventListener('click', () => {
      const name = byId('characterNamePro').value.trim();
      if (!name) return alert('Informe o nome do personagem.');
      tempCharacters.push({
        id: crypto.randomUUID(),
        name,
        role: byId('characterRolePro').value.trim(),
        notes: byId('characterNotesPro').value.trim(),
        visual: byId('characterVisualPro').value.trim(),
        image: byId('characterPreviewStatus').dataset.image || ''
      });
      byId('characterNamePro').value = '';
      byId('characterRolePro').value = '';
      byId('characterNotesPro').value = '';
      byId('characterVisualPro').value = '';
      byId('characterPreviewStatus').dataset.image = '';
      byId('characterPreviewStatus').style.display = 'none';
      renderTempCharacters();
    });
  }

  function renderTempCharacters() {
    const list = byId('characterListPro');
    if (!list) return;
    list.innerHTML = tempCharacters.length ? '' : '<p>Nenhum personagem adicionado ainda.</p>';
    tempCharacters.forEach((char, index) => {
      const card = document.createElement('div');
      card.className = 'character-card';
      card.innerHTML = `
        ${char.image ? `<img src="${char.image}" alt="Imagem de ${safeText(char.name)}" />` : ''}
        <h4>${safeText(char.name)}</h4>
        <p><strong>${safeText(char.role || 'Sem papel informado')}</strong></p>
        <p>${safeText(char.notes || '')}</p>
        <p>${safeText(char.visual || '')}</p>
        <div class="mini-actions"><button type="button" class="mini-button danger" data-remove-character="${index}">Remover</button></div>
      `;
      list.appendChild(card);
    });
    list.querySelectorAll('[data-remove-character]').forEach((button) => {
      button.addEventListener('click', () => {
        tempCharacters.splice(Number(button.dataset.removeCharacter), 1);
        renderTempCharacters();
      });
    });
  }

  function insertCollageManager() {
    if (byId('collageManager')) return;
    const anchor = byId('memoryImage')?.closest('label') || byId('notes')?.closest('label');
    if (!anchor) return;

    const panel = document.createElement('div');
    panel.className = 'professional-panel';
    panel.id = 'collageManager';
    panel.innerHTML = `
      <h3>Colagens e imagens do diário</h3>
      <p>Essas imagens ficam separadas da capa. Use para cenas, frases, fotos, estética do livro ou qualquer lembrança visual.</p>
      <div class="collage-drop-zone" id="collageDropZone">Arraste imagens aqui, cole com Ctrl+V ou escolha arquivos.</div>
      <div class="mini-actions">
        <label class="mini-button primary" for="collageFiles">Escolher imagens</label>
        <input type="file" class="hidden-input" id="collageFiles" accept="image/*" multiple />
      </div>
      <div class="collage-list" id="collageListPro"></div>
    `;
    anchor.insertAdjacentElement('afterend', panel);

    const dropZone = byId('collageDropZone');
    const filesInput = byId('collageFiles');

    async function addFiles(files) {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const image = await fileToCompressedDataUrl(file, 1200, 1200, 0.82);
        tempCollages.push({ id: crypto.randomUUID(), image, caption: '' });
      }
      renderTempCollages();
    }

    filesInput?.addEventListener('change', (event) => {
      addFiles([...event.target.files]);
      event.target.value = '';
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropZone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropZone?.addEventListener(eventName, () => dropZone.classList.remove('drag-over'));
    });

    dropZone?.addEventListener('drop', (event) => {
      event.preventDefault();
      addFiles([...event.dataTransfer.files]);
    });

    document.addEventListener('paste', (event) => {
      const active = document.activeElement;
      const isWriting = ['INPUT', 'TEXTAREA'].includes(active?.tagName);
      if (isWriting) return;
      const files = [...(event.clipboardData?.items || [])]
        .filter((item) => item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter(Boolean);
      if (files.length) addFiles(files);
    });
  }

  function renderTempCollages() {
    const list = byId('collageListPro');
    if (!list) return;
    list.innerHTML = tempCollages.length ? '' : '<p>Nenhuma colagem adicionada ainda.</p>';
    tempCollages.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'collage-card';
      card.innerHTML = `
        <img src="${item.image}" alt="Colagem do diário" />
        <input type="text" value="${safeText(item.caption)}" placeholder="Legenda opcional" data-collage-caption="${index}" />
        <div class="mini-actions"><button type="button" class="mini-button danger" data-remove-collage="${index}">Remover</button></div>
      `;
      list.appendChild(card);
    });
    list.querySelectorAll('[data-remove-collage]').forEach((button) => {
      button.addEventListener('click', () => {
        tempCollages.splice(Number(button.dataset.removeCollage), 1);
        renderTempCollages();
      });
    });
    list.querySelectorAll('[data-collage-caption]').forEach((input) => {
      input.addEventListener('input', () => {
        tempCollages[Number(input.dataset.collageCaption)].caption = input.value;
      });
    });
  }

  function cloneFormAndBind(formId, submitHandler) {
    const oldForm = byId(formId);
    if (!oldForm || oldForm.dataset.professionalBound) return;
    const newForm = oldForm.cloneNode(true);
    newForm.dataset.professionalBound = 'true';
    oldForm.replaceWith(newForm);
    newForm.addEventListener('submit', submitHandler);
    return newForm;
  }

  function collectBookFromForm() {
    const legacyCharacters = byId('charactersNotes')?.value.trim();
    const mainCharacter = byId('favoriteCharacter')?.value.trim();
    const visual = byId('characterImagePrompt')?.value.trim();
    const characters = [...tempCharacters];

    if (mainCharacter && !characters.some((char) => char.name === mainCharacter)) {
      characters.unshift({ id: crypto.randomUUID(), name: mainCharacter, role: 'Personagem favorito', notes: legacyCharacters, visual, image: '' });
    }

    return {
      id: editingBookId || crypto.randomUUID(),
      title: byId('title')?.value.trim(),
      author: byId('author')?.value.trim(),
      genre: byId('genre')?.value.trim(),
      pages: byId('pages')?.value,
      bookFormat: byId('bookFormat')?.value,
      startDate: byId('startDate')?.value,
      endDate: byId('endDate')?.value,
      reasonRecommendation: byId('reasonRecommendation')?.checked || false,
      recommendedBy: byId('recommendedBy')?.value.trim(),
      reasonTheme: byId('reasonTheme')?.checked || false,
      reasonMovie: byId('reasonMovie')?.checked || false,
      reasonOther: byId('reasonOther')?.value.trim(),
      favoriteCharacter: mainCharacter,
      charactersNotes: legacyCharacters,
      characterImagePrompt: visual,
      characters,
      favoriteQuotes: byId('favoriteQuotes')?.value.trim(),
      notes: byId('notes')?.value.trim(),
      memoryImage: byId('memoryImage')?.value.trim(),
      collages: tempCollages,
      coverUrl: byId('coverUrl')?.value.trim() || (window.fallbackCover || 'https://placehold.co/400x600/e4d4c5/2f241d?text=Sem+Capa'),
      romanceMood: byId('romanceMood')?.value,
      funMood: byId('funMood')?.value,
      sadMood: byId('sadMood')?.value,
      fearMood: byId('fearMood')?.value,
      disgustMood: byId('disgustMood')?.value,
      hotMood: byId('hotMood')?.value,
      rating: byId('rating')?.value,
      updatedAt: new Date().toISOString()
    };
  }

  function saveBookProfessional(event) {
    event.preventDefault();
    const book = collectBookFromForm();
    if (!book.title) return alert('Informe o nome do livro.');

    const books = readJson(PRO_STORAGE.books);
    const index = books.findIndex((item) => item.id === book.id);
    if (index >= 0) books[index] = book;
    else books.unshift(book);
    writeJson(PRO_STORAGE.books, books);

    editingBookId = null;
    tempCharacters = [];
    tempCollages = [];
    event.target.reset();
    byId('coverPreview') && updateCoverPreview('');
    renderTempCharacters();
    renderTempCollages();
    removeEditWarning();
    renderProfessionalAll();
    switchTab('estante');
  }

  function fillBookForm(book) {
    switchTab('diario');
    editingBookId = book.id;
    const set = (id, value) => { const el = byId(id); if (el) el.value = value || ''; };
    const check = (id, value) => { const el = byId(id); if (el) el.checked = Boolean(value); };

    set('title', book.title); set('author', book.author); set('genre', book.genre); set('pages', book.pages); set('bookFormat', book.bookFormat);
    set('startDate', book.startDate); set('endDate', book.endDate); check('reasonRecommendation', book.reasonRecommendation);
    set('recommendedBy', book.recommendedBy); check('reasonTheme', book.reasonTheme); check('reasonMovie', book.reasonMovie); set('reasonOther', book.reasonOther);
    set('favoriteCharacter', book.favoriteCharacter); set('charactersNotes', book.charactersNotes); set('characterImagePrompt', book.characterImagePrompt);
    set('favoriteQuotes', book.favoriteQuotes); set('notes', book.notes); set('memoryImage', book.memoryImage); set('coverUrl', book.coverUrl);
    set('romanceMood', book.romanceMood); set('funMood', book.funMood); set('sadMood', book.sadMood); set('fearMood', book.fearMood); set('disgustMood', book.disgustMood); set('hotMood', book.hotMood); set('rating', book.rating || '5');
    tempCharacters = Array.isArray(book.characters) ? [...book.characters] : [];
    tempCollages = Array.isArray(book.collages) ? [...book.collages] : [];
    renderTempCharacters();
    renderTempCollages();
    updateCoverPreview(book.coverUrl || '');
    showEditWarning('Você está editando um livro já salvo. Ao clicar em Salvar, ele será atualizado.');
  }

  function showEditWarning(message) {
    removeEditWarning();
    const form = byId('bookForm');
    const warning = document.createElement('div');
    warning.className = 'edit-warning';
    warning.id = 'bookEditWarning';
    warning.textContent = message;
    form?.prepend(warning);
  }

  function removeEditWarning() {
    byId('bookEditWarning')?.remove();
  }

  function deleteBook(bookId) {
    if (!confirm('Deseja excluir este livro do diário?')) return;
    writeJson(PRO_STORAGE.books, readJson(PRO_STORAGE.books).filter((book) => book.id !== bookId));
    renderProfessionalAll();
  }

  function renderProfessionalBookshelf() {
    const shelf = byId('bookshelf');
    if (!shelf) return;
    const books = readJson(PRO_STORAGE.books);
    shelf.innerHTML = books.length ? '' : '<div class="empty-state">Sua estante ainda está vazia. Cadastre o primeiro livro no diário.</div>';

    books.forEach((book) => {
      const card = document.createElement('article');
      card.className = 'book-card';
      const characters = Array.isArray(book.characters) ? book.characters : [];
      const collages = Array.isArray(book.collages) ? book.collages : [];
      card.innerHTML = `
        <img class="book-card__cover" src="${book.coverUrl || 'https://placehold.co/400x600/e4d4c5/2f241d?text=Sem+Capa'}" alt="Capa do livro" />
        <div class="book-card__body">
          <h3>${safeText(book.title)}</h3>
          <p class="book-meta">${safeText(book.author || 'Autor não informado')} • ${safeText(book.genre || 'Gênero não informado')} • ${safeText(book.pages || '?')} páginas</p>
          <p class="book-rating">${'★'.repeat(Number(book.rating || 0))}${'☆'.repeat(5 - Number(book.rating || 0))}</p>
          <p><span class="status-pill">${characters.length} personagem(ns)</span> <span class="status-pill">${collages.length} colagem(ns)</span></p>
          <details>
            <summary>Ver detalhes</summary>
            <p><strong>Por que li:</strong> ${safeText(getReadingReasons(book))}</p>
            <p><strong>Anotações:</strong> ${safeText(book.notes || 'Sem anotações.')}</p>
            <p><strong>Frases:</strong> ${safeText(book.favoriteQuotes || 'Sem frases favoritas.')}</p>
            ${characters.map((char) => `<div class="character-card">${char.image ? `<img src="${char.image}" alt="${safeText(char.name)}" />` : ''}<h4>${safeText(char.name)}</h4><p>${safeText(char.role || '')}</p><p>${safeText(char.notes || '')}</p></div>`).join('')}
            ${collages.map((item) => `<div class="collage-card"><img src="${item.image}" alt="Colagem" /><p>${safeText(item.caption || '')}</p></div>`).join('')}
          </details>
          <div class="mini-actions">
            <button type="button" class="mini-button primary" data-edit-book="${book.id}">Editar</button>
            <button type="button" class="mini-button danger" data-delete-book="${book.id}">Excluir</button>
          </div>
        </div>
      `;
      shelf.appendChild(card);
    });

    shelf.querySelectorAll('[data-edit-book]').forEach((button) => button.addEventListener('click', () => {
      const book = readJson(PRO_STORAGE.books).find((item) => item.id === button.dataset.editBook);
      if (book) fillBookForm(book);
    }));
    shelf.querySelectorAll('[data-delete-book]').forEach((button) => button.addEventListener('click', () => deleteBook(button.dataset.deleteBook)));
  }

  function saveWishlistProfessional(event) {
    event.preventDefault();
    const item = {
      id: editingWishId || crypto.randomUUID(),
      title: byId('wishTitle')?.value.trim(),
      reason: byId('wishReason')?.value.trim(),
      read: false
    };
    if (!item.title) return;
    const list = readJson(PRO_STORAGE.wishlist);
    const index = list.findIndex((old) => old.id === item.id);
    if (index >= 0) item.read = list[index].read || false, list[index] = item;
    else list.unshift(item);
    writeJson(PRO_STORAGE.wishlist, list);
    editingWishId = null;
    event.target.reset();
    renderProfessionalWishlist();
  }

  function renderProfessionalWishlist() {
    const container = byId('wishlist');
    if (!container) return;
    const list = readJson(PRO_STORAGE.wishlist);
    container.innerHTML = list.length ? '' : '<div class="empty-state">Nenhum livro desejado cadastrado ainda.</div>';
    list.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'list-item';
      row.innerHTML = `
        <strong>${safeText(item.title)}</strong>
        <p>${safeText(item.reason || 'Sem motivo informado.')}</p>
        <label class="check-line"><input type="checkbox" ${item.read ? 'checked' : ''} data-toggle-wish="${item.id}" /> Já li este livro</label>
        <div class="mini-actions"><button class="mini-button primary" data-edit-wish="${item.id}">Editar</button><button class="mini-button danger" data-delete-wish="${item.id}">Excluir</button></div>
      `;
      container.appendChild(row);
    });
    container.querySelectorAll('[data-toggle-wish]').forEach((input) => input.addEventListener('change', () => {
      const list = readJson(PRO_STORAGE.wishlist);
      const item = list.find((entry) => entry.id === input.dataset.toggleWish);
      if (item) item.read = input.checked;
      writeJson(PRO_STORAGE.wishlist, list);
      renderProfessionalWishlist();
    }));
    container.querySelectorAll('[data-edit-wish]').forEach((button) => button.addEventListener('click', () => {
      const item = readJson(PRO_STORAGE.wishlist).find((entry) => entry.id === button.dataset.editWish);
      if (!item) return;
      editingWishId = item.id;
      byId('wishTitle').value = item.title || '';
      byId('wishReason').value = item.reason || '';
    }));
    container.querySelectorAll('[data-delete-wish]').forEach((button) => button.addEventListener('click', () => {
      writeJson(PRO_STORAGE.wishlist, readJson(PRO_STORAGE.wishlist).filter((entry) => entry.id !== button.dataset.deleteWish));
      renderProfessionalWishlist();
    }));
  }

  function saveLoanProfessional(event) {
    event.preventDefault();
    const loan = {
      id: editingLoanId || crypto.randomUUID(),
      type: byId('loanType')?.value,
      book: byId('loanBook')?.value.trim(),
      person: byId('loanPerson')?.value.trim(),
      loanDate: byId('loanDate')?.value,
      returnDate: byId('returnDate')?.value,
      returned: false
    };
    if (!loan.book || !loan.person) return;
    const list = readJson(PRO_STORAGE.loans);
    const index = list.findIndex((old) => old.id === loan.id);
    if (index >= 0) loan.returned = list[index].returned || false, list[index] = loan;
    else list.unshift(loan);
    writeJson(PRO_STORAGE.loans, list);
    editingLoanId = null;
    event.target.reset();
    renderProfessionalLoans();
  }

  function renderProfessionalLoans() {
    const container = byId('loansList');
    if (!container) return;
    const list = readJson(PRO_STORAGE.loans);
    container.innerHTML = list.length ? '' : '<div class="empty-state">Nenhum empréstimo registrado ainda.</div>';
    list.forEach((loan) => {
      const row = document.createElement('div');
      row.className = 'list-item';
      row.innerHTML = `
        <strong>${safeText(loan.book)}</strong>
        <p>${safeText(loan.type || '')} com ${safeText(loan.person || '')}</p>
        <p>Empréstimo: ${safeText(loan.loanDate || 'sem data')} • Devolução: ${safeText(loan.returnDate || 'sem data')}</p>
        <label class="check-line"><input type="checkbox" ${loan.returned ? 'checked' : ''} data-toggle-loan="${loan.id}" /> Livro devolvido</label>
        <span class="status-pill ${loan.returned ? 'done' : ''}">${loan.returned ? 'Devolvido' : 'Pendente'}</span>
        <div class="mini-actions"><button class="mini-button primary" data-edit-loan="${loan.id}">Editar</button><button class="mini-button danger" data-delete-loan="${loan.id}">Excluir</button></div>
      `;
      container.appendChild(row);
    });
    container.querySelectorAll('[data-toggle-loan]').forEach((input) => input.addEventListener('change', () => {
      const list = readJson(PRO_STORAGE.loans);
      const loan = list.find((entry) => entry.id === input.dataset.toggleLoan);
      if (loan) loan.returned = input.checked;
      writeJson(PRO_STORAGE.loans, list);
      renderProfessionalLoans();
    }));
    container.querySelectorAll('[data-edit-loan]').forEach((button) => button.addEventListener('click', () => {
      const loan = readJson(PRO_STORAGE.loans).find((entry) => entry.id === button.dataset.editLoan);
      if (!loan) return;
      editingLoanId = loan.id;
      byId('loanType').value = loan.type || 'Peguei emprestado';
      byId('loanBook').value = loan.book || '';
      byId('loanPerson').value = loan.person || '';
      byId('loanDate').value = loan.loanDate || '';
      byId('returnDate').value = loan.returnDate || '';
    }));
    container.querySelectorAll('[data-delete-loan]').forEach((button) => button.addEventListener('click', () => {
      writeJson(PRO_STORAGE.loans, readJson(PRO_STORAGE.loans).filter((entry) => entry.id !== button.dataset.deleteLoan));
      renderProfessionalLoans();
    }));
  }

  function makeIdeasFunctional() {
    const grid = document.querySelector('#ideias .ideas-grid');
    if (!grid || grid.dataset.functional) return;
    grid.dataset.functional = 'true';
    grid.innerHTML = `
      <article class="idea-card idea-action-card"><h3>Upload de colagens</h3><p>Use o novo painel de colagens no registro do livro.</p><button class="mini-button primary" data-open-tab="diario">Abrir registro</button></article>
      <article class="idea-card idea-action-card"><h3>Página por personagem</h3><p>Cadastre vários personagens com imagem, função e descrição.</p><button class="mini-button primary" data-open-tab="diario">Cadastrar personagem</button></article>
      <article class="idea-card idea-action-card"><h3>Backup</h3><p>Exporte JSON, importe backup e crie cópia rápida.</p><button class="mini-button primary" data-open-tab="backup">Abrir backup</button></article>
      <article class="idea-card idea-action-card"><h3>Lista de desejos</h3><p>Marque quando um livro desejado já foi lido.</p><button class="mini-button primary" data-open-tab="desejados">Abrir desejos</button></article>
      <article class="idea-card idea-action-card"><h3>Empréstimos</h3><p>Edite registros e marque livros devolvidos.</p><button class="mini-button primary" data-open-tab="emprestimos">Abrir empréstimos</button></article>
      <article class="idea-card idea-action-card"><h3>Revisão fina</h3><p>Use editar/excluir em todas as áreas principais antes de exportar o backup.</p><button class="mini-button primary" data-open-tab="estante">Revisar estante</button></article>
    `;
    grid.querySelectorAll('[data-open-tab]').forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.openTab)));
  }

  function renderProfessionalAll() {
    if (typeof renderGenreShelf === 'function') renderGenreShelf();
    if (typeof renderEvaluationList === 'function') renderEvaluationList();
    if (typeof renderTrail === 'function') renderTrail();
    renderProfessionalBookshelf();
    renderProfessionalWishlist();
    renderProfessionalLoans();
    if (typeof renderBackupStats === 'function') renderBackupStats();
  }

  function rebindForms() {
    const bookForm = cloneFormAndBind('bookForm', saveBookProfessional);
    cloneFormAndBind('wishlistForm', saveWishlistProfessional);
    cloneFormAndBind('loanForm', saveLoanProfessional);

    document.querySelectorAll('.tab-button').forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.tab)));
    byId('searchBookBtn')?.addEventListener('click', (event) => typeof enhancedBookCoverSearch === 'function' ? enhancedBookCoverSearch(event) : searchBookCover(event), true);
    byId('coverUrl')?.addEventListener('input', (event) => updateCoverPreview(event.target.value));

    if (bookForm) {
      insertCharacterManager();
      insertCollageManager();
      renderTempCharacters();
      renderTempCollages();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectProfessionalStyles();
    rebindForms();
    makeIdeasFunctional();
    renderProfessionalAll();
  });
})();
