(() => {
  const PROFILE_KEY = 'diarioLeitura.profile';

  const defaultProfile = {
    readerName: '',
    diaryTitle: 'Diário de Leitura',
    diaryPhrase: 'Minhas leituras, minhas memórias e meus livros favoritos.',
    yearlyGoal: 12,
    favoriteGenre: '',
    avatar: ''
  };

  const $ = (selector) => document.querySelector(selector);

  function readProfile() {
    try {
      return { ...defaultProfile, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') };
    } catch (error) {
      return { ...defaultProfile };
    }
  }

  function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function injectProfileStyles() {
    if ($('#profilePersonalizationStyles')) return;

    const style = document.createElement('style');
    style.id = 'profilePersonalizationStyles';
    style.textContent = `
      .profile-card {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 18px;
        align-items: center;
        max-width: 760px;
        margin: 26px auto 0;
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 28px;
        background: rgba(255, 250, 243, 0.82);
        box-shadow: var(--shadow);
        text-align: left;
      }

      .profile-avatar {
        width: 92px;
        height: 92px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: var(--soft);
        color: var(--accent-dark);
        font-family: "Cormorant Garamond", Georgia, serif;
        font-size: 2.8rem;
        font-weight: 800;
      }

      .profile-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .profile-card h2 {
        margin: 0 0 4px;
        font-size: 2rem;
      }

      .profile-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.5;
      }

      .profile-progress {
        margin-top: 10px;
        height: 10px;
        border-radius: 999px;
        overflow: hidden;
        background: #ead8c7;
      }

      .profile-progress span {
        display: block;
        width: var(--progress, 0%);
        height: 100%;
        background: var(--accent);
      }

      .profile-form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .profile-avatar-tools {
        display: grid;
        gap: 10px;
      }

      @media (max-width: 720px) {
        .profile-card {
          grid-template-columns: 1fr;
          text-align: center;
        }
        .profile-avatar {
          margin: 0 auto;
        }
        .profile-form-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getInitials(name) {
    return String(name || 'Leitor')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'L';
  }

  function getBooksCount() {
    try {
      return JSON.parse(localStorage.getItem('diarioLeitura.books') || '[]').length;
    } catch (error) {
      return 0;
    }
  }

  function renderProfileCard() {
    const hero = $('.hero__content');
    if (!hero) return;

    let card = $('#readerProfileCard');
    if (!card) {
      card = document.createElement('div');
      card.className = 'profile-card';
      card.id = 'readerProfileCard';
      hero.appendChild(card);
    }

    const profile = readProfile();
    const booksCount = getBooksCount();
    const goal = Number(profile.yearlyGoal) || 0;
    const progress = goal > 0 ? Math.min((booksCount / goal) * 100, 100) : 0;
    const displayName = profile.readerName || 'Leitor(a)';

    card.innerHTML = `
      <div class="profile-avatar">
        ${profile.avatar ? `<img src="${profile.avatar}" alt="Foto de ${displayName}" />` : getInitials(displayName)}
      </div>
      <div>
        <h2>${profile.diaryTitle || 'Diário de Leitura'} de ${displayName}</h2>
        <p>${profile.diaryPhrase || defaultProfile.diaryPhrase}</p>
        <p><strong>${booksCount}</strong> livro(s) registrado(s)${goal ? ` de uma meta de <strong>${goal}</strong> no ano` : ''}${profile.favoriteGenre ? ` • Gênero favorito: <strong>${profile.favoriteGenre}</strong>` : ''}</p>
        <div class="profile-progress" title="Progresso da meta"><span style="--progress:${progress}%"></span></div>
      </div>
    `;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) return reject(new Error('Escolha uma imagem válida.'));

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const size = 420;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          const ratio = Math.max(size / img.width, size / img.height);
          const width = img.width * ratio;
          const height = img.height * ratio;
          const x = (size - width) / 2;
          const y = (size - height) / 2;
          ctx.drawImage(img, x, y, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        };
        img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  function injectProfileTab() {
    const tabs = $('.tabs');
    const main = $('.app-shell');
    if (!tabs || !main || $('[data-tab="perfil"]')) return;

    const button = document.createElement('button');
    button.className = 'tab-button';
    button.dataset.tab = 'perfil';
    button.textContent = 'Meu perfil';
    tabs.prepend(button);

    const profile = readProfile();
    const section = document.createElement('section');
    section.className = 'tab-panel';
    section.id = 'perfil';
    section.innerHTML = `
      <div class="section-heading">
        <h2>Meu perfil de leitura</h2>
        <p>Personalize o diário com seu nome, frase, foto e meta de leitura.</p>
      </div>
      <form class="card" id="profileForm">
        <div class="profile-form-grid">
          <label>Nome da pessoa
            <input type="text" id="profileReaderName" placeholder="Ex.: Ana, Marcelo, Keila..." value="${profile.readerName || ''}" />
          </label>
          <label>Título do diário
            <input type="text" id="profileDiaryTitle" value="${profile.diaryTitle || defaultProfile.diaryTitle}" />
          </label>
          <label>Meta anual de leitura
            <input type="number" id="profileYearlyGoal" min="0" value="${profile.yearlyGoal || 12}" />
          </label>
          <label>Gênero favorito
            <input type="text" id="profileFavoriteGenre" placeholder="Romance, fantasia, suspense..." value="${profile.favoriteGenre || ''}" />
          </label>
        </div>
        <label>Frase do diário
          <textarea id="profileDiaryPhrase" rows="3" placeholder="Uma frase que represente sua vida de leitura">${profile.diaryPhrase || defaultProfile.diaryPhrase}</textarea>
        </label>
        <div class="profile-avatar-tools">
          <label>Foto ou imagem do perfil
            <input type="file" id="profileAvatarFile" accept="image/*" />
          </label>
          <button type="button" class="mini-button" id="removeProfileAvatarBtn">Remover foto</button>
        </div>
        <button type="submit" class="primary-action">Salvar perfil</button>
      </form>
    `;

    const firstPanel = main.querySelector('.tab-panel');
    firstPanel?.insertAdjacentElement('beforebegin', section);
  }

  function bindProfileEvents() {
    document.querySelectorAll('.tab-button').forEach((button) => {
      if (button.dataset.profileBound) return;
      button.dataset.profileBound = 'true';
      button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    $('#profileAvatarFile')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const profile = readProfile();
      profile.avatar = await fileToDataUrl(file);
      saveProfile(profile);
      renderProfileCard();
      event.target.value = '';
    });

    $('#removeProfileAvatarBtn')?.addEventListener('click', () => {
      const profile = readProfile();
      profile.avatar = '';
      saveProfile(profile);
      renderProfileCard();
    });

    $('#profileForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const current = readProfile();
      const profile = {
        ...current,
        readerName: $('#profileReaderName')?.value.trim() || '',
        diaryTitle: $('#profileDiaryTitle')?.value.trim() || defaultProfile.diaryTitle,
        diaryPhrase: $('#profileDiaryPhrase')?.value.trim() || defaultProfile.diaryPhrase,
        yearlyGoal: Number($('#profileYearlyGoal')?.value || 0),
        favoriteGenre: $('#profileFavoriteGenre')?.value.trim() || ''
      };
      saveProfile(profile);
      renderProfileCard();
      alert('Perfil salvo com sucesso.');
    });
  }

  function extendBackupToProfile() {
    if (!window.localStorage) return;
    const originalGetItem = localStorage.getItem.bind(localStorage);
    window.diarioLeituraProfile = {
      readProfile,
      saveProfile,
      renderProfileCard
    };

    const originalGetBackupPayload = window.getBackupPayload;
    if (typeof originalGetBackupPayload === 'function' && !originalGetBackupPayload.profileExtended) {
      const extended = function () {
        const payload = originalGetBackupPayload();
        payload.data = payload.data || {};
        payload.data[PROFILE_KEY] = readProfile();
        return payload;
      };
      extended.profileExtended = true;
      window.getBackupPayload = extended;
    }

    const originalValidate = window.validateBackupPayload;
    if (typeof originalValidate === 'function' && !originalValidate.profileExtended) {
      const extendedValidate = function (payload) {
        return originalValidate(payload) || Boolean(payload?.data?.[PROFILE_KEY]);
      };
      extendedValidate.profileExtended = true;
      window.validateBackupPayload = extendedValidate;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectProfileStyles();
    injectProfileTab();
    bindProfileEvents();
    renderProfileCard();
    extendBackupToProfile();
  });
})();
