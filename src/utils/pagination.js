export function getPaginationParams(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
  const offset = (page - 1) * limit;

  return { offset, limit, page };
}

export function getPaginationMeta(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}
