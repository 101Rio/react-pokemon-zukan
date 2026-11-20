// src/queryKeys.ts
export const apiQueryKeys = {
  pokemon: {
    catalog: ['pokemon', 'catalog'] as const,
    list: ['pokemon', 'list'] as const,
    detail: (id: number) => ['pokemon', 'detail', id] as const,
    index: ['pokemon', 'index'] as const,
  },
};
