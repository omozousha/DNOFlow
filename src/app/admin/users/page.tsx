// User Management Page (migrated from register)
'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import UserManagementTable from '@/components/shared/user-management-table';
import RegisterForm from './register-form';
import { supabase } from '@/lib/supabase/client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// import UserTable from './components/user-table';

type TabKey = 'users' | 'register';


type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  division: string;
};

export default function UserManagementPage() {
  const [tab, setTab] = useState<TabKey>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('id,full_name,email,role,division');
    if (!error) setUsers((data as User[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchUsers();
    })();
  }, []);
    // import RegisterForm from './register-form';
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      // Get session token untuk authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expired. Please login again.');
        setLoading(false);
        return;
      }

      // Call API route untuk delete user
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error deleting user:', result.error);
        alert('Gagal menghapus user: ' + result.error);
      } else {
        alert('User berhasil dihapus!');
        await fetchUsers();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Terjadi kesalahan saat menghapus user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string, data: Partial<User>) => {
    setLoading(true);
    try {
      // Get session token untuk authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expired. Please login again.');
        setLoading(false);
        return;
      }

      // Call API route untuk update user
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error updating user:', result.error);
        alert('Gagal update user: ' + result.error);
      } else {
        alert('User berhasil diupdate!');
        await fetchUsers();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Terjadi kesalahan saat update user');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSuccess = () => {
    fetchUsers();
    setTab('users');
  };

  return (
    <div className="flex justify-center w-full p-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
        <TabsList className="mb-4 flex justify-center">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <div className="w-full">
            <div className="pb-2 text-lg font-semibold">User List</div>
            {loading ? (
              <div className="flex justify-center items-center h-32"><Spinner /></div>
            ) : (
              <UserManagementTable
                users={users.map(u => ({
                  ...u,
                  is_active: true // or derive from your data jika ada
                }))}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value="register">
          <div className="w-full flex flex-col items-center">
            <div className="pb-2 text-lg font-semibold w-full text-center">Register User</div>
            <div className="w-full max-w-md">
              <RegisterForm onSuccess={handleRegisterSuccess} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}