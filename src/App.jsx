import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './store/AppContext'
import { ToastHost } from './components/ui'
import Layout from './components/Layout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Matches from './pages/Matches'
import Jobs from './pages/Jobs'
import Applications from './pages/Applications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

import AdminOverview from './pages/admin/AdminOverview'
import AdminSettings from './pages/admin/AdminSettings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminJobSources from './pages/admin/AdminJobSources'
import AdminPortals from './pages/admin/AdminPortals'
import AdminPrompts from './pages/admin/AdminPrompts'
import AdminScheduler from './pages/admin/AdminScheduler'
import AdminAudit from './pages/admin/AdminAudit'
import AdminHealth from './pages/admin/AdminHealth'

function Booting() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="aurora" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div
          className="h-11 w-11 animate-spin rounded-full border-2 border-transparent"
          style={{
            borderTopColor: 'rgb(var(--accent))',
            borderRightColor: 'rgb(var(--accent-2))',
          }}
        />
        <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
          Starting up…
        </p>
      </div>
    </div>
  )
}

function RequireAuth({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useApp()
  if (loading) return <Booting />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function PublicOnly({ children }) {
  const { user, loading } = useApp()
  if (loading) return <Booting />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function Shell() {
  const { toasts, dismissToast } = useApp()
  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="matches" element={<Matches />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="applications" element={<Applications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAuth adminOnly>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="sources" element={<AdminJobSources />} />
          <Route path="portals" element={<AdminPortals />} />
          <Route path="prompts" element={<AdminPrompts />} />
          <Route path="scheduler" element={<AdminScheduler />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="health" element={<AdminHealth />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  )
}
