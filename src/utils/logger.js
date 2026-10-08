const out = (level, args) => {
  const parts = args.map((a) => (a instanceof Error ? a.stack || a.message : a));
  (level === 'error' ? console.error : console.log)(
    `[${new Date().toISOString()}] [${level.toUpperCase()}]`,
    ...parts
  );
};

module.exports = {
  info: (...a) => out('info', a),
  warn: (...a) => out('warn', a),
  error: (...a) => out('error', a),
};
