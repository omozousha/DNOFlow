'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/auth/protected-route'
import { supabase } from '@/lib/supabase/client'
import { MetricCard } from '@/components/dashboard/shared/metric-card'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

/* =======================
   Types
======================= */
type UserRow = {
  id: string
  full_name?: string
  email: string
  role: string
  is_active: boolean
}

type ActivityLog = {
  id: string
  action: string
  changed_at?: string
  profile_id?: string
  user: string
  time: string
}

/* =======================
   Page
======================= */
export default function AdminDashboardPage() {
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
  })
  const [users, setUsers] = useState<UserRow[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  useEffect(() => {
    const fetchData = async () => {
      /* User stats */
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)

      /* Users */
      const { data: userList } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, is_active')

      /* Activity logs */
      const { data: logs } = await supabase
        .from('profiles_audit_log')
        .select('id, action, changed_at, profile_id')
        .order('changed_at', { ascending: false })
        .limit(10)

      const userMap = Object.fromEntries(
        (userList || []).map(u => [u.id, u])
      )

      const mappedLogs: ActivityLog[] =
        (logs || []).map(log => ({
          ...log,
          user:
            userMap[log.profile_id || '']?.full_name ||
            userMap[log.profile_id || '']?.email ||
            'Unknown',
          time: log.changed_at
            ? new Date(log.changed_at).toLocaleString()
            : '',
        }))

      setUserStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
      })
      setUsers(userList || [])
      setActivityLogs(mappedLogs)
    }

    fetchData()
  }, [])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex flex-col gap-8 p-6">
        {/* STATISTICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={userStats.totalUsers}
            icon="users"
            description="All registered users"
            variant="default"
          />
          <div className="relative group">
            <MetricCard
              title="Active Users"
              value={userStats.activeUsers}
              icon="user-check"
              description="Currently active users"
              variant="success"
            />
            <div className="absolute right-2 top-2 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer text-muted-foreground hover:text-foreground" tabIndex={0}>
                      ℹ️
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="min-w-[220px] whitespace-pre-line">
                    User akan otomatis nonaktif jika tidak login selama 3 hari.
                    Nonactive = tidak login &gt; 3 hari. Akan aktif kembali jika login.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {/* Tambahkan statistik lain jika perlu */}
        </div>

        {/* ACTIVITY LOG */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity Log</CardTitle>
            <CardDescription>Latest 10 actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log, i) => (
                  <TableRow key={i}>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* USERS */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users</CardDescription>
            </div>
            <Button>Register User</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || user.email}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.is_active ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="destructive">Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
