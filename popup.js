// popup.js - Lida com salvamento e carregamento das configurações do usuário

// Ao carregar o popup, buscar valores salvos e preencher os campos
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["notionApiKey", "notionDatabaseId", "enableFloatingButton"], (res) => {
    if (res.notionApiKey) {
      document.getElementById("apiKey").value = res.notionApiKey;
    }
    if (res.notionDatabaseId) {
      document.getElementById("databaseId").value = res.notionDatabaseId;
    }
    // Se a chave não existir no storage, default será true (mostrar botão)
    document.getElementById("enableButton").checked = res.enableFloatingButton !== false;
  });

  // Configurar clique do botão Salvar para guardar as preferências
  document.getElementById("saveBtn").addEventListener("click", () => {
    // Obter valores dos campos
    const apiKey = document.getElementById("apiKey").value.trim();
    const databaseId = document.getElementById("databaseId").value.trim();
    const enableButton = document.getElementById("enableButton").checked;

    if (!apiKey || !databaseId) {
      // Campos obrigatórios não preenchidos
      const statusEl = document.getElementById("status");
      statusEl.style.color = "red";
      statusEl.textContent = "Por favor, preencha a API Key e o Database ID.";
      return;
    }

    // Salvar configurações no armazenamento local do Chrome
    chrome.storage.local.set({
      notionApiKey: apiKey,
      notionDatabaseId: databaseId,
      enableFloatingButton: enableButton
    }, () => {
      // Feedback rápido de sucesso
      const statusEl = document.getElementById("status");
      statusEl.style.color = "green";
      statusEl.textContent = "Configurações salvas!";
      setTimeout(() => { statusEl.textContent = ""; }, 3000);
    });
  });
});
