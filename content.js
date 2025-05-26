// contentScript.js - Executado em páginas de jogos da Steam

// Função para criar e inserir o botão flutuante na página
function createFloatingButton() {
  const btn = document.createElement("button");
  btn.id = "steam-notion-button";
  btn.textContent = "Salvar no Notion";
  document.body.appendChild(btn);

  // Trata o clique no botão flutuante
  btn.addEventListener("click", () => {
    // Ao clicar, coletar informações da página
    const pageData = scrapeSteamGamePage();
    if (!pageData.title) {
      // Se não conseguir obter título, aborta e avisa
      showToast("Falha ao coletar dados do jogo.");
      return;
    }

    // Enviar os dados para o background script solicitar ao Notion
    chrome.runtime.sendMessage({ action: "sendToNotion", pageData: pageData }, (response) => {
      if (response && response.success) {
        showToast("✔ Jogo enviado ao Notion com sucesso!");
      } else {
        showToast("❌ Erro ao enviar dados para o Notion.");
      }
    });
  });
}

// Função para exibir um toast (feedback visual) na página
function showToast(message) {
  // Remover toast existente, se houver, para evitar acumular
  const oldToast = document.getElementById("steam-notion-toast");
  if (oldToast) {
    oldToast.remove();
  }
  // Criar elemento de toast
  const toast = document.createElement("div");
  toast.id = "steam-notion-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  // Remover automaticamente após 3 segundos
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

// Função principal que extrai os dados da página do jogo na Steam
function scrapeSteamGamePage() {
  const data = {
    title: "",
    slug: "",
    content: "",
    releaseDate: "",
    description: "",
    genres: [],
    platforms: [],
    image: "",
    rating: 0,
    completed: false,
    playAgain: false,
    played: false
  };

  const bodyText = document.body.innerText || "";

  // Extrair título do jogo (após "Title:")
  const titleMatch = bodyText.match(/Title:\s*([^\n]+)/);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
  } else {
    // Como fallback, tentar extrair título a partir do elemento de título da página
    const titleElem = document.querySelector("div#appHubAppName" /* caso exista id appHubAppName */)
                     || document.querySelector("div.apphub_AppName");
    if (titleElem) {
      data.title = titleElem.innerText.trim();
    }
  }

  // Gerar slug (versão kebab-case do título)
  if (data.title) {
    data.slug = data.title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // remover acentuação
      .replace(/[^a-z0-9]+/g, "-")                        // substituir não-alfanum por "-"
      .replace(/(^-|-$)/g, "");                           // remover "-" do início/fim
  }

  // Extrair data de lançamento (após "Release Date:")
  const releaseMatch = bodyText.match(/Release Date:\s*([^\n]+)/);
  if (releaseMatch) {
    data.releaseDate = releaseMatch[1].trim();
  }

  // Extrair descrição curta (texto logo após a data de lançamento, antes de "Recent Reviews")
  let desc = "";
  const reviewsIndex = bodyText.indexOf("Recent Reviews:");
  if (reviewsIndex !== -1 && releaseMatch) {
    // Pega o texto entre o fim da linha de releaseDate e o início de "Recent Reviews"
    const relIdx = bodyText.indexOf(releaseMatch[0]);
    if (relIdx !== -1) {
      const afterRelease = bodyText.indexOf("\n", relIdx); // fim da linha de Release Date
      if (afterRelease !== -1) {
        desc = bodyText.substring(afterRelease, reviewsIndex).trim();
      }
    }
  }
  data.description = desc;

  // Extrair conteúdo principal (seção "About This Game")
  const aboutIndex = bodyText.indexOf("About This Game");
  if (aboutIndex !== -1) {
    // Captura do final do título "About This Game" até antes de "System Requirements" ou outra seção
    let contentStart = aboutIndex + "About This Game".length;
    // Pular possíveis caracteres de nova linha imediatamente após o título
    if (bodyText[contentStart] === '\r' || bodyText[contentStart] === '\n') {
      contentStart++;
    }
    // Determinar onde termina o conteúdo (antes de requisitos do sistema ou resenhas de curadores)
    let contentEnd = bodyText.indexOf("System Requirements", contentStart);
    if (contentEnd === -1) contentEnd = bodyText.indexOf("What Curators Say", contentStart);
    if (contentEnd === -1) contentEnd = bodyText.indexOf("Customer reviews", contentStart);
    if (contentEnd === -1) contentEnd = bodyText.length;
    data.content = bodyText.substring(contentStart, contentEnd).trim();
  }

  // Extrair gêneros (após "Genre:")
  const genreMatch = bodyText.match(/Genre:\s*([^\n]+)/);
  if (genreMatch) {
    const genresLine = genreMatch[1].trim();
    if (genresLine) {
      // Separar por vírgulas e remover espaços
      data.genres = genresLine.split(",").map(g => g.trim()).filter(g => g);
    }
  }

  // Extrair plataformas disponíveis (Windows, macOS, Linux)
  // Verifica presença de seções específicas das plataformas nos requisitos do sistema
  if (bodyText.includes("SteamOS + Linux")) {
    data.platforms.push("Linux");
  }
  if (bodyText.includes("macOS")) {
    data.platforms.push("macOS");
  }
  if (bodyText.includes("Windows")) {
    data.platforms.push("Windows");
  }

  // Extrair URL da imagem de capa do jogo (banner/header)
  const headerImg = document.querySelector('img[src*="header.jpg"]');
  if (headerImg) {
    data.image = headerImg.src;
  } else {
    // Tentar meta tag Open Graph (caso exista)
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      data.image = ogImage.content;
    }
  }

  // Extrair nota/avaliação (por exemplo, nota do Metacritic se disponível)
  data.rating = 0;
  const mcIndex = bodyText.indexOf("metacritic");
  if (mcIndex !== -1) {
    // Pegar o número imediatamente antes da palavra "metacritic"
    const beforeText = bodyText.substring(0, mcIndex).trim();
    const parts = beforeText.split(/[\s\n]+/);
    const lastToken = parts[parts.length - 1];
    if (lastToken && /^\d+$/.test(lastToken)) {
      data.rating = parseInt(lastToken, 10);
    }
  }
  // Se não houver nota identificada, manter 0 (ou poderia ser "n/a" se necessário)

  return data;
}

// Obter configuração para saber se deve mostrar o botão flutuante
chrome.storage.local.get({ enableFloatingButton: true }, (res) => {
  if (res.enableFloatingButton) {
    // Inserir botão flutuante na página do jogo
    createFloatingButton();
  }
});
