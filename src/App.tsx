import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { useSession } from './app/session';
import { Spinner } from './components/ui/primitives';
import { SignInPage } from './pages/SignInPage';

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

export function App() {
  const { user } = useSession();
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<SignInPage />} />
      </Routes>
    );
  }
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
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
          <Route path="admin" element={<AdminHealth />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
