import { useState } from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';

export default function UserEditForm({ user, onSave, onCancel }: {
  user: User;
  onSave: (data: Partial<User>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<User>>({ ...user });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          className="input input-bordered w-full"
          value={form.full_name || ''}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          className="input input-bordered w-full"
          type="email"
          value={form.email || ''}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          className="input input-bordered w-full"
          value={form.role || ''}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          required
        >
          <option value="admin">admin</option>
          <option value="owner">owner</option>
          <option value="controller">controller</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Division</label>
        <input
          className="input input-bordered w-full"
          value={form.division || ''}
          onChange={e => setForm(f => ({ ...f, division: e.target.value }))}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
