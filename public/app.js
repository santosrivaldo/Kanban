const API_BASE = '';
const TOKEN_KEY = 'kanban-x-token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'X-Token': token }),
    ...options.headers,
  };
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    setToken('');
    showTokenScreen();
    showToast('Token inválido ou expirado. Informe o token novamente.', false);
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Erro ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function showToast(message, isSuccess = false) {
  const el = document.getElementById('error-toast');
  el.textContent = message;
  el.classList.remove('hidden', 'success');
  if (isSuccess) el.classList.add('success');
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function showTokenScreen() {
  stopBoardRefresh();
  document.getElementById('token-screen').classList.remove('hidden');
  document.getElementById('views').classList.add('hidden');
}

let currentView = 'board';
const BOARD_REFRESH_MS = 10000; // 10 segundos
let refreshIntervalId = null;

function startBoardRefresh() {
  stopBoardRefresh();
  refreshIntervalId = setInterval(() => {
    if (currentView !== 'board') return;
    refreshCardsOnly().catch(() => {});
    loadPeople().catch(() => {});
    loadTimeline().catch(() => {});
  }, BOARD_REFRESH_MS);
}

function stopBoardRefresh() {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
}

function showView(name) {
  currentView = name;
  document.getElementById('token-screen').classList.add('hidden');
  document.getElementById('views').classList.remove('hidden');

  document.querySelectorAll('.view-panel').forEach((panel) => {
    panel.hidden = true;
  });
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === name);
  });

  const panel = document.getElementById(`view-${name}`);
  if (panel) panel.hidden = false;

  if (name === 'board') {
    loadTimeline();
    startBoardRefresh();
  } else {
    stopBoardRefresh();
  }
  if (name === 'docs') loadDoc(document.querySelector('.doc-link.active')?.dataset.doc || 'README');
}

let peopleList = [];

async function loadPeople() {
  try {
    peopleList = await api('/api/people');
  } catch {
    peopleList = [];
  }
  renderPeopleList();
  fillAssigneeSelect();
}

function renderPeopleList() {
  const el = document.getElementById('people-list');
  const empty = document.getElementById('people-empty');
  if (!el) return;
  if (peopleList.length === 0) {
    el.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  el.innerHTML = peopleList.map((p) => `
    <div class="person-row ${p.online ? 'online' : ''}" title="${escapeHtml(p.name)} ${p.online ? '• online' : '• offline'}">
      <span class="person-dot"></span>
      <span class="person-name">${escapeHtml(p.name)}</span>
    </div>
  `).join('');
}

function fillAssigneeSelect() {
  const sel = document.getElementById('card-assignee');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Ninguém</option>' + peopleList.map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}${p.online ? ' ●' : ''}</option>`).join('');
  if (current && peopleList.some((p) => p.name === current)) sel.value = current;
}

async function loadBoard() {
  const [board, columns] = await Promise.all([
    api('/api/board'),
    api('/api/board/columns'),
  ]);
  await loadPeople();
  document.getElementById('board-name').textContent = board.name;
  const container = document.getElementById('columns');
  container.innerHTML = '';

  for (const col of columns) {
    const cards = await api(`/api/columns/${col.id}/cards`);
    const colEl = document.createElement('div');
    colEl.className = `column column-phase column-${col.id}`;
    colEl.dataset.columnId = col.id;
    colEl.innerHTML = `
      <div class="column-header">
        <span>${escapeHtml(col.title)}</span>
        <span class="count">${cards.length}</span>
      </div>
      <div class="column-cards" data-column-id="${col.id}"></div>
    `;
    const cardsContainer = colEl.querySelector('.column-cards');
    cards.forEach((card) => cardsContainer.appendChild(renderCard(card)));
    setupColumnDrop(colEl, cardsContainer);
    container.appendChild(colEl);
  }
  loadTimeline();
}

/** Atualiza apenas as tarefas (cards) e a lista de agentes/timeline, sem recarregar a tela. */
async function refreshCardsOnly() {
  const container = document.getElementById('columns');
  if (!container || !container.querySelector('.column')) return;
  const columns = await api('/api/board/columns');
  for (const col of columns) {
    const cards = await api(`/api/columns/${col.id}/cards`);
    const colEl = container.querySelector(`.column[data-column-id="${col.id}"]`);
    if (!colEl) continue;
    const header = colEl.querySelector('.column-header .count');
    if (header) header.textContent = cards.length;
    const cardsContainer = colEl.querySelector('.column-cards');
    if (!cardsContainer) continue;
    cardsContainer.innerHTML = '';
    cards.forEach((card) => cardsContainer.appendChild(renderCard(card)));
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s ?? '';
  return div.innerHTML;
}

function renderCard(card) {
  const div = document.createElement('div');
  div.className = 'card';
  div.draggable = true;
  div.dataset.cardId = card.id;
  div.innerHTML = `
    <div class="card-head">
      <p class="card-title">${escapeHtml(card.title)}</p>
      <button type="button" class="card-delete" aria-label="Excluir tarefa" title="Excluir">×</button>
    </div>
    <div class="card-meta">
      <span class="priority ${card.priority}">${card.priority}</span>
      ${card.assignee ? `<span>${escapeHtml(card.assignee)}</span>` : ''}
    </div>
  `;
  div.addEventListener('dragstart', onCardDragStart);
  div.addEventListener('dragend', onCardDragEnd);
  div.addEventListener('dblclick', () => openEditCard(card));
  div.querySelector('.card-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    deleteCard(card);
  });
  return div;
}

async function deleteCard(card) {
  if (!confirm(`Excluir a tarefa "${card.title}"?`)) return;
  try {
    await api(`/api/cards/${card.id}`, { method: 'DELETE' });
    await refreshCardsOnly();
    loadTimeline();
    showToast('Tarefa excluída.', true);
  } catch (err) {
    showToast(err.message, false);
  }
}

let draggedCardId = null;

function onCardDragStart(e) {
  if (e.target.closest('.card-delete')) {
    e.preventDefault();
    return;
  }
  const card = e.target.closest('.card');
  if (!card) return;
  draggedCardId = card.dataset.cardId;
  card.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedCardId);
}

function onCardDragEnd(e) {
  const card = e.target.closest('.card');
  if (card) card.classList.remove('dragging');
  document.querySelectorAll('.column-cards').forEach((c) => c.classList.remove('drag-over'));
  draggedCardId = null;
}

function setupColumnDrop(columnEl, cardsContainer) {
  cardsContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    cardsContainer.classList.add('drag-over');
  });
  cardsContainer.addEventListener('dragleave', () => cardsContainer.classList.remove('drag-over'));
  cardsContainer.addEventListener('drop', async (e) => {
    e.preventDefault();
    cardsContainer.classList.remove('drag-over');
    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId || cardId === draggedCardId) return;
    const columnId = cardsContainer.dataset.columnId;
    try {
      await api(`/api/cards/${cardId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ columnId, order: 0 }),
      });
      await refreshCardsOnly();
      loadTimeline();
      showToast('Tarefa movida.', true);
    } catch (err) {
      showToast(err.message, false);
    }
  });
}

const modal = document.getElementById('modal-card');
const form = document.getElementById('form-card');

function openNewCard(columnId) {
  fillAssigneeSelect();
  document.getElementById('modal-title').textContent = 'Nova tarefa';
  document.getElementById('card-id').value = '';
  document.getElementById('card-column-id').value = columnId || '';
  document.getElementById('card-title').value = '';
  document.getElementById('card-desc').value = '';
  document.getElementById('card-assignee').value = '';
  document.getElementById('card-priority').value = 'medium';
  const btnDelete = document.getElementById('btn-modal-delete');
  if (btnDelete) btnDelete.hidden = true;
  modal.showModal();
}

function openEditCard(card) {
  fillAssigneeSelect();
  document.getElementById('modal-title').textContent = 'Editar tarefa';
  document.getElementById('card-id').value = card.id;
  document.getElementById('card-column-id').value = card.columnId;
  document.getElementById('card-title').value = card.title;
  document.getElementById('card-desc').value = card.description || '';
  document.getElementById('card-assignee').value = card.assignee || '';
  document.getElementById('card-priority').value = card.priority || 'medium';
  const btnDelete = document.getElementById('btn-modal-delete');
  if (btnDelete) {
    btnDelete.hidden = false;
    btnDelete.onclick = () => {
      if (!confirm(`Excluir a tarefa "${card.title}"?`)) return;
      modal.close();
      api(`/api/cards/${card.id}`, { method: 'DELETE' })
        .then(() => loadBoard())
        .then(() => showToast('Tarefa excluída.', true))
        .catch((err) => showToast(err.message, false));
    };
  }
  modal.showModal();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('card-id').value;
  const columnId = document.getElementById('card-column-id').value;
  const title = document.getElementById('card-title').value.trim();
  const description = document.getElementById('card-desc').value.trim();
  const assignee = document.getElementById('card-assignee').value.trim();
  const priority = document.getElementById('card-priority').value;

  try {
    if (id) {
      await api(`/api/cards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, description, assignee, priority }),
      });
      showToast('Tarefa atualizada.', true);
    } else {
      const firstCol = document.querySelector('.column');
      const colId = columnId || firstCol?.dataset.columnId;
      if (!colId) {
        showToast('Selecione uma coluna.', false);
        return;
      }
      await api('/api/cards', {
        method: 'POST',
        body: JSON.stringify({ columnId: colId, title, description, assignee, priority }),
      });
      showToast('Tarefa criada.', true);
    }
    modal.close();
    await refreshCardsOnly();
    loadTimeline();
  } catch (err) {
    showToast(err.message, false);
  }
});

document.getElementById('btn-modal-cancel').addEventListener('click', () => modal.close());
document.getElementById('btn-new-card').addEventListener('click', () => openNewCard());

// —— Timeline ——
const TIMELINE_LABELS = {
  card_created: 'criou a tarefa',
  card_moved: 'moveu a tarefa',
  card_updated: 'atualizou a tarefa',
  card_deleted: 'removeu a tarefa',
};

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function timelineEventText(ev) {
  const title = escapeHtml(ev.cardTitle || 'Tarefa');
  switch (ev.type) {
    case 'card_created':
      return `"<strong>${title}</strong>" em ${ev.columnTitle || ev.columnId || ''}`;
    case 'card_moved':
      return `"<strong>${title}</strong>" de ${ev.fromColumnTitle || ev.fromColumnId || '?'} para ${ev.toColumnTitle || ev.toColumnId || '?'}`;
    case 'card_updated':
      return `"<strong>${title}</strong>" (${ev.columnTitle || ev.columnId || ''})`;
    case 'card_deleted':
      return `"<strong>${title}</strong>"`;
    default:
      return title;
  }
}

function renderTimeline(events) {
  const list = document.getElementById('timeline-list');
  const empty = document.getElementById('timeline-empty');
  if (!list || !empty) return;
  list.innerHTML = '';
  if (!events.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  events.forEach((ev) => {
    const item = document.createElement('div');
    item.className = `timeline-item ${ev.type}`;
    item.innerHTML = `
      <div class="timeline-time">${formatTime(ev.timestamp)}</div>
      <div class="timeline-agent">${escapeHtml(ev.agent || 'Web')}</div>
      <p class="timeline-text">${TIMELINE_LABELS[ev.type] || ev.type} ${timelineEventText(ev)}</p>
    `;
    list.appendChild(item);
  });
}

function updateTimelineAgentFilter(events) {
  const agents = [...new Set(events.map((e) => e.agent || 'Web').filter(Boolean))].sort();
  const sel = document.getElementById('filter-agent');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos os agentes</option>' + agents.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');
  if (agents.includes(current)) sel.value = current;
}

async function loadTimeline() {
  try {
    const all = await api('/api/timeline');
    updateTimelineAgentFilter(all);
    const sel = document.getElementById('filter-agent');
    const agent = sel ? sel.value : '';
    const events = agent ? all.filter((e) => (e.agent || 'Web').toLowerCase() === agent.toLowerCase()) : all;
    renderTimeline(events);
  } catch (err) {
    const list = document.getElementById('timeline-list');
    const empty = document.getElementById('timeline-empty');
    if (list) list.innerHTML = '';
    if (empty) {
      empty.textContent = 'Erro ao carregar. Verifique o token.';
      empty.classList.remove('hidden');
    }
  }
}

// —— Documentação ——
async function loadDoc(name) {
  const content = document.getElementById('docs-content');
  if (!content) return;
  document.querySelectorAll('.doc-link').forEach((a) => a.classList.toggle('active', a.dataset.doc === name));
  const res = await fetch(`/api/docs/${name}`);
  if (!res.ok) {
    content.innerHTML = '<p>Documento não encontrado.</p>';
    return;
  }
  const md = await res.text();
  content.innerHTML = typeof marked !== 'undefined' ? marked.parse(md) : `<pre>${escapeHtml(md)}</pre>`;
}

// —— Navegação (tabs) ——
document.querySelectorAll('.nav-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const view = tab.dataset.view;
    if (view === 'timeline') return; // timeline está no board
    showView(view);
    window.location.hash = view === 'board' ? '' : view;
  });
});

document.getElementById('filter-agent')?.addEventListener('change', () => loadTimeline());
document.getElementById('btn-timeline-refresh')?.addEventListener('click', () => loadTimeline());

document.querySelectorAll('.doc-link').forEach((link) => {
  link.addEventListener('click', () => loadDoc(link.dataset.doc));
});

// —— Token e init ——
document.getElementById('btn-save-token').addEventListener('click', () => {
  const input = document.getElementById('x-token');
  const token = input.value.trim();
  if (!token) {
    showToast('Informe o token.', false);
    return;
  }
  setToken(token);
  input.value = '';
  loadBoard()
    .then(() => showView('board'))
    .catch(() => {});
});

document.getElementById('x-token').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-save-token').click();
});

function applyHashView() {
  const hash = (window.location.hash || '').replace(/^#/, '');
  if (hash === 'docs') {
    showView('docs');
  } else {
    showView('board');
  }
}

(function init() {
  const token = getToken();
  const input = document.getElementById('x-token');
  if (token) {
    input.placeholder = '••••••••';
    document.getElementById('views').classList.remove('hidden');
    document.getElementById('token-screen').classList.add('hidden');
    loadBoard()
      .then(() => applyHashView())
      .catch(() => showTokenScreen());
  } else {
    showTokenScreen();
  }
  window.addEventListener('hashchange', () => { if (getToken()) applyHashView(); });
})();
