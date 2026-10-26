import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowDownAZ, Download } from "lucide-react";
import { ColumnCustomizer } from "./ColumnCustomizer";
import { ColumnConfig } from "@/types/loans";

interface SortOption {
  value: string;
  label: string;
}

interface LoanTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortOrder: string;
  onSortChange: (value: string) => void;
  sortOptions?: SortOption[];
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  showExport?: boolean;
  onExport?: () => void;
}

const defaultSortOptions: SortOption[] = [
  { value: "date-desc", label: "F. Sol. (más reciente)" },
  { value: "date-asc", label: "F. Sol. (más antigua)" },
  { value: "amount-desc", label: "Monto (mayor)" },
  { value: "amount-asc", label: "Monto (menor)" },
  { value: "name-asc", label: "Nombre (A-Z)" },
  { value: "name-desc", label: "Nombre (Z-A)" },
];

export const LoanTableFilters = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Buscar por nombre...",
  sortOrder,
  onSortChange,
  sortOptions = defaultSortOptions,
  columns,
  onColumnsChange,
  showExport = false,
  onExport
}: LoanTableFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={sortOrder} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <ArrowDownAZ className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ColumnCustomizer columns={columns} onColumnsChange={onColumnsChange} />
      {showExport && onExport && (
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      )}
    </div>
  );
};
