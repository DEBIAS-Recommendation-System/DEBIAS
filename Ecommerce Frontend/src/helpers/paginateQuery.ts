export function paginateQuery(pagination: { page: number; limit: number }) {
  const start =
    pagination.page === 1 ? 0 : (pagination.page - 1) * pagination.limit;
  const end =
    pagination.page === 1 ? pagination.limit - 1 : start + pagination.limit - 1;
  return { start, end };
}
