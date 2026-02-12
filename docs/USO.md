# Guia de uso – Kanban Sprint

Como usar o aplicativo Kanban para acompanhar o fluxo da sprint.

---

## 1. Acesso e token

1. Abra o aplicativo em **http://localhost:3000** (com o servidor rodando).
2. No topo da página, no campo **X-Token**, digite o token de acesso.
   - Token padrão: `sprint-token-2025`
3. Clique em **Salvar**.
4. O token fica guardado no navegador (localStorage). O board será carregado automaticamente.

Se aparecer mensagem de token inválido ou expirado, informe o token novamente e salve.

---

## 2. Colunas do board (fluxo da sprint)

As colunas representam o fluxo da sprint:

| Coluna          | Uso typical                          |
|-----------------|--------------------------------------|
| **Backlog**     | Itens planejados para a sprint      |
| **A fazer**     | Próximos da fila                    |
| **Em progresso**| Em desenvolvimento                  |
| **Em revisão**  | Revisão de código ou QA             |
| **Concluído**   | Finalizados                         |

---

## 3. Tarefas (cards)

- **Criar:** clique em **Nova tarefa**. Preencha título (obrigatório), descrição, responsável e prioridade. A tarefa será criada na primeira coluna; você pode movê-la depois.
- **Mover:** arraste o card e solte na coluna desejada.
- **Editar:** dê dois cliques no card. Altere título, descrição, responsável ou prioridade e salve.
- **Prioridades:** Baixa, Média, Alta (indicadas por cor no card).

---

## 4. Timeline (o que cada agente fez)

- Acesse **Timeline** no menu para ver a linha do tempo de atividades.
- Cada ação (criar, mover, editar ou remover tarefa) é registrada com o **agente** que a fez.
- O agente é definido por quem chama a API: envie o header **X-Agent** nas requisições. Quem usar o navegador sem enviar X-Agent aparece como "Web".
- Na Timeline, use **Filtrar por agente** para ver apenas as ações de um agente.

## 5. Documentação e API

- **Página de documentação:** em **Documentação** no menu (ou **http://localhost:3000/docs.html**) você acessa o índice e os guias (uso e API).
- Para integrar sistemas ou scripts, use a referência em **API** na documentação; todas as rotas protegidas exigem o header `X-Token`.

---

## 6. Comandos do projeto

Na pasta do projeto:

- `npm install` – instalar dependências (uma vez).
- `npm start` – subir o servidor.
- `npm run dev` – subir com reinício automático ao editar o código.

Os dados do board são mantidos em memória; ao reiniciar o servidor, o board volta ao estado inicial de exemplo.
