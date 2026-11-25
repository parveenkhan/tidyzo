export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ ok: false, error: issue?.message || 'Check the form and try again.' });
    }
    req.body = parsed.data;
    return next();
  };
}
