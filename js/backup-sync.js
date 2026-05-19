const backupConfig = {
  appName: 'Diário de Leitura',
  version: '1.0.0',
  storageKeys: [
    'diarioLeitura.books',
    'diarioLeitura.wishlist',
    'diarioLeitura.loans',
    'diarioLeitura.bingo'
  ]
};

function getBackupPayload() {
  const data = {};

  backupConfig.storageKeys.forEach((key) => {
    data[key] = JSON.parse(localStorage.getItem(key) || '[]');
  });

  data['diarioLeitura.profile'] = JSON.parse(localStorage.getItem('diarioLeitura.profile') || '{}');

  return {
    app: backupConfig.appName,
    version: backupConfig.version,
    exportedAt: new Date().toISOString(),
    data
  };
}

function downloadTextFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportBackup() {
  const payload = getBackupPayload();
  const date = new Date().toISOString().slice(0, 10);
  const filename = `diario-de-leitura-backup-${date}.json`;

  downloadTextFile(filename, JSON.stringify(payload, null, 2));
  setSyncStatus('Backup exportado com sucesso. Guarde esse arquivo em um lugar seguro.');
  setLastBackupDate();
}

function exportReadableBackup() {
  const books = JSON.parse(localStorage.getItem('diarioLeitura.books') || '[]');
  const wishlist = JSON.parse(localStorage.getItem('diarioLeitura.wishlist') || '[]');
  const loans = JSON.parse(localStorage.getItem('diarioLeitura.loans') || '[]');
  const profile = JSON.parse(localStorage.getItem('diarioLeitura.profile') || '{}');

  let text = `DIÁRIO DE LEITURA\n`;
  if (profile.readerName) text += `Leitor(a): ${profile.readerName}\n`;
  if (profile.diaryPhrase) text += `Frase: ${profile.diaryPhrase}\n`;
  text += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n\n`;

  text += 'LIVROS LIDOS\n';
  text += '====================\n';
  books.forEach((book, index) => {
    text += `${index + 1}. ${book.title || 'Sem título'}\n`;
    text += `Autor: ${book.author || 'Não informado'}\n`;
    text += `Gênero: ${book.genre || 'Não informado'}\n`;
    text += `Páginas: ${book.pages || 'Não informado'}\n`;
    text += `Avaliação: ${book.rating || 'Não informado'}/5\n`;
    text += `Anotações: ${book.notes || 'Sem anotações'}\n`;
    text += `Frases favoritas: ${book.favoriteQuotes || 'Sem frases'}\n\n`;
  });

  text += '\nLIVROS QUE DESEJO LER\n';
  text += '====================\n';
  wishlist.forEach((item, index) => {
    text += `${index + 1}. ${item.title || 'Sem título'} - ${item.reason || 'Sem motivo'}\n`;
  });

  text += '\nEMPRÉSTIMOS\n';
  text += '====================\n';
  loans.forEach((loan, index) => {
    text += `${index + 1}. ${loan.book || 'Sem título'} | ${loan.type || ''} | Pessoa: ${loan.person || 'Não informada'} | Empréstimo: ${loan.loanDate || 'Sem data'} | Devolução: ${loan.returnDate || 'Sem data'}\n`;
  });

  const date = new Date().toISOString().slice(0, 10);
  downloadTextFile(`diario-de-leitura-resumo-${date}.txt`, text, 'text/plain');
  setSyncStatus('Resumo em texto exportado com sucesso.');
}

function validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (!payload.data || typeof payload.data !== 'object') return false;

  return backupConfig.storageKeys.some((key) => Array.isArray(payload.data[key])) || Boolean(payload.data['diarioLeitura.profile']);
}

function importBackupFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);

      if (!validateBackupPayload(payload)) {
        setSyncStatus('Arquivo inválido. Escolha um backup exportado pelo Diário de Leitura.');
        return;
      }

      const confirmed = confirm('Importar este backup vai substituir os dados atuais do diário neste navegador. Deseja continuar?');
      if (!confirmed) return;

      backupConfig.storageKeys.forEach((key) => {
        const value = Array.isArray(payload.data[key]) ? payload.data[key] : [];
        localStorage.setItem(key, JSON.stringify(value));
      });

      if (payload.data['diarioLeitura.profile']) {
        localStorage.setItem('diarioLeitura.profile', JSON.stringify(payload.data['diarioLeitura.profile']));
      }

      setSyncStatus('Backup importado com sucesso. A página será atualizada.');
      setLastBackupDate();
      setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setSyncStatus('Não foi possível importar. Verifique se o arquivo é um JSON válido.');
    }
  };

  reader.readAsText(file, 'utf-8');
}

function createSnapshot() {
  const payload = getBackupPayload();
  localStorage.setItem('diarioLeitura.lastSnapshot', JSON.stringify(payload));
  localStorage.setItem('diarioLeitura.lastSnapshotAt', new Date().toISOString());
  setSyncStatus('Cópia rápida criada neste dispositivo.');
  renderBackupStats();
}

function restoreSnapshot() {
  const snapshot = localStorage.getItem('diarioLeitura.lastSnapshot');

  if (!snapshot) {
    setSyncStatus('Nenhuma cópia rápida encontrada neste dispositivo.');
    return;
  }

  const confirmed = confirm('Restaurar a cópia rápida vai substituir os dados atuais. Deseja continuar?');
  if (!confirmed) return;

  try {
    const payload = JSON.parse(snapshot);
    if (!validateBackupPayload(payload)) {
      setSyncStatus('A cópia rápida está inválida.');
      return;
    }

    backupConfig.storageKeys.forEach((key) => {
      localStorage.setItem(key, JSON.stringify(payload.data[key] || []));
    });

    if (payload.data['diarioLeitura.profile']) {
      localStorage.setItem('diarioLeitura.profile', JSON.stringify(payload.data['diarioLeitura.profile']));
    }

    setSyncStatus('Cópia rápida restaurada. A página será atualizada.');
    setTimeout(() => window.location.reload(), 900);
  } catch (error) {
    setSyncStatus('Não foi possível restaurar a cópia rápida.');
  }
}

function clearAllData() {
  const confirmed = confirm('Isso vai apagar livros, lista de desejos, empréstimos, bingo e perfil deste navegador. Deseja continuar?');
  if (!confirmed) return;

  backupConfig.storageKeys.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('diarioLeitura.profile');
  setSyncStatus('Dados apagados deste navegador. A página será atualizada.');
  setTimeout(() => window.location.reload(), 900);
}

function setLastBackupDate() {
  localStorage.setItem('diarioLeitura.lastBackupAt', new Date().toISOString());
  renderBackupStats();
}

function setSyncStatus(message) {
  const status = document.querySelector('#backupStatus');
  if (status) status.textContent = message;
}

function formatBackupDate(value) {
  if (!value) return 'Ainda não feito';
  return new Date(value).toLocaleString('pt-BR');
}

function renderBackupStats() {
  const stats = document.querySelector('#backupStats');
  if (!stats) return;

  const books = JSON.parse(localStorage.getItem('diarioLeitura.books') || '[]');
  const wishlist = JSON.parse(localStorage.getItem('diarioLeitura.wishlist') || '[]');
  const loans = JSON.parse(localStorage.getItem('diarioLeitura.loans') || '[]');
  const bingo = JSON.parse(localStorage.getItem('diarioLeitura.bingo') || '[]');
  const profile = JSON.parse(localStorage.getItem('diarioLeitura.profile') || '{}');
  const lastBackup = localStorage.getItem('diarioLeitura.lastBackupAt');
  const lastSnapshot = localStorage.getItem('diarioLeitura.lastSnapshotAt');

  stats.innerHTML = `
    <div><strong>${profile.readerName || 'Sem nome'}</strong><span>perfil</span></div>
    <div><strong>${books.length}</strong><span>livros lidos</span></div>
    <div><strong>${wishlist.length}</strong><span>desejos</span></div>
    <div><strong>${loans.length}</strong><span>empréstimos</span></div>
    <div><strong>${bingo.filter((item) => item.done).length}/${bingo.length || 25}</strong><span>bingo</span></div>
    <div><strong>${formatBackupDate(lastBackup)}</strong><span>último backup exportado</span></div>
    <div><strong>${formatBackupDate(lastSnapshot)}</strong><span>última cópia rápida</span></div>
  `;
}

function injectBackupStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .backup-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .backup-action { border: 0; border-radius: 20px; padding: 18px; text-align: left; background: #fffdf8; color: var(--ink); box-shadow: var(--shadow); border: 1px solid var(--line); }
    .backup-action strong { display: block; margin-bottom: 6px; font-family: "Cormorant Garamond", Georgia, serif; font-size: 1.45rem; color: var(--accent-dark); }
    .backup-action span { color: var(--muted); line-height: 1.45; }
    .backup-action.primary { background: var(--accent); color: #fffaf3; }
    .backup-action.primary strong, .backup-action.primary span { color: #fffaf3; }
    .backup-file-input { display: none; }
    .backup-status { margin-top: 16px; padding: 14px; border-radius: 18px; background: #f3e5d7; color: var(--accent-dark); font-weight: 700; }
    .backup-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 18px; }
    .backup-stats div { padding: 14px; border-radius: 18px; background: #fffdf8; border: 1px solid var(--line); }
    .backup-stats strong { display: block; color: var(--accent-dark); font-size: 1.05rem; }
    .backup-stats span { color: var(--muted); font-size: 0.9rem; }
  `;
  document.head.appendChild(style);
}

function injectBackupTab() {
  const tabs = document.querySelector('.tabs');
  const main = document.querySelector('.app-shell');

  if (!tabs || !main || document.querySelector('[data-tab="backup"]')) return;

  const button = document.createElement('button');
  button.className = 'tab-button';
  button.dataset.tab = 'backup';
  button.textContent = 'Backup';
  tabs.appendChild(button);

  const section = document.createElement('section');
  section.className = 'tab-panel';
  section.id = 'backup';
  section.innerHTML = `
    <div class="section-heading"><h2>Sincronizador e backup</h2><p>Exporte, importe, crie uma cópia rápida e leve seus dados para outro navegador, computador ou futuro app mobile.</p></div>
    <div class="card">
      <div class="backup-grid">
        <button type="button" class="backup-action primary" id="exportBackupBtn"><strong>Exportar backup JSON</strong><span>Arquivo completo para restaurar depois.</span></button>
        <button type="button" class="backup-action" id="exportTextBtn"><strong>Exportar resumo TXT</strong><span>Arquivo simples para ler ou imprimir.</span></button>
        <label class="backup-action" for="importBackupInput"><strong>Importar backup</strong><span>Restaurar dados de um arquivo JSON.</span></label>
        <button type="button" class="backup-action" id="snapshotBtn"><strong>Cópia rápida</strong><span>Salva uma cópia neste dispositivo.</span></button>
        <button type="button" class="backup-action" id="restoreSnapshotBtn"><strong>Restaurar cópia rápida</strong><span>Volta para a última cópia local.</span></button>
        <button type="button" class="backup-action" id="clearAllDataBtn"><strong>Apagar dados locais</strong><span>Limpa o diário deste navegador.</span></button>
      </div>
      <input type="file" class="backup-file-input" id="importBackupInput" accept="application/json,.json" />
      <div class="backup-status" id="backupStatus">Pronto para fazer backup.</div>
      <div class="backup-stats" id="backupStats"></div>
    </div>
  `;

  main.appendChild(section);
}

function bindBackupEvents() {
  document.querySelectorAll('.tab-button').forEach((button) => {
    if (button.dataset.backupBound) return;
    button.dataset.backupBound = 'true';
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  document.querySelector('#exportBackupBtn')?.addEventListener('click', exportBackup);
  document.querySelector('#exportTextBtn')?.addEventListener('click', exportReadableBackup);
  document.querySelector('#snapshotBtn')?.addEventListener('click', createSnapshot);
  document.querySelector('#restoreSnapshotBtn')?.addEventListener('click', restoreSnapshot);
  document.querySelector('#clearAllDataBtn')?.addEventListener('click', clearAllData);
  document.querySelector('#importBackupInput')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) importBackupFile(file);
    event.target.value = '';
  });
}

function loadProfessionalFixes() {
  if (document.querySelector('script[data-professional-fixes]')) return;
  const script = document.createElement('script');
  script.src = 'js/professional-fixes.js';
  script.dataset.professionalFixes = 'true';
  document.body.appendChild(script);
}

function loadProfilePersonalization() {
  if (document.querySelector('script[data-profile-personalization]')) return;
  const script = document.createElement('script');
  script.src = 'js/profile-personalization.js';
  script.dataset.profilePersonalization = 'true';
  document.body.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
  injectBackupStyles();
  injectBackupTab();
  bindBackupEvents();
  renderBackupStats();
  loadProfilePersonalization();
  loadProfessionalFixes();
});
