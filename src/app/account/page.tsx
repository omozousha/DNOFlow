'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, User, Lock, Mail, Briefcase, Building2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AccountPage() {
  const { profile, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validasi
    if (newPassword.length < 8) {
      setError('Password baru harus minimal 8 karakter');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi password tidak sama');
      setLoading(false);
      return;
    }

    if (currentPassword === newPassword) {
      setError('Password baru tidak boleh sama dengan password lama');
      setLoading(false);
      return;
    }

    try {
      toast.loading('Mengubah password...', { id: 'change-password-toast' });

      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        setError('Password saat ini salah');
        toast.error('Password saat ini salah', { id: 'change-password-toast' });
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Gagal mengubah password');
        toast.error(updateError.message || 'Gagal mengubah password', { id: 'change-password-toast' });
        setLoading(false);
        return;
      }

      // Success
      toast.success('Password berhasil diubah!', { id: 'change-password-toast' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } catch (err: unknown) {
      console.error('[ChangePassword] Error:', err);
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(message);
      toast.error(message, { id: 'change-password-toast' });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Kelola informasi akun dan keamanan Anda</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Informasi akun Anda (tidak dapat diubah sendiri, hubungi admin untuk perubahan)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Full Name
              </div>
              <div className="text-base font-medium">{profile.full_name || '-'}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <div className="text-base font-medium">{profile.email}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                Role
              </div>
              <div className="text-base font-medium capitalize">{profile.role}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Division
              </div>
              <div className="text-base font-medium">{profile.division || '-'}</div>
            </div>

            {profile.position && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Position
                </div>
                <div className="text-base font-medium">{profile.position}</div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Status
              </div>
              <div className="text-base font-medium">
                {profile.is_active ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Ubah password Anda untuk meningkatkan keamanan akun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="currentPassword">Password Saat Ini</FieldLabel>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Masukkan password saat ini"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="newPassword">Password Baru</FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <FieldDescription>
                  Password harus minimal 8 karakter
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Konfirmasi Password Baru</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ketik ulang password baru"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </Field>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <FieldDescription className="text-red-700 text-sm">
                    {error}
                  </FieldDescription>
                </div>
              )}

              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Ubah Password
                    </>
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Perlu Bantuan?</p>
              <p className="text-sm text-muted-foreground">
                Jika Anda mengalami masalah dengan akun atau lupa password, silakan hubungi administrator untuk mendapatkan bantuan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
