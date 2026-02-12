# Referência da API – Kanban Sprint

Projeto: Kanban para acompanhamento de fluxo de sprint. Backend Express com autenticação por header **X-Token**; frontend estático em `public/`.

---

## 1. Autenticação

- **Header obrigatório:** `X-Token: <token>`
- Rotas que exigem token: todas em `/api/board`, `/api/columns`, `/api/cards`
- Rota **sem** token: `GET /api/health`
- Token padrão: `sprint-token-2025`
- Múltiplos tokens: variável de ambiente `X_TOKENS` (lista separada por vírgula). Ex.: `X_TOKENS=token1,token2`
- Respostas de erro:
  - **401**: header `X-Token` ausente → `{ "error": "Token obrigatório. Envie o header X-Token." }`
  - **403**: token inválido → `{ "error": "Token inválido." }`

---

## 2. Base URL e conteúdo

- Base: `http://localhost:3000` (ou `process.env.PORT`)
- Requisições com corpo: `Content-Type: application/json`
- Todas as respostas JSON (exceto 204) são objetos ou arrays.

---

## 3. Endpoints

### 3.1 Health check (público)

```
GET /api/health
```
- **Auth:** não
- **Resposta 200:** `{ "ok": true, "message": "API Kanban Sprint" }`

### 3.2 Board

```
GET /api/board
```
- **Auth:** sim (X-Token)
- **Resposta 200:** objeto com `id`, `name`, `createdAt`
- **Resposta 404:** `{ "error": "Board não encontrado" }`

### 3.3 Colunas do board

```
GET /api/board/columns
```
- **Auth:** sim
- **Resposta 200:** array de colunas (`id`, `boardId`, `title`, `order`)
- IDs: `col-backlog`, `col-todo`, `col-progress`, `col-review`, `col-done`

### 3.4 Cards de uma coluna

```
GET /api/columns/:columnId/cards
```
- **Auth:** sim
- **Resposta 200:** array de cards (`id`, `columnId`, `title`, `description`, `assignee`, `priority`, `createdAt`, `order`)
- `priority`: `"low"` | `"medium"` | `"high"`

### 3.5 Criar card

```
POST /api/cards
```
- **Auth:** sim
- **Body:** `columnId` (obrigatório), `title` (obrigatório), `description`, `assignee`, `priority` (opcionais)
- **Resposta 201:** objeto do card criado
- **Resposta 400:** `{ "error": "columnId e title são obrigatórios" }`

### 3.6 Mover card

```
PATCH /api/cards/:cardId/move
```
- **Auth:** sim
- **Body:** `columnId` (obrigatório), `order` (opcional)
- **Resposta 200:** card atualizado | **404:** card não encontrado

### 3.7 Atualizar card

```
PATCH /api/cards/:cardId
```
- **Auth:** sim
- **Body:** `title`, `description`, `assignee`, `priority` (qualquer subconjunto)
- **Resposta 200:** card atualizado | **404:** card não encontrado

### 3.8 Timeline (atividades por agente)

```
GET /api/timeline?agent=<nome>
```
- **Auth:** sim
- **Query:** `agent` (opcional) – filtra por nome do agente
- **Resposta 200:** array de eventos, cada um com: `id`, `type` (`card_created` | `card_moved` | `card_updated` | `card_deleted`), `agent`, `cardId`, `cardTitle`, `columnId`, `columnTitle`, `fromColumnId`, `toColumnId`, `fromColumnTitle`, `toColumnTitle` (conforme o tipo), `timestamp` (ISO)

As ações de criar, mover, editar e remover cards registram o header **X-Agent** (opcional); se não enviado, usa-se `"Web"`.

### 3.9 Remover card

```
DELETE /api/cards/:cardId
```
- **Auth:** sim
- **Resposta 204:** sem corpo | **404:** card não encontrado

---

## 4. Estrutura do projeto

```
Kanban/
├── api/
│   ├── middleware/auth.js
│   ├── routes/kanban.js
│   └── store.js
├── docs/                    # Módulo de documentação
│   ├── README.md
│   ├── API.md
│   └── USO.md
├── public/
│   ├── index.html
│   ├── docs.html
│   ├── styles.css
│   └── app.js
├── server.js
├── package.json
├── README.md
└── DOCS.md
```

- Board fixo: `id: "board-1"`. Dados em memória em `api/store.js`.

---

## 5. Exemplos (agent)

```http
GET /api/health
```

```http
GET /api/board
X-Token: sprint-token-2025
```

```http
POST /api/cards
Content-Type: application/json
X-Token: sprint-token-2025

{"columnId":"col-backlog","title":"Nova tarefa","priority":"high"}
```

```http
PATCH /api/cards/<cardId>/move
Content-Type: application/json
X-Token: sprint-token-2025

{"columnId":"col-progress","order":0}
```

---

## 6. Comandos

- `npm install` – instalar dependências
- `npm start` – rodar servidor (porta 3000)
- `npm run dev` – rodar com watch
