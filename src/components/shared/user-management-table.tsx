import { useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import UserEditForm from './user-edit-form';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export type UserTableRow = {
  id: string;
  full_name?: string;
  email: string;
  role: string;
  division?: string;
  position?: string;
  is_active: boolean;
};

export default function UserManagementTable({ users, onEdit, onDelete }: {
  users: UserTableRow[];
  onEdit?: (id: string, data: Partial<UserTableRow>) => void;
  onDelete?: (id: string) => void;
}) {
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [editUserData, setEditUserData] = useState<UserTableRow | null>(null);
  const handleEdit = (user: UserTableRow) => {
    setEditUserId(user.id);
    setEditUserData(user);
  };
  const handleDelete = (id: string) => {
    setDeleteUserId(id);
  };
  const confirmDelete = () => {
    if (deleteUserId && onDelete) onDelete(deleteUserId);
    setDeleteUserId(null);
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Division</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name || user.email}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.division || '-'}</TableCell>
              <TableCell>{user.position || '-'}</TableCell>
              <TableCell>{user.is_active ? 'Active' : 'Inactive'}</TableCell>
              <TableCell>
                <div className="space-x-2">
                  <Dialog open={editUserId === user.id} onOpenChange={(open) => setEditUserId(open ? user.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>Edit</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                          Ubah data user sesuai kebutuhan dan simpan.
                        </DialogDescription>
                      </DialogHeader>
                      {editUserData && editUserId === user.id && (
                        <UserEditForm
                          user={editUserData}
                          onSave={(data) => {
                            if (onEdit) onEdit(user.id, data);
                            setEditUserId(null);
                          }}
                          onCancel={() => setEditUserId(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <AlertDialog open={deleteUserId === user.id} onOpenChange={(open) => setDeleteUserId(open ? user.id : null)}>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus user <b>{user.full_name || user.email}</b>?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
