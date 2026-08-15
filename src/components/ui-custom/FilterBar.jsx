import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Filter bar component with search, dropdowns, and active filter display
 */
export const FilterBar = ({
  filters,
  values,
  onChange,
  onClear,
  searchPlaceholder = "Search...",
  className
}) => {
  const activeFilters = Object.entries(values).filter(([_, v]) => v && v !== 'all');
  
  const handleFilterChange = (key, value) => {
    onChange({ ...values, [key]: value === 'all' ? undefined : value });
  };

  const handleClearFilter = (key) => {
    const newValues = { ...values };
    delete newValues[key];
    onChange(newValues);
  };

  const handleClearAll = () => {
    onClear?.();
    onChange({});
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        {filters.search !== false && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              value={values.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        )}

        {/* Filter dropdowns */}
        {filters.dropdowns?.map((filter) => (
          <Select
            key={filter.key}
            value={values[filter.key] || 'all'}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder={filter.placeholder || filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Clear all button */}
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Active filters:
          </span>
          {activeFilters.map(([key, value]) => {
            const filterDef = filters.dropdowns?.find(f => f.key === key);
            const optionLabel = filterDef?.options.find(o => o.value === value)?.label || value;
            
            return (
              <Badge
                key={key}
                variant="secondary"
                className="gap-1 pr-1 bg-slate-100 hover:bg-slate-200"
              >
                <span className="text-slate-600 capitalize">
                  {filterDef?.label || key}: {optionLabel}
                </span>
                <button
                  onClick={() => handleClearFilter(key)}
                  className="ml-1 rounded-full p-0.5 hover:bg-slate-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterBar;