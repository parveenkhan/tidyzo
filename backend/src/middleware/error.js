export function notFound(_req, res) {
  res.status(404).json({ ok: false, error: 'Not found' });
}

export function errorHandler(err, _req, res, _next) {
  if (res.headersSent) return;
  const status = Number(err.status) || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ ok: false, error: status >= 500 ? 'Something went wrong.' : err.message });
}
