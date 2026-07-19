import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey?: string | null;
  currentDirection?: 'asc' | 'desc' | null;
  onSort: (key: string) => void;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  label, sortKey, currentSortKey, currentDirection, onSort, className = '' 
}) => {
  const isActive = currentSortKey === sortKey;

  return (
    <th 
      className={`p-4 font-semibold cursor-pointer select-none hover:bg-black/5 transition-colors group ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <span className="text-text-muted flex-shrink-0 transition-opacity">
          {!isActive || !currentDirection ? (
            <ChevronsUpDown size={14} className="opacity-30 group-hover:opacity-100" />
          ) : currentDirection === 'asc' ? (
            <ChevronUp size={14} className="text-primary font-bold opacity-100" />
          ) : (
            <ChevronDown size={14} className="text-primary font-bold opacity-100" />
          )}
        </span>
      </div>
    </th>
  );
};
