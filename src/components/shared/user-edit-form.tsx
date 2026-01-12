import { useState } from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          value={form.full_name || ''}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email || ''}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          value={form.role || ''}
          onValueChange={value => setForm(f => ({ ...f, role: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="controller">Controller</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="division">Division</Label>
        <Select
          value={form.division || ''}
          onValueChange={value => setForm(f => ({ ...f, division: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="DEPLOYMENT">Deployment</SelectItem>
            <SelectItem value="OPERATIONS">Operations</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
