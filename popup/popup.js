document.getElementById('captureBtn').addEventListener('click', () => {
  const status = document.getElementById('status');
  status.classList.remove('hidden');
  status.textContent = 'Capturando...';

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, { action: 'capture' }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        status.textContent = 'Erro ao capturar a página.';
      } else {
        status.textContent = 'Dados enviados para o Notion!';
      }
      setTimeout(() => status.classList.add('hidden'), 3000);
    });
  });
});
