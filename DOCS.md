# Documentação do Kanban Sprint (para Agent)

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

## 3. API – Endpoints

### 3.1 Health check (público)

```
GET /api/health
```
- **Auth:** não
- **Resposta 200:** `{ "ok": true, "message": "API Kanban Sprint" }`

---

### 3.2 Board

```
GET /api/board
```
- **Auth:** sim (X-Token)
- **Resposta 200:** objeto do board  
  - `id` (string), `name` (string), `createdAt` (string ISO)
- **Resposta 404:** `{ "error": "Board não encontrado" }`

---

### 3.3 Colunas do board

```
GET /api/board/columns
```
- **Auth:** sim
- **Resposta 200:** array de colunas, cada uma com:
  - `id` (string), `boardId` (string), `title` (string), `order` (number)
- IDs fixos do board atual: `col-backlog`, `col-todo`, `col-progress`, `col-review`, `col-done`

---

### 3.4 Cards de uma coluna

```
GET /api/columns/:columnId/cards
```
- **Auth:** sim
- **Parâmetro:** `columnId` – ID da coluna
- **Resposta 200:** array de cards, cada um com:
  - `id`, `columnId`, `title`, `description`, `assignee`, `priority`, `createdAt`, `order`
- `priority`: `"low"` | `"medium"` | `"high"`

---

### 3.5 Criar card

```
POST /api/cards
```
- **Auth:** sim
- **Body (JSON):**
  - `columnId` (string) – obrigatório
  - `title` (string) – obrigatório
  - `description` (string) – opcional, default `""`
  - `assignee` (string) – opcional, default `""`
  - `priority` (string) – opcional, `"low"` | `"medium"` | `"high"`, default `"medium"`
- **Resposta 201:** objeto do card criado (mesmo formato do GET de cards)
- **Resposta 400:** `{ "error": "columnId e title são obrigatórios" }`

---

### 3.6 Mover card

```
PATCH /api/cards/:cardId/move
```
- **Auth:** sim
- **Parâmetro:** `cardId` – ID do card
- **Body (JSON):**
  - `columnId` (string) – obrigatório
  - `order` (number) – opcional, default `0`
- **Resposta 200:** objeto do card atualizado
- **Resposta 400:** `{ "error": "columnId é obrigatório" }`
- **Resposta 404:** `{ "error": "Card não encontrado" }`

---

### 3.7 Atualizar card

```
PATCH /api/cards/:cardId
```
- **Auth:** sim
- **Parâmetro:** `cardId` – ID do card
- **Body (JSON):** qualquer subconjunto de:
  - `title` (string), `description` (string), `assignee` (string), `priority` (string)
- **Resposta 200:** objeto do card atualizado
- **Resposta 404:** `{ "error": "Card não encontrado" }`

---

### 3.8 Remover card

```
DELETE /api/cards/:cardId
```
- **Auth:** sim
- **Parâmetro:** `cardId` – ID do card
- **Resposta 204:** sem corpo
- **Resposta 404:** `{ "error": "Card não encontrado" }`

---

## 4. Estrutura do projeto

```
Kanban/
├── api/
│   ├── middleware/
│   │   └── auth.js          # requireXToken(req, res, next)
│   ├── routes/
│   │   └── kanban.js        # registerKanbanRoutes(app)
│   └── store.js             # store em memória (boards, columns, cards)
├── public/
│   ├── index.html           # SPA do Kanban
│   ├── styles.css
│   └── app.js               # chamadas à API com X-Token no header
├── server.js                # Express, CORS, static, rotas
├── package.json             # type: "module", scripts: start, dev
├── README.md
├── docs/                    # Módulo de documentação
│   ├── README.md            # Índice do módulo
│   ├── API.md               # Referência da API
│   └── USO.md               # Guia de uso
└── DOCS.md                  # Esta documentação (cópia para agent)
```

- **Board fixo:** apenas um board, `id: "board-1"` (definido em `api/routes/kanban.js`).
- **Store:** `api/store.js` – dados em memória; reiniciar o servidor zera boards/columns/cards (valores iniciais vêm do objeto `data` em `store.js`).

---

## 5. Exemplos de requisição (para agent)

- Health:
  ```http
  GET /api/health
  ```
- Board (com token):
  ```http
  GET /api/board
  X-Token: sprint-token-2025
  ```
- Colunas:
  ```http
  GET /api/board/columns
  X-Token: sprint-token-2025
  ```
- Cards de uma coluna:
  ```http
  GET /api/columns/col-todo/cards
  X-Token: sprint-token-2025
  ```
- Criar card:
  ```http
  POST /api/cards
  Content-Type: application/json
  X-Token: sprint-token-2025

  {"columnId":"col-backlog","title":"Nova tarefa","priority":"high"}
  ```
- Mover card:
  ```http
  PATCH /api/cards/card-1/move
  Content-Type: application/json
  X-Token: sprint-token-2025

  {"columnId":"col-progress","order":0}
  ```

---

## 6. Comandos

- Instalar: `npm install`
- Rodar: `npm start` (porta padrão 3000)
- Desenvolvimento: `npm run dev` (watch no `server.js`)

Use esta documentação para integrar, testar ou estender o Kanban via API com X-Token.
