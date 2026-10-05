import { api, authHeaders, request, toApiError } from './client';
import type {
  AiProvider, AiProviderCreate, AiProviderTypeInfo, AiProviderUpdate, AiTestResult, AiUsageRow, ApplicationDetail,
  ApplicationStats, ApplicationStatus, ApplicationSummary, ApplyRun, AuditEntry, CacheStats, Cleanup, CoverLetter,
  DeadLetter, DependencyState, DirectUpload, DownloadUrl, EmbeddingStatus, EvalCase, EvalCaseJob, EvalCaseProfile,
  EvalRun, FetchRun, JobDetail, JobSearch, JobSource, JobSourceInput, JobSummary, MatchDetail, MatchRun, MatchSummary,
  NeedsYou, NotificationPreferences, OutboxStats, Page, Portal, PortalInput, Profile, ProfileUpdate, Prompt, Resume,
  ResumeUpload, ScheduledJob, ScreeningAnswers, ServiceName, Setting, Skill, SkillGap, SourceDryRun, SourceFetchResult,
  StorageMigration, TelegramLink, User, Json,
} from './types';

export const users = {
  create: (email: string) => api.post<User>('/api/v1/dev/users', { email }),
  findByEmail: (email: string) => api.get<User>('/api/v1/dev/users', { email }),
};

export const me = {
  profile: () => api.get<Profile>('/api/v1/me/profile'),
  updateProfile: (update: ProfileUpdate) => api.put<Profile>('/api/v1/me/profile', update),
  skills: () => api.get<Skill[]>('/api/v1/me/skills'),
  replaceSkills: (skills: { name: string; years: number | null }[]) => api.put<Skill[]>('/api/v1/me/skills', { skills }),
  notificationPreferences: () => api.get<NotificationPreferences>('/api/v1/me/notification-preferences'),
  updateNotificationPreferences: (p: Omit<NotificationPreferences, 'telegramLinked'>) =>
    api.put<NotificationPreferences>('/api/v1/me/notification-preferences', p),
  telegramLink: () => api.post<TelegramLink>('/api/v1/me/telegram/link'),
};

export const resume = {
  get: () => api.get<Resume>('/api/v1/me/resume'),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<ResumeUpload>('/api/v1/me/resume', form);
  },
  remove: () => api.del('/api/v1/me/resume'),
  parseAgain: () => api.post<void>('/api/v1/me/resume/parse'),
  uploadUrl: (file: File) =>
    api.post<DirectUpload>('/api/v1/me/resume/upload-url', {
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    }),
  confirm: (key: string, fileName: string) => api.post<ResumeUpload>('/api/v1/me/resume/confirm', { key, fileName }),
  downloadUrl: () => api.get<DownloadUrl>('/api/v1/me/resume/download-url'),
  /** Straight into object storage with a presigned link, then confirmed; the file never passes through our servers. */
  async uploadDirect(file: File): Promise<ResumeUpload> {
    const link = await resume.uploadUrl(file);
    const put = await fetch(link.uploadUrl, { method: link.method || 'PUT', headers: link.headers, body: file });
    if (!put.ok) {
      throw await toApiError(put);
    }
    return resume.confirm(link.key, file.name);
  },
  /** The file itself; works with local and S3 storage alike. */
  async download(fileName: string): Promise<void> {
    const response = await fetch('/api/v1/me/resume/file', { headers: authHeaders() });
    if (!response.ok) {
      throw await toApiError(response);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const jobs = {
  search: (filters: JobSearch, cursor?: string | null, limit = 20) =>
    api.get<Page<JobSummary>>('/api/v1/jobs', { ...filters, cursor, limit }),
  get: (id: string) => api.get<JobDetail>(`/api/v1/jobs/${id}`),
};

export const matches = {
  list: (minScore: number, cursor?: string | null, limit = 20) =>
    api.get<Page<MatchSummary>>('/api/v1/me/matches', { minScore, cursor, limit }),
  get: (id: string) => api.get<MatchDetail>(`/api/v1/me/matches/${id}`),
  startRun: () => api.post<MatchRun>('/api/v1/me/matches/runs'),
  run: (id: string) => api.get<MatchRun>(`/api/v1/me/matches/runs/${id}`),
  skillGap: () => api.get<SkillGap>('/api/v1/me/skill-gap'),
};

export const applications = {
  list: (status?: ApplicationStatus, cursor?: string | null, limit = 20) =>
    api.get<Page<ApplicationSummary>>('/api/v1/me/applications', { status, cursor, limit }),
  get: (id: string) => api.get<ApplicationDetail>(`/api/v1/me/applications/${id}`),
  needsYou: () => api.get<NeedsYou[]>('/api/v1/me/applications/needs-you'),
  stats: () => api.get<ApplicationStats>('/api/v1/me/applications/stats'),
  startRun: () => api.post<ApplyRun>('/api/v1/me/applications/runs'),
  run: (id: string) => api.get<ApplyRun>(`/api/v1/me/applications/runs/${id}`),
  done: (id: string) => api.post<ApplicationDetail>(`/api/v1/me/applications/${id}/done`),
  skip: (id: string) => api.post<ApplicationDetail>(`/api/v1/me/applications/${id}/skip`),
  setStatus: (id: string, status: ApplicationStatus, note?: string) =>
    api.patch<ApplicationDetail>(`/api/v1/me/applications/${id}/status`, { status, note: note || undefined }),
  coverLetter: (id: string, regenerate: boolean) =>
    api.post<CoverLetter>(`/api/v1/me/applications/${id}/cover-letter`, undefined, { regenerate }),
  screeningAnswers: (id: string, questions: string[]) =>
    api.post<ScreeningAnswers>(`/api/v1/me/applications/${id}/screening-answers`, { questions }),
};

// ---------------- admin ----------------

export const settings = {
  list: (category?: string) => api.get<Setting[]>('/api/v1/admin/settings', { category }),
  update: (key: string, value: string) => api.put<Setting>(`/api/v1/admin/settings/${encodeURIComponent(key)}`, { value }),
  reset: (key: string) => api.post<Setting>(`/api/v1/admin/settings/${encodeURIComponent(key)}/reset`),
};

export const audit = {
  list: (filters: { actor?: string; action?: string; targetType?: string }, cursor?: string | null, limit = 50) =>
    api.get<Page<AuditEntry>>('/api/v1/admin/audit', { ...filters, cursor, limit }),
};

export const scheduler = {
  list: () => api.get<ScheduledJob[]>('/api/v1/admin/scheduler'),
  run: (job: string) => api.post<ScheduledJob>(`/api/v1/admin/scheduler/${encodeURIComponent(job)}/run`),
};

export const portals = {
  list: () => api.get<Portal[]>('/api/v1/admin/portals'),
  create: (p: PortalInput) => api.post<Portal>('/api/v1/admin/portals', p),
  update: (id: string, p: PortalInput) => api.put<Portal>(`/api/v1/admin/portals/${id}`, p),
  remove: (id: string) => api.del(`/api/v1/admin/portals/${id}`),
  dryRun: (id: string, url: string) => request<Json>('POST', `/api/v1/admin/portals/${id}/dry-run`, { body: { url } }),
};

export const storage = {
  migrate: () => api.post<StorageMigration>('/api/v1/admin/storage/migrate'),
};

/** Per-service platform screens, reached through the gateway's per-service admin paths. */
export const platform = {
  resilience: (service: ServiceName) => api.get<DependencyState[]>(`/api/v1/admin/resilience/${service}`),
  caches: (service: ServiceName) => api.get<CacheStats[]>(`/api/v1/admin/cache/${service}`),
  clearCache: (service: ServiceName, name: string) => api.del(`/api/v1/admin/cache/${service}/${encodeURIComponent(name)}`),
  outbox: (service: ServiceName) => api.get<OutboxStats>(`/api/v1/admin/events/${service}/outbox`),
  deadLetters: (service: ServiceName, topic?: string) =>
    api.get<DeadLetter[]>(`/api/v1/admin/events/${service}/dlq`, { topic, limit: 100 }),
  replay: (service: ServiceName, id: string) => api.post<DeadLetter>(`/api/v1/admin/events/${service}/dlq/${id}/replay`),
};

export const jobSources = {
  list: () => api.get<JobSource[]>('/api/v1/admin/job-sources'),
  create: (s: JobSourceInput) => api.post<JobSource>('/api/v1/admin/job-sources', s),
  update: (id: string, s: JobSourceInput) => api.put<JobSource>(`/api/v1/admin/job-sources/${id}`, s),
  remove: (id: string) => api.del(`/api/v1/admin/job-sources/${id}`),
  test: (id: string) => api.post<SourceDryRun>(`/api/v1/admin/job-sources/${id}/test`),
  fetch: (id: string) => api.post<SourceFetchResult>(`/api/v1/admin/job-sources/${id}/fetch`),
};

export const fetchRuns = {
  list: (limit = 20) => api.get<FetchRun[]>('/api/v1/admin/jobs/fetch-runs', { limit }),
  get: (id: string) => api.get<FetchRun>(`/api/v1/admin/jobs/fetch-runs/${id}`),
  start: () => api.post<FetchRun>('/api/v1/admin/jobs/fetch-runs'),
  cleanup: () => api.post<Cleanup>('/api/v1/admin/jobs/cleanup'),
  reparse: () => api.post<Record<string, number>>('/api/v1/admin/jobs/reparse'),
};

export const ai = {
  types: () => api.get<AiProviderTypeInfo[]>('/api/v1/admin/ai/provider-types'),
  providers: () => api.get<AiProvider[]>('/api/v1/admin/ai/providers'),
  create: (p: AiProviderCreate) => api.post<AiProvider>('/api/v1/admin/ai/providers', p),
  update: (name: string, p: AiProviderUpdate) => api.patch<AiProvider>(`/api/v1/admin/ai/providers/${name}`, p),
  remove: (name: string) => api.del(`/api/v1/admin/ai/providers/${name}`),
  makePrimary: (name: string) => api.post<AiProvider[]>(`/api/v1/admin/ai/providers/${name}/primary`),
  reorder: (names: string[]) => api.put<AiProvider[]>('/api/v1/admin/ai/providers/order', { names }),
  models: (name: string) => api.get<string[]>(`/api/v1/admin/ai/providers/${name}/models`),
  test: (body: { provider?: string; model?: string; topic?: string }) => api.post<AiTestResult>('/api/v1/admin/ai/test', body),
  usage: (groupBy: string, from?: string, to?: string) => api.get<AiUsageRow[]>('/api/v1/admin/ai/usage', { groupBy, from, to }),
  embeddings: () => api.get<EmbeddingStatus>('/api/v1/admin/ai/embeddings'),
  reindex: () => api.post<Record<string, string>>('/api/v1/admin/ai/embeddings/reindex'),
  runBatch: () => api.post<Record<string, string>>('/api/v1/admin/ai/batch-matching/run'),
};

export const prompts = {
  list: () => api.get<Prompt[]>('/api/v1/admin/prompts'),
  addVersion: (code: string, body: { system?: string; template: string; outputSchema?: Record<string, Json> }) =>
    api.post<Prompt>(`/api/v1/admin/prompts/${code}/versions`, body),
  activate: (code: string, version: number) => api.post<Prompt>(`/api/v1/admin/prompts/${code}/versions/${version}/activate`),
};

export const evals = {
  cases: () => api.get<EvalCase[]>('/api/v1/admin/evals/cases'),
  addCase: (c: { name: string; profile: Partial<EvalCaseProfile>; job: Partial<EvalCaseJob>; expectedScore: number; notes?: string }) =>
    api.post<EvalCase>('/api/v1/admin/evals/cases', c),
  removeCase: (id: string) => api.del(`/api/v1/admin/evals/cases/${id}`),
  runs: (limit = 20) => api.get<EvalRun[]>('/api/v1/admin/evals/runs', { limit }),
  run: (id: string) => api.get<EvalRun>(`/api/v1/admin/evals/runs/${id}`),
  start: (body: { kind: 'MATCHER' | 'PROMPT'; promptCode?: string; promptVersion?: number }) =>
    api.post<EvalRun>('/api/v1/admin/evals/runs', body),
};

export const notifications = {
  test: (body: { channel: 'EMAIL' | 'TELEGRAM'; email?: string; telegramChatId?: string }) =>
    api.post<Record<string, Json>>('/api/v1/admin/notifications/test', body),
};
