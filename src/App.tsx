import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { useSession } from './app/session';
import { Spinner } from './components/ui/primitives';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { SignInPage } from './pages/SignInPage';

const Landing = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/DashboardPage'));
const Jobs = lazy(() => import('./pages/JobsPage'));
const Matches = lazy(() => import('./pages/MatchesPage'));
const MatchDetail = lazy(() => import('./pages/MatchDetailPage'));
const SkillGap = lazy(() => import('./pages/SkillGapPage'));
const Applications = lazy(() => import('./pages/ApplicationsPage'));
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetailPage'));
const NeedsYou = lazy(() => import('./pages/NeedsYouPage'));
const Activity = lazy(() => import('./pages/ActivityPage'));
const Profile = lazy(() => import('./pages/ProfilePage'));
const Resume = lazy(() => import('./pages/ResumePage'));
const Notifications = lazy(() => import('./pages/NotificationsPage'));
const AdminHealth = lazy(() => import('./pages/admin/HealthPage'));
const AdminJobSources = lazy(() => import('./pages/admin/JobSourcesPage'));
const AdminFetchRuns = lazy(() => import('./pages/admin/FetchRunsPage'));
const AdminPortals = lazy(() => import('./pages/admin/PortalsPage'));
const AdminProviders = lazy(() => import('./pages/admin/AiProvidersPage'));
const AdminUsage = lazy(() => import('./pages/admin/AiUsagePage'));
const AdminPrompts = lazy(() => import('./pages/admin/PromptsPage'));
const AdminEvals = lazy(() => import('./pages/admin/EvalsPage'));
const AdminSemantic = lazy(() => import('./pages/admin/SemanticPage'));
const AdminSettings = lazy(() => import('./pages/admin/SettingsPage'));
const AdminScheduler = lazy(() => import('./pages/admin/SchedulerPage'));
const AdminEvents = lazy(() => import('./pages/admin/EventsPage'));
const AdminCaches = lazy(() => import('./pages/admin/CachesPage'));
const AdminAudit = lazy(() => import('./pages/admin/AuditPage'));
const AdminTools = lazy(() => import('./pages/admin/ToolsPage'));
const AdminUsers = lazy(() => import('./pages/admin/UsersPage'));
const AdminUserDetail = lazy(() => import('./pages/admin/UserDetailPage'));
const Setup = lazy(() => import('./pages/SetupPage'));

export function App() {
  const { user, isAdmin } = useSession();
  if (!user) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route index element={<Landing />} />
          <Route path="signin" element={<SignInPage />} />
          <Route path="signup" element={<SignInPage />} />
          <Route path="*" element={<SignInPage />} />
        </Routes>
      </Suspense>
    );
  }
  if (user.mustChangePassword) {
    // a password someone else set: change it before anything else
    return <ChangePasswordPage forced />;
  }
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="welcome" element={<Landing />} />
        <Route path="signin" element={<Navigate to="/" replace />} />
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="matches" element={<Matches />} />
          <Route path="matches/:id" element={<MatchDetail />} />
          <Route path="skill-gap" element={<SkillGap />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="needs-you" element={<NeedsYou />} />
          <Route path="activity" element={<Activity />} />
          <Route path="profile" element={<Profile />} />
          <Route path="resume" element={<Resume />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="setup" element={<Setup />} />
          {isAdmin && (
            <>
          <Route path="admin" element={<AdminHealth />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/users/:id" element={<AdminUserDetail />} />
          <Route path="admin/job-sources" element={<AdminJobSources />} />
          <Route path="admin/fetch-runs" element={<AdminFetchRuns />} />
          <Route path="admin/portals" element={<AdminPortals />} />
          <Route path="admin/ai/providers" element={<AdminProviders />} />
          <Route path="admin/ai/usage" element={<AdminUsage />} />
          <Route path="admin/ai/prompts" element={<AdminPrompts />} />
          <Route path="admin/ai/evals" element={<AdminEvals />} />
          <Route path="admin/ai/semantic" element={<AdminSemantic />} />
          <Route path="admin/settings" element={<AdminSettings />} />
          <Route path="admin/scheduler" element={<AdminScheduler />} />
          <Route path="admin/events" element={<AdminEvents />} />
          <Route path="admin/caches" element={<AdminCaches />} />
          <Route path="admin/audit" element={<AdminAudit />} />
          <Route path="admin/tools" element={<AdminTools />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
