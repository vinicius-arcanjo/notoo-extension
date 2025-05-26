// background.js - Service worker da extensão

// Listener para receber mensagens do content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendToNotion") {
    const pageData = request.pageData || {};

    // Obter chave da API e ID do banco de dados do armazenamento
    chrome.storage.local.get(["notionApiKey", "notionDatabaseId"], (res) => {
      const notionApiKey = res.notionApiKey;
      const notionDatabaseId = res.notionDatabaseId;

      // Validação de campos obrigatórios antes do envio
      if (!notionApiKey || !notionDatabaseId) {
        console.error("Notion API Key ou Database ID não configurados.");
        sendResponse({ success: false, error: "Configuração ausente" });
        return;
      }
      if (!pageData.title || pageData.title.trim() === "") {
        console.error("Título do jogo não encontrado na página.");
        sendResponse({ success: false, error: "Título não encontrado" });
        return;
      }

      // Montar payload para criar uma página no Notion
      const properties = {
        title: {
          title: [
            { text: { content: pageData.title } }
          ]
        },
        slug: {
          rich_text: [
            { text: { content: pageData.slug } }
          ]
        },
        content: {
          rich_text: [
            { text: { content: pageData.content || "" } }
          ]
        },
        releaseDate: {
          date: {
            // Converter data de lançamento para formato ISO (AAAA-MM-DD) se possível
            start: pageData.releaseDate ? new Date(pageData.releaseDate).toISOString().slice(0, 10) : null
          }
        },
        description: {
          rich_text: [
            { text: { content: pageData.description || "" } }
          ]
        },
        genres: {
          multi_select: (pageData.genres || []).map(g => ({ name: g }))
        },
        platforms: {
          multi_select: (pageData.platforms || []).map(p => ({ name: p }))
        },
        image: {
          url: pageData.image || ""
        },
        rating: {
          number: pageData.rating !== undefined ? pageData.rating : null
        },
        completed: {
          checkbox: !!pageData.completed
        },
        playAgain: {
          checkbox: !!pageData.playAgain
        },
        played: {
          checkbox: !!pageData.played
        }
      };

      const notionPayload = {
        parent: { database_id: notionDatabaseId },
        properties: properties
      };

      // Configurar a requisição para a API do Notion
      fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + notionApiKey,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28"
        },
        body: JSON.stringify(notionPayload)
      })
        .then(response => response.json().then(data => ({ status: response.status, data })))
        .then(({ status, data }) => {
          if (status >= 200 && status < 300) {
            console.log("Dados enviados com sucesso ao Notion.", data);
            sendResponse({ success: true });
          } else {
            console.error("Falha ao enviar para o Notion:", data);
            sendResponse({ success: false, error: data });
          }
        })
        .catch(error => {
          console.error("Erro na requisição ao Notion:", error);
          sendResponse({ success: false, error: error });
        });
    });

    // Indica que queremos enviar a resposta de forma assíncrona
    return true;
  }
});
