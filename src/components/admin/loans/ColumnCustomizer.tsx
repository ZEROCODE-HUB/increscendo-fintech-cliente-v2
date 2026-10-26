import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
import { ColumnConfig } from "@/types/loans";

interface ColumnCustomizerProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export const ColumnCustomizer = ({ columns, onColumnsChange }: ColumnCustomizerProps) => {
  const [open, setOpen] = useState(false);

  const toggleColumn = (key: string) => {
    const updated = columns.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(updated);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Columnas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-2">
          <p className="text-sm font-medium mb-3">Personalizar columnas</p>
          {columns.map((col) => (
            <div key={col.key} className="flex items-center space-x-2">
              <Checkbox
                id={col.key}
                checked={col.visible}
                onCheckedChange={() => toggleColumn(col.key)}
              />
              <label
                htmlFor={col.key}
                className="text-sm cursor-pointer"
              >
                {col.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
