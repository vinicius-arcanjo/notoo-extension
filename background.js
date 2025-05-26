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

      // Função para truncar texto para o limite do Notion (2000 caracteres)
      function truncateText(text, limit = 2000) {
        if (!text) return "";
        return text.length > limit ? text.substring(0, limit - 3) + "..." : text;
      }

      // Montar payload para criar uma página no Notion
      // Apenas incluir a propriedade title que é padrão no Notion
      const properties = {
        title: {
          title: [
            { text: { content: pageData.title } }
          ]
        }
      };

      // Preparar os blocos de conteúdo para a página do Notion
      const children = [];

      // Adicionar imagem como primeiro bloco se disponível
      if (pageData.image) {
        children.push({
          object: "block",
          type: "image",
          image: {
            type: "external",
            external: {
              url: pageData.image
            }
          }
        });
      }

      // Adicionar informações como blocos de texto
      let infoContent = "";

      if (pageData.description) {
        infoContent += `**Descrição:** ${pageData.description}\n\n`;
      }

      if (pageData.releaseDate) {
        infoContent += `**Data de Lançamento:** ${pageData.releaseDate}\n\n`;
      }

      if (pageData.genres && pageData.genres.length > 0) {
        infoContent += `**Gêneros:** ${pageData.genres.join(", ")}\n\n`;
      }

      if (pageData.platforms && pageData.platforms.length > 0) {
        infoContent += `**Plataformas:** ${pageData.platforms.join(", ")}\n\n`;
      }

      if (pageData.rating) {
        infoContent += `**Avaliação:** ${pageData.rating}\n\n`;
      }

      // Informações de status do jogo
      const statusInfo = [];
      if (pageData.played) statusInfo.push("Jogado");
      if (pageData.completed) statusInfo.push("Completado");
      if (pageData.playAgain) statusInfo.push("Jogar Novamente");

      if (statusInfo.length > 0) {
        infoContent += `**Status:** ${statusInfo.join(", ")}\n\n`;
      }

      // Adicionar informações básicas como um bloco de parágrafo
      if (infoContent) {
        children.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: truncateText(infoContent, 2000)
                }
              }
            ]
          }
        });
      }

      // Adicionar conteúdo principal como um bloco separado
      if (pageData.content) {
        children.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: truncateText(pageData.content, 2000)
                }
              }
            ]
          }
        });
      }

      const notionPayload = {
        parent: { database_id: notionDatabaseId },
        properties: properties,
        children: children
      };

      // Configurar a requisição para a API do Notion
      // Adicionar timeout para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

      fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + notionApiKey,
          "Content-Type": "application/json",
          "Notion-Version": "2022-02-22"
        },
        body: JSON.stringify(notionPayload),
        signal: controller.signal
      })
        .then(response => {
          // Limpar o timeout quando a resposta é recebida
          clearTimeout(timeoutId);

          // Primeiro verificamos se a resposta é válida
          if (!response.ok) {
            // Se o status não for 2xx, extraímos o erro
            return response.json().then(errorData => {
              throw {
                status: response.status,
                statusText: response.statusText,
                data: errorData
              };
            });
          }
          return response.json();
        })
        .then(data => {
          console.log("Dados enviados com sucesso ao Notion.", data);
          sendResponse({ success: true });
        })
        .catch(error => {
          // Limpar o timeout em caso de erro
          clearTimeout(timeoutId);

          // Melhor tratamento de erros com mensagens mais detalhadas
          console.error("Erro na requisição ao Notion:", error);

          let errorMessage = "Erro desconhecido ao enviar para o Notion.";

          // Verificar se é um erro de timeout/abort
          if (error.name === "AbortError") {
            errorMessage = "Tempo limite excedido ao conectar com o Notion.";
          }
          // Extrair mensagem de erro mais específica
          else if (error.data && error.data.message) {
            errorMessage = `Erro ${error.status || ''}: ${error.data.message}`;
          } else if (error.message) {
            errorMessage = error.message;
          }

          sendResponse({
            success: false,
            error: errorMessage,
            details: error
          });
        });
    });

    // Indica que queremos enviar a resposta de forma assíncrona
    return true;
  }
});
