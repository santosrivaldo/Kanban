import { store } from '../store.js';

export function registerPeopleRoutes(app) {
  app.get('/api/people', (req, res) => {
    res.json(store.getPeople());
  });

  app.post('/api/people', (req, res) => {
    const { name, online, workStatus } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name é obrigatório' });
    }
    const person = store.addPerson({
      name: String(name).trim(),
      online: Boolean(online),
      workStatus: workStatus != null ? String(workStatus).trim() : '',
    });
    res.status(201).json(person);
  });

  app.patch('/api/people/:id', (req, res) => {
    const person = store.updatePerson(req.params.id, req.body || {});
    if (!person) return res.status(404).json({ error: 'Pessoa não encontrada' });
    res.json(person);
  });

  app.delete('/api/people/:id', (req, res) => {
    const ok = store.deletePerson(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Pessoa não encontrada' });
    res.status(204).send();
  });
}
