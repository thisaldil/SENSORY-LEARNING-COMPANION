import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function DataTable({
  columns,
  rows,
  emptyMessage = 'No rows to display',
  getRowKey,
}) {
  if (!rows?.length) {
    return (
      <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]/40 px-6 py-12 text-center text-sm text-[var(--muted-foreground)]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="relative max-h-[min(70vh,560px)] overflow-auto rounded-[12px] border border-[var(--border)]">
      <table className="w-full caption-bottom text-sm">
        <thead className="sticky top-0 z-10 bg-[var(--card)] shadow-[0_1px_0_var(--border)]">
          <tr className="border-b border-[var(--border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'h-11 px-4 text-left align-middle font-semibold text-[var(--foreground)]',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
            <th className="w-12 px-2" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={getRowKey(row, idx)}
              className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-subtle)]/60"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-4 py-3 align-middle', col.cellClassName)}
                >
                  {col.cell(row)}
                </td>
              ))}
              <td className="px-2 py-2 align-middle text-right">
                {row.actions?.length ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Row actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {row.actions.map((a) => (
                        <DropdownMenuItem
                          key={a.label}
                          onClick={a.onClick}
                          className="cursor-pointer"
                        >
                          {a.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
