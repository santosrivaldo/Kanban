import { store } from '../store.js';

function getAgent(req) {
  return (req.headers['x-agent'] || 'Web').trim() || 'Web';
}

export function registerKanbanRoutes(app) {
  const boardId = 'board-1';

  // Timeline (atividades por agente)
  app.get('/api/timeline', (req, res) => {
    const agent = req.query.agent;
    const events = store.getTimeline(agent);
    res.json(events);
  });

  // Board (sprint)
  app.get('/api/board', (req, res) => {
    const board = store.getBoard(boardId);
    if (!board) return res.status(404).json({ error: 'Board não encontrado' });
    res.json(board);
  });

  // Colunas do board
  app.get('/api/board/columns', (req, res) => {
    const columns = store.getColumns(boardId);
    res.json(columns);
  });

  // Cards de uma coluna
  app.get('/api/columns/:columnId/cards', (req, res) => {
    const cards = store.getCards(req.params.columnId);
    res.json(cards);
  });

  // Criar card
  app.post('/api/cards', (req, res) => {
    const { columnId, title, description, assignee, priority } = req.body || {};
    if (!columnId || !title) {
      return res.status(400).json({ error: 'columnId e title são obrigatórios' });
    }
    const card = store.addCard({
      columnId,
      title: title.trim(),
      description: description || '',
      assignee: assignee || '',
      priority: priority || 'medium',
    });
    const agent = getAgent(req);
    store.addEvent({
      type: 'card_created',
      agent,
      cardId: card.id,
      cardTitle: card.title,
      columnId,
      columnTitle: store.getColumn(columnId)?.title,
    });
    res.status(201).json(card);
  });

  // Mover card (atualizar coluna)
  app.patch('/api/cards/:cardId/move', (req, res) => {
    const { cardId } = req.params;
    const { columnId, order } = req.body || {};
    if (!columnId) {
      return res.status(400).json({ error: 'columnId é obrigatório' });
    }
    const card = store.getCard(cardId);
    if (!card) return res.status(404).json({ error: 'Card não encontrado' });
    const fromColumnId = card.columnId;
    store.moveCard(cardId, columnId, order ?? 0);
    const updated = store.getCard(cardId);
    const agent = getAgent(req);
    store.addEvent({
      type: 'card_moved',
      agent,
      cardId,
      cardTitle: updated.title,
      fromColumnId,
      toColumnId: columnId,
      fromColumnTitle: store.getColumn(fromColumnId)?.title,
      toColumnTitle: store.getColumn(columnId)?.title,
    });
    res.json(updated);
  });

  // Atualizar card
  app.patch('/api/cards/:cardId', (req, res) => {
    const card = store.updateCard(req.params.cardId, req.body || {});
    if (!card) return res.status(404).json({ error: 'Card não encontrado' });
    const agent = getAgent(req);
    store.addEvent({
      type: 'card_updated',
      agent,
      cardId: card.id,
      cardTitle: card.title,
      columnId: card.columnId,
      columnTitle: store.getColumn(card.columnId)?.title,
    });
    res.json(card);
  });

  // Remover card
  app.delete('/api/cards/:cardId', (req, res) => {
    const card = store.getCard(req.params.cardId);
    if (!card) return res.status(404).json({ error: 'Card não encontrado' });
    const agent = getAgent(req);
    store.addEvent({
      type: 'card_deleted',
      agent,
      cardId: card.id,
      cardTitle: card.title,
      columnId: card.columnId,
      columnTitle: store.getColumn(card.columnId)?.title,
    });
    store.deleteCard(card.id);
    res.status(204).send();
  });
}
