(() => {
  function byId(id) {
    return document.getElementById(id);
  }

  function getCharacterFields() {
    return {
      name: byId('characterNamePro')?.value.trim() || '',
      role: byId('characterRolePro')?.value.trim() || '',
      notes: byId('characterNotesPro')?.value.trim() || '',
      visual: byId('characterVisualPro')?.value.trim() || '',
      bookTitle: byId('title')?.value.trim() || '',
      style: byId('characterAiStyle')?.value || ''
    };
  }

  function setStatus(message, image = '') {
    const status = byId('characterPreviewStatus');
    if (!status) return;

    status.style.display = 'block';
    status.textContent = message;
    if (image) status.dataset.image = image;
  }

  function injectAiControls() {
    const manager = byId('characterManager');
    const generateButton = byId('generateCharacterImageBtn');

    if (!manager || !generateButton || byId('characterAiStyle')) return;

    generateButton.textContent = 'Gerar imagem com IA';
    generateButton.classList.add('primary');

    const wrapper = document.createElement('label');
    wrapper.innerHTML = `Estilo da imagem por IA
      <select id="characterAiStyle">
        <option value="ilustração literária semi-realista, vertical, delicada, com fundo simples">Literário semi-realista</option>
        <option value="aquarela suave, aparência de diário artístico, tons delicados">Aquarela suave</option>
        <option value="fantasia editorial, iluminação cinematográfica, personagem original">Fantasia editorial</option>
        <option value="retrato moderno de personagem de livro, fundo neutro, visual elegante">Retrato moderno</option>
        <option value="estilo desenho digital para diário de leitura, bonito, limpo e expressivo">Desenho digital</option>
      </select>`;

    const actions = generateButton.closest('.mini-actions');
    actions?.insertAdjacentElement('beforebegin', wrapper);
  }

  async function generateAiCharacterImage(event) {
    const target = event.target;
    if (!target || target.id !== 'generateCharacterImageBtn') return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const fields = getCharacterFields();

    if (!fields.name && !fields.visual && !fields.notes) {
      alert('Informe pelo menos o nome, aparência ou anotações do personagem.');
      return;
    }

    const originalText = target.textContent;
    target.disabled = true;
    target.textContent = 'Gerando imagem...';
    setStatus('Gerando imagem real por IA. Aguarde alguns segundos...');

    try {
      const response = await fetch('/api/ai/character-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível gerar a imagem.');
      }

      if (!data.image) {
        throw new Error(data.warning || 'A imagem não foi retornada. Verifique se a OPENAI_API_KEY está configurada no .env.');
      }

      setStatus('Imagem gerada com IA. Clique em Adicionar personagem para salvar.', data.image);
      renderAiPreview(data.image);
    } catch (error) {
      setStatus(error.message || 'Erro ao gerar imagem por IA.');
    } finally {
      target.disabled = false;
      target.textContent = originalText || 'Gerar imagem com IA';
    }
  }

  function renderAiPreview(image) {
    let preview = byId('characterAiPreview');
    const status = byId('characterPreviewStatus');

    if (!status) return;

    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'characterAiPreview';
      preview.className = 'character-card';
      status.insertAdjacentElement('afterend', preview);
    }

    preview.innerHTML = `<img src="${image}" alt="Imagem gerada por IA para personagem" /><p>Prévia da imagem gerada.</p>`;
  }

  function observeCharacterManager() {
    injectAiControls();

    const observer = new MutationObserver(() => injectAiControls());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('click', generateAiCharacterImage, true);
  document.addEventListener('DOMContentLoaded', observeCharacterManager);
})();
