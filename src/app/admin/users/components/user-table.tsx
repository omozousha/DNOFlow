// User Table Component
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

export default function UserTable({ users, onDelete }: { users: any[]; onDelete: (id: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Division</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.full_name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{user.division}</TableCell>
            <TableCell>
              <button onClick={() => onDelete(user.id)} className="text-red-500">Delete</button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
