import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export const useSortableData = <T extends Record<string, any>>(items: T[], config: { key: keyof T | string, direction: SortDirection } | null = null) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null && sortConfig.direction !== null) {
      sortableItems.sort((a, b) => {
        // Resolve nested keys if dot notation is used (e.g. "unitSekolah.name")
        const resolvePath = (obj: any, path: string) => path.split('.').reduce((o, p) => (o ? o[p] : ''), obj);
        
        const aValue = resolvePath(a, sortConfig.key as string);
        const bValue = resolvePath(b, sortConfig.key as string);
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comp = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
          if (comp !== 0) {
            return sortConfig.direction === 'asc' ? comp : -comp;
          }
          return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof T | string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};
