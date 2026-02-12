# Kanban Sprint

Kanban para acompanhamento de fluxo de sprint, com API protegida por **X-Token**.

## Como rodar

```bash
npm install
cp .env.example .env
npm start
```

Acesse: **http://localhost:3000**

O arquivo **.env** define os tokens aceitos pela API. Copie `.env.example` para `.env` e edite se quiser outro token. O `.env` não vai para o repositório (está no `.gitignore`).

### Rodar com Docker

```bash
# Com token padrão (sprint-token-2025)
docker compose up --build

# Com seu token: crie .env com X_TOKENS=seu-token ou:
X_TOKENS=meu-token docker compose up --build
```

Acesse **http://localhost:3000**. A imagem usa Node 20 Alpine; o token é passado pela variável `X_TOKENS` (no `.env` ou no ambiente).

## Autenticação (X-Token)

Todas as rotas da API (exceto `GET /api/health` e `GET /api/docs/:name`) exigem o header:

```
X-Token: <seu-token>
```

Os tokens válidos vêm da variável **X_TOKENS** no `.env` (ou no ambiente). Vários tokens: separados por vírgula.

Exemplo no `.env`:

```
X_TOKENS=sprint-token-2025
# ou vários: X_TOKENS=token1,token2,token3
```

No frontend, informe um desses tokens no campo do cabeçalho e clique em **Salvar**. O token fica armazenado no navegador (localStorage).

## Fluxo do board (Sprint)

- **Backlog** – itens planejados  
- **A fazer** – próximos da fila  
- **Em progresso** – em desenvolvimento  
- **Em revisão** – revisão de código / QA  
- **Concluído** – finalizados  

Você pode **arrastar** os cards entre colunas e **editar** com duplo clique.

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check (sem token) |
| GET | `/api/board` | Dados do board |
| GET | `/api/board/columns` | Lista de colunas |
| GET | `/api/columns/:columnId/cards` | Cards da coluna |
| POST | `/api/cards` | Criar card (`body`: columnId, title, description?, assignee?, priority?) |
| PATCH | `/api/cards/:cardId/move` | Mover card (`body`: columnId, order?) |
| PATCH | `/api/cards/:cardId` | Atualizar card (title, description, assignee, priority) |
| DELETE | `/api/cards/:cardId` | Remover card |

Exemplo com `curl`:

```bash
curl -H "X-Token: sprint-token-2025" http://localhost:3000/api/board/columns
```

## Documentação

O projeto inclui um **módulo de documentação** em `docs/`:

- **docs/README.md** – Índice do módulo
- **docs/API.md** – Referência da API (para integração e agents)
- **docs/USO.md** – Guia de uso do aplicativo

Na aplicação, acesse **Documentação** no menu ou `http://localhost:3000/docs.html`. A API expõe o conteúdo em Markdown em `GET /api/docs/:name` (nome: `README`, `API` ou `USO`), sem necessidade de token.

## Banco de dados

Os dados (boards, colunas, cards, pessoas, timeline) são gravados no arquivo **data/db.json**. Ao iniciar, o servidor carrega esse arquivo; se não existir, usa os dados iniciais e cria o arquivo na primeira alteração. A pasta `data/` está no `.gitignore`.

## Tecnologias

- **Backend:** Node.js, Express
- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Persistência:** arquivo JSON em `data/db.json`
