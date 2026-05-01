import { useMemo, useState } from 'react'
import { mockAdminUsers } from '@/lib/mock-data'
import { ROLES } from '@/lib/constants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export function AdminUsersPage() {
  const [users, setUsers] = useState(mockAdminUsers)
  const [search, setSearch] = useState('')
  const [edit, setEdit] = useState(null)

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return users.filter(
      (u) =>
        !s ||
        u.email.toLowerCase().includes(s) ||
        u.name.toLowerCase().includes(s),
    )
  }, [users, search])

  const pageSize = 8
  const [page, setPage] = useState(0)
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize)

  const columns = [
    { key: 'name', header: 'Name', cell: (row) => row.name },
    { key: 'email', header: 'Email', cell: (row) => row.email },
    {
      key: 'role',
      header: 'Role',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="capitalize">
              {row.role}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={row.role}
              onValueChange={(value) => {
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === row.id ? { ...u, role: value } : u,
                  ),
                )
                toast.success(`Role updated locally to ${value}`)
              }}
            >
              <DropdownMenuRadioItem value={ROLES.STUDENT}>
                Student
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={ROLES.LECTURER}>
                Lecturer
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={ROLES.ADMIN}>Admin</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const rows = pageRows.map((u) => ({
    ...u,
    actions: [
      {
        label: 'Edit role (modal)',
        onClick: () => setEdit(u),
      },
      {
        label: 'View audit (stub)',
        onClick: () => toast.message('Wire GET /admin/audit when available.'),
      },
    ],
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Mock table — swap dataset for real directory sync + PATCH role endpoints.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>Search + pagination + inline RBAC controls.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="user-search">Search</Label>
            <Input
              id="user-search"
              placeholder="name or email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} />
          <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
            <span>
              Page {page + 1} of {Math.max(1, Math.ceil(filtered.length / pageSize))}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={(page + 1) * pageSize >= filtered.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(edit)} onOpenChange={() => setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {edit?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--muted-foreground)]">
            Placeholder modal — connect admin PATCH + confirmation dialog.
          </p>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEdit(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
