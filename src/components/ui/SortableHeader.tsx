import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface SortableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  label: string;
  sortKey: string;
  currentSortKey?: string | null;
  currentDirection?: 'asc' | 'desc' | null;
  onSort: (key: string) => void;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  label, sortKey, currentSortKey, currentDirection, onSort, className = '', ...props 
}) => {
  const isActive = currentSortKey === sortKey;
  const isCenter = className.includes('text-center') || className.includes('justify-center');
  const isRight = className.includes('text-right') || className.includes('justify-end');

  return (
    <th 
      {...props}
      className={`p-4 font-semibold cursor-pointer select-none hover:bg-black/5 transition-colors group ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1.5 ${isCenter ? 'justify-center' : isRight ? 'justify-end' : ''}`}>
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
