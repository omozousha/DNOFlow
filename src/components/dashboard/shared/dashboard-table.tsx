import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface DashboardTableRow {
  region: string;
  pop: string;
  no_project: string;
  nama_project: string;
  port: number | string;
  progress: string;
}

// Helper untuk mendapatkan badge variant berdasarkan progress
function getProgressVariant(progress: string): "default" | "destructive" | "secondary" | "outline" {
  const progressLower = progress.toLowerCase();
  if (progressLower.includes('done') || progressLower.includes('selesai')) return 'default';
  if (progressLower.includes('cancel') || progressLower.includes('batal')) return 'destructive';
  if (progressLower.includes('construction')) return 'default';
  if (progressLower.includes('rescheduled') || progressLower.includes('pending')) return 'secondary';
  return 'outline';
}

export function DashboardTable({ data }: { data: DashboardTableRow[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  // Reset to page 1 when data changes
  useState(() => {
    setCurrentPage(1);
  });

  return (
    <div className="space-y-3">
      <Table className="w-full min-w-[700px] border-separate border-spacing-0">
        <TableHeader className="bg-muted/50 sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-12 text-center text-xs h-9">No</TableHead>
            <TableHead className="text-xs h-9">Region</TableHead>
            <TableHead className="text-xs h-9">POP</TableHead>
            <TableHead className="text-xs h-9">No Project</TableHead>
            <TableHead className="text-xs h-9">Nama Project</TableHead>
            <TableHead className="text-xs h-9 text-right">Port</TableHead>
            <TableHead className="text-xs h-9">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                Tidak ada data.
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, i) => {
              const globalIndex = startIndex + i;
              return (
                <TableRow key={globalIndex} className={globalIndex % 2 === 1 ? "bg-muted/30" : "bg-background"}>
                  <TableCell className="text-center font-medium text-xs py-2">{globalIndex + 1}</TableCell>
                  <TableCell className="text-xs py-2">
                    <span className="font-medium">{row.region}</span>
                  </TableCell>
                  <TableCell className="text-xs py-2">{row.pop}</TableCell>
                  <TableCell className="text-xs py-2 font-mono">{row.no_project}</TableCell>
                  <TableCell className="text-xs py-2 max-w-[300px] truncate" title={row.nama_project}>
                    {row.nama_project}
                  </TableCell>
                  <TableCell className="text-xs py-2 text-right font-medium tabular-nums">
                    {row.port}
                  </TableCell>
                  <TableCell className="text-xs py-2">
                    <Badge variant={getProgressVariant(row.progress)} className="text-xs h-5">
                      {row.progress}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          {/* Left: Items per page selector */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-muted-foreground">
              of {data.length} entries
            </span>
          </div>

          {/* Center: Page info */}
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>

          {/* Right: Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
