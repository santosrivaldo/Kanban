# Módulo de documentação – Kanban Sprint

Este módulo centraliza toda a documentação do projeto.

## Conteúdo

| Arquivo | Descrição |
|---------|-----------|
| [README.md](README.md) | Este índice – visão geral do módulo de documentação |
| [API.md](API.md) | Referência da API (autenticação, endpoints, exemplos). **Para integração e agents** |
| [USO.md](USO.md) | Guia de uso do aplicativo (token, board, tarefas, timeline) |

## Uso

- **Desenvolvedores / Agents:** use [API.md](API.md) para integrar com a API (X-Token, rotas, payloads).
- **Usuários finais:** use [USO.md](USO.md) para aprender a usar o Kanban no navegador.
- **Estrutura do projeto:** descrita em API.md (seção "Estrutura do projeto").

## Acesso pela aplicação

Com o servidor rodando, a documentação pode ser acessada em:

- **Página de documentação:** `http://localhost:3000/docs.html`
- **API (conteúdo em Markdown):** `GET /api/docs/:name` (nome: `README`, `API` ou `USO`), sem necessidade de X-Token.

Exemplo:

```http
GET /api/docs/API
```

Retorna o conteúdo de `docs/API.md` em texto (Content-Type: text/markdown).
