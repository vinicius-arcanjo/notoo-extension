# Notoo - Notion Web Clipper Extension

Notoo é uma extensão para navegadores que permite capturar dados de páginas web e enviá-los diretamente para seus bancos de dados no Notion. Prático, rápido e integrado ao seu fluxo de trabalho.

![Notoo Logo](assets/icons/icon128.png)

## Funcionalidades

- Captura dados de jogos da Steam e salva em seu banco de dados do Notion
- Suporte planejado para filmes e produtos
- Botão flutuante para salvar com um clique
- Configuração simples da API do Notion
- Personalização de bancos de dados para diferentes tipos de conteúdo

## Dados Capturados

### Jogos (Steam)
- Título
- Data de lançamento
- Descrição
- Imagem
- Preço
- Gêneros
- Plataformas
- Slug (para identificação fácil)
- Campos adicionais para gerenciamento pessoal (jogado, completado, jogar novamente, avaliação)

## Instalação

1. Faça o download ou clone este repositório
2. Abra o Chrome e navegue até `chrome://extensions/`
3. Ative o "Modo do desenvolvedor" no canto superior direito
4. Clique em "Carregar sem compactação" e selecione a pasta do projeto
5. A extensão Notoo agora está instalada e pronta para configuração

## Configuração

1. Clique no ícone da extensão Notoo na barra de ferramentas do navegador
2. Obtenha um token de API do Notion em [notion.so/my-integrations](https://www.notion.so/my-integrations)
3. Crie bancos de dados no Notion para jogos, filmes e/ou produtos
4. Copie os IDs dos bancos de dados das URLs do Notion
5. Insira o token da API e os IDs dos bancos de dados na extensão
6. Salve as configurações

## Como Usar

1. Navegue até uma página de jogo na Steam
2. Clique no botão flutuante "N" que aparece na página
3. Os dados do jogo serão extraídos e enviados para seu banco de dados no Notion
4. Verifique seu banco de dados no Notion para ver os dados capturados

## Requisitos

- Navegador baseado em Chromium (Chrome, Edge, Brave, etc.)
- Conta no Notion com permissões para criar integrações
- Bancos de dados no Notion configurados com os campos apropriados

## Estrutura do Projeto

- `assets/`: Ícones e recursos visuais
- `background/`: Scripts de fundo da extensão
- `content/`: Scripts de conteúdo injetados nas páginas
- `databases/`: Lógica específica para cada tipo de banco de dados
- `lib/`: Bibliotecas e utilitários
- `options/`: Página de opções avançadas
- `popup/`: Interface do popup da extensão
- `styles/`: Estilos globais
- `utils/`: Funções utilitárias

## Suporte a Idiomas

A extensão atualmente suporta datas em vários idiomas, incluindo:
- Português
- Inglês
- Espanhol
- Francês
- Alemão
- Italiano

## Desenvolvimento Futuro

- Suporte para mais sites de jogos (Epic Games, GOG, etc.)
- Implementação completa para filmes e produtos
- Personalização adicional de campos
- Suporte para mais idiomas
- Melhorias na interface do usuário

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto é distribuído sob a licença MIT.
