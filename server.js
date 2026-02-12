import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireXToken } from './api/middleware/auth.js';
import { registerKanbanRoutes } from './api/routes/kanban.js';
import { registerPeopleRoutes } from './api/routes/people.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'public')));

// Health check público (sem token)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API Kanban Sprint' });
});

// Documentação (Markdown) – público
const DOCS_NAMES = ['README', 'API', 'USO'];
app.get('/api/docs/:name', (req, res) => {
  const name = req.params.name;
  if (!DOCS_NAMES.includes(name)) {
    return res.status(404).json({ error: 'Documento não encontrado' });
  }
  const filePath = path.join(__dirname, 'docs', `${name}.md`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Documento não encontrado' });
    res.type('text/markdown').send(data);
  });
});

// Rotas protegidas por X-Token
app.use('/api/board', requireXToken);
app.use('/api/columns', requireXToken);
app.use('/api/cards', requireXToken);
app.use('/api/timeline', requireXToken);
app.use('/api/people', requireXToken);

registerKanbanRoutes(app);
registerPeopleRoutes(app);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Kanban Sprint rodando em http://localhost:${PORT}`);
  console.log('Use o header X-Token para acessar a API.');
});
