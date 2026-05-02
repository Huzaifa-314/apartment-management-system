/** @param {Record<string, unknown>} query */
export function parsePagination(query, defaultLimit = 15) {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const rawLimit = parseInt(String(query.limit ?? String(defaultLimit)), 10) || defaultLimit;
  const limit = Math.min(100, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
