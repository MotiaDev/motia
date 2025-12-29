export const data = {
  query: () => Promise.resolve([]),
  select: () => ({
    from: () => ({
      where: () => Promise.resolve([]),
    }),
  }),
}

export const items = {
  id: 'id',
  name: 'name',
}
