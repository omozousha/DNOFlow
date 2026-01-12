// Dashboard Filters - Compact Design with shadcn UI
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { X, MapPin, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { format } from "date-fns";

export interface DashboardFiltersProps {
  regionOptions: string[];
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  dateRange: { from: Date | null; to: Date | null };
  onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
  className?: string;
  showLabels?: boolean;
}

export function DashboardFilters({
  regionOptions,
  selectedRegion,
  onRegionChange,
  dateRange,
  onDateRangeChange,
  className,
  showLabels = false,
}: DashboardFiltersProps) {
  // Smart: Detect active filters
  const hasDateFilter = useMemo(() => 
    dateRange.from !== null || dateRange.to !== null, 
    [dateRange]
  );
  
  const isDefaultRegion = selectedRegion === 'ALL';
  
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (!isDefaultRegion) count++;
    if (hasDateFilter) count++;
    return count;
  }, [isDefaultRegion, hasDateFilter]);

  const handleResetDate = () => {
    onDateRangeChange({ from: null, to: null });
  };

  const handleResetAll = () => {
    onRegionChange('ALL');
    onDateRangeChange({ from: null, to: null });
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-1 items-stretch sm:items-center", className)}>
      {/* Region Filter */}
      <div className="flex items-center gap-1 h-5">
        {showLabels && (
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5 shrink-0">
            <MapPin className="h-2.5 w-2.5" />
            Region:
          </span>
        )}
        <Select value={selectedRegion} onValueChange={onRegionChange}>
          <SelectTrigger 
            className={cn(
              "w-full sm:w-24 h-full text-[10px] font-medium rounded-md",
              "transition-all duration-200",
              !isDefaultRegion && "border-primary/50 bg-primary/5"
            )}
          >
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            {regionOptions.map((region) => (
              <SelectItem 
                key={region} 
                value={region} 
                className="text-[10px] font-medium"
              >
                {region === 'ALL' ? 'All Regions' : region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-1 h-5">
        {showLabels && (
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5 shrink-0">
            <CalendarIcon className="h-2.5 w-2.5" />
            Period:
          </span>
        )}
        <div className="flex gap-0.5 items-center h-full">
          {/* Start Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-24 h-full text-[10px] font-medium justify-start px-1.5 rounded-md",
                  "transition-all duration-200",
                  !dateRange.from && "text-muted-foreground",
                  dateRange.from && "border-primary/50 bg-primary/5"
                )}
              >
                <CalendarIcon className="mr-1 h-2.5 w-2.5 shrink-0" />
                {dateRange.from ? format(dateRange.from, "dd MMM yy") : "Start"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from || undefined}
                onSelect={(date) => onDateRangeChange({ from: date || null, to: dateRange.to })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground text-[10px] font-bold leading-none">→</span>

          {/* End Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-24 h-full text-[10px] font-medium justify-start px-1.5 rounded-md",
                  "transition-all duration-200",
                  !dateRange.to && "text-muted-foreground",
                  dateRange.to && "border-primary/50 bg-primary/5"
                )}
              >
                <CalendarIcon className="mr-1 h-2.5 w-2.5 shrink-0" />
                {dateRange.to ? format(dateRange.to, "dd MMM yy") : "End"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.to || undefined}
                onSelect={(date) => onDateRangeChange({ from: dateRange.from, to: date || null })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {/* Reset Date Button */}
          {hasDateFilter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetDate}
              className="h-full w-5 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              title="Clear date range"
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Badge & Reset All */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1 h-5">
          <Badge 
            variant="secondary" 
            className="h-full px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-primary/20 flex items-center"
          >
            {activeFiltersCount} Filter{activeFiltersCount > 1 ? 's' : ''} Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            className="h-full px-1.5 text-[10px] font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
          >
            <X className="h-2.5 w-2.5 mr-0.5" />
            Reset All
          </Button>
        </div>
      )}
    </div>
  );
}
