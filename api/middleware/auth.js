/**
 * Middleware de autenticação via header X-Token.
 * Tokens válidos vêm da variável de ambiente X_TOKENS (vírgula para vários).
 * Configure em .env ou no ambiente.
 */
const VALID_TOKENS = new Set(
  (process.env.X_TOKENS || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
);

export function requireXToken(req, res, next) {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Token obrigatório. Envie o header X-Token.' });
  }
  if (!VALID_TOKENS.has(token)) {
    return res.status(403).json({ error: 'Token inválido.' });
  }
  req.token = token;
  next();
}
