/**
 * Store em memória para boards, colunas e cards.
 * Persistência opcional em JSON pode ser adicionada depois.
 */
let data = {
  boards: [
    {
      id: 'board-1',
      name: 'Sprint Atual',
      createdAt: new Date().toISOString(),
    },
  ],
  columns: [
    { id: 'col-backlog', boardId: 'board-1', title: 'Backlog', order: 0 },
    { id: 'col-todo', boardId: 'board-1', title: 'A fazer', order: 1 },
    { id: 'col-progress', boardId: 'board-1', title: 'Em progresso', order: 2 },
    { id: 'col-review', boardId: 'board-1', title: 'Em revisão', order: 3 },
    { id: 'col-done', boardId: 'board-1', title: 'Concluído', order: 4 },
  ],
  events: [],
  cards: [
    {
      id: 'card-1',
      columnId: 'col-todo',
      title: 'Configurar ambiente',
      description: 'Setup do projeto e CI/CD',
      assignee: '',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      order: 0,
    },
    {
      id: 'card-2',
      columnId: 'col-progress',
      title: 'API de autenticação',
      description: 'Implementar x-token e rotas protegidas',
      assignee: '',
      priority: 'high',
      createdAt: new Date().toISOString(),
      order: 0,
    },
    {
      id: 'card-3',
      columnId: 'col-backlog',
      title: 'Testes E2E',
      description: 'Cobertura de fluxo completo',
      assignee: '',
      priority: 'low',
      createdAt: new Date().toISOString(),
      order: 1,
    },
  ],
};

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const store = {
  getBoard(id) {
    return data.boards.find((b) => b.id === id) ?? null;
  },
  getBoards() {
    return [...data.boards];
  },
  getColumns(boardId) {
    return data.columns.filter((c) => c.boardId === boardId).sort((a, b) => a.order - b.order);
  },
  getCards(columnId) {
    return data.cards.filter((c) => c.columnId === columnId).sort((a, b) => a.order - b.order);
  },
  getCard(cardId) {
    return data.cards.find((c) => c.id === cardId) ?? null;
  },
  getColumn(columnId) {
    return data.columns.find((c) => c.id === columnId) ?? null;
  },
  addEvent(payload) {
    const ev = {
      id: `ev-${id()}`,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    data.events.push(ev);
    return ev;
  },
  getTimeline(agentFilter) {
    let list = [...data.events];
    if (agentFilter && agentFilter.trim()) {
      const a = agentFilter.trim().toLowerCase();
      list = list.filter((e) => (e.agent || '').toLowerCase() === a);
    }
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
  addCard({ columnId, title, description = '', assignee = '', priority = 'medium' }) {
    const card = {
      id: `card-${id()}`,
      columnId,
      title,
      description,
      assignee,
      priority,
      createdAt: new Date().toISOString(),
      order: data.cards.filter((c) => c.columnId === columnId).length,
    };
    data.cards.push(card);
    return card;
  },
  moveCard(cardId, columnId, order = 0) {
    const card = data.cards.find((c) => c.id === cardId);
    if (!card) return null;
    card.columnId = columnId;
    card.order = order;
    return card;
  },
  updateCard(cardId, updates) {
    const card = data.cards.find((c) => c.id === cardId);
    if (!card) return null;
    const allowed = ['title', 'description', 'assignee', 'priority'];
    allowed.forEach((k) => {
      if (updates[k] !== undefined) card[k] = updates[k];
    });
    return card;
  },
  deleteCard(cardId) {
    const i = data.cards.findIndex((c) => c.id === cardId);
    if (i === -1) return false;
    data.cards.splice(i, 1);
    return true;
  },
};
