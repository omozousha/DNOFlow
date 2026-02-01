'use client';

import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Banner } from "@/components/banner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  Mail, 
  Building2, 
  Briefcase, 
  Calendar,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const AccountDialogContext = React.createContext<{ openAccountDialog: () => void } | undefined>(undefined);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [accountDialogOpen, setAccountDialogOpen] = React.useState(false);
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = React.useState(false);
  const { profile } = useAuth();
  
  const openAccountDialog = React.useCallback(() => {
    setAccountDialogOpen(true);
    setShowChangePassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }, []);

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Password changed successfully!');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <AccountDialogContext.Provider value={{ openAccountDialog }}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col w-full">
            <SiteHeader />
            <Banner />
            <main className="flex-1 w-full">
              {children}
            </main>
          </div>
          <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Profile & Account</DialogTitle>
                <DialogDescription>
                  Informasi akun dan pengaturan keamanan
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                <div className="space-y-6">{/* User Profile Section */}
                {/* User Profile Section */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-20 w-20 rounded-lg">
                    <AvatarImage src={"/avatars/default.jpg"} alt={profile?.full_name || profile?.email || "User"} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xl font-semibold">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center space-y-1">
                    <h3 className="font-semibold text-xl">{profile?.full_name || 'User'}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    {profile?.role && (
                      <Badge variant="secondary" className="mt-2">
                        {profile.role}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* User Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs">Email</p>
                      <p className="font-medium">{profile?.email || '-'}</p>
                    </div>
                  </div>

                  {profile?.division && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-muted-foreground text-xs">Divisi</p>
                        <p className="font-medium">{profile.division}</p>
                      </div>
                    </div>
                  )}

                  {profile?.position && (
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-muted-foreground text-xs">Jabatan</p>
                        <p className="font-medium">{profile.position}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs">Last Login</p>
                      <p className="font-medium">{formatDate(profile?.last_login || null)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Change Password Section */}
                {!showChangePassword ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowChangePassword(true)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowChangePassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleChangePassword}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Password'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarProvider>
    </AccountDialogContext.Provider>
  );
}
