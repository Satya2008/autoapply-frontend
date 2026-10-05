/** Shapes of the backend's requests and responses, as its OpenAPI documents describe them. */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

// ---------- users, profile, skills ----------

export interface User {
  id: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

export interface Profile {
  userId: string;
  fullName: string | null;
  phone: string | null;
  location: string | null;
  currentTitle: string | null;
  experienceYears: number | null;
  expectedSalary: number | null;
  noticePeriodDays: number | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  targetRoles: string[];
  preferredLocations: string[];
  excludedCompanies: string[];
  excludedKeywords: string[];
  remoteOk: boolean;
  minMatchScore: number;
  dailyApplyLimit: number;
  autoApplyEnabled: boolean;
  updatedAt: string | null;
}

export type ProfileUpdate = Omit<Profile, 'userId' | 'updatedAt'>;

export type SkillSource = 'MANUAL' | 'RESUME';

export interface Skill {
  name: string;
  years: number | null;
  source: SkillSource;
}

// ---------- resume ----------

export interface Resume {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  textExtracted: boolean;
  aiParsed: ResumeAiParse | null;
  aiParsedAt: string | null;
}

export interface ResumeAiParse {
  skills?: { name: string; years?: number }[];
  seniority?: string;
  totalYearsExperience?: number;
  roles?: string[];
  summary?: string;
}

export interface ResumeUpload {
  resume: Resume;
  skillsFound: string[];
  skillsAdded: string[];
  autoApplyTurnedOff: boolean;
}

export interface DirectUpload {
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  key: string;
  expiresAt: string;
}

export interface DownloadUrl {
  url: string;
  expiresAt: string;
}

// ---------- jobs ----------

export interface JobSummary {
  id: string;
  sourceCode: string;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  postedAt: string | null;
  applyUrl: string | null;
}

export interface JobRequirements {
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  minYearsExperience?: number;
  seniority?: string;
  workMode?: string;
  summary?: string;
}

export interface JobDetail extends JobSummary {
  externalId: string;
  description: string | null;
  status: 'ACTIVE' | 'CLOSED';
  fetchedAt: string;
  lastSeenAt: string;
  requirements: JobRequirements | null;
  parsedAt: string | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface JobSearch {
  q?: string;
  location?: string;
  remote?: boolean;
  source?: string;
  postedWithinDays?: number;
}

// ---------- matching ----------

export type RunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface MatchRun {
  id: string;
  status: RunStatus;
  jobsConsidered: number | null;
  excluded: number | null;
  matchesCreated: number | null;
  matchesUpdated: number | null;
  belowThreshold: number | null;
  aiReviewed: number | null;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface MatchSummary {
  id: string;
  jobId: string;
  score: number;
  aiScore: number | null;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean;
  postedAt: string | null;
  applyUrl: string | null;
  matchedAt: string;
}

export interface FactorScore {
  factor: string;
  weight: number;
  score: number;
  points: number;
  detail: string;
}

export interface MatchDetail {
  match: MatchSummary;
  status: string;
  breakdown: FactorScore[];
  aiReasons: string[] | null;
  aiScoredBy: string | null;
}

export interface SkillGap {
  jobsAnalysed: number;
  currentMatches: number;
  threshold: number;
  gaps: { skill: string; jobsAsking: number; extraMatches: number; exampleJobs: string[] }[];
}

// ---------- applications ----------

export const APPLICATION_STATUSES = [
  'PLANNED', 'QUEUED', 'SENDING', 'SIMULATED', 'SUBMITTED', 'FAILED', 'NEEDS_YOU', 'APPLIED', 'INTERVIEW', 'OFFER',
  'REJECTED', 'SKIPPED',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type RiskBand = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ApplicationSummary {
  id: string;
  jobId: string;
  title: string;
  company: string | null;
  location: string | null;
  applyUrl: string | null;
  matchScore: number;
  status: ApplicationStatus;
  riskBand: RiskBand;
  submittedVia: 'SIMULATED' | 'BROWSER' | 'MANUAL' | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationEvent {
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string | null;
  at: string;
}

export interface ApplicationDetail {
  application: ApplicationSummary;
  riskReason: string | null;
  needsYouReason: string | null;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: string | null;
  prefill: Record<string, string> | null;
  coverLetter: string | null;
  timeline: ApplicationEvent[];
}

export interface NeedsYou {
  application: ApplicationSummary;
  reason: string | null;
  prefill: Record<string, string> | null;
}

export interface ApplicationStats {
  total: number;
  byStatus: Partial<Record<ApplicationStatus, number>>;
  sent: number;
  automatedToday: number;
  dailyLimit: number;
}

export interface ApplyRun {
  id: string;
  status: RunStatus;
  matchesConsidered: number | null;
  queued: number | null;
  needsYou: number | null;
  simulated: number | null;
  failed: number | null;
  alreadyApplied: number | null;
  belowScore: number | null;
  deferred: number | null;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface CoverLetter {
  applicationId: string;
  letter: string;
  writtenAt: string;
  writtenBy: string;
  draft: boolean;
  grounded: boolean;
  unsupportedClaims: string[];
  evidence: string[];
  note: string | null;
}

export interface ScreeningAnswer {
  question: string;
  answer: string | null;
  source: 'PROFILE' | 'AI' | 'NONE';
  needsYou: boolean;
  evidence: string[];
}

export interface ScreeningAnswers {
  applicationId: string;
  answers: ScreeningAnswer[];
  answeredBy: string | null;
  note: string | null;
}

// ---------- notifications ----------

export interface NotificationPreferences {
  emailEnabled: boolean;
  telegramEnabled: boolean;
  telegramLinked: boolean;
  digestEnabled: boolean;
  applyUpdates: boolean;
}

export interface TelegramLink {
  code: string;
  expiresAt: string;
  instructions: string;
}

// ---------- admin: settings, audit, scheduler, portals, storage ----------

export type SettingType = 'STRING' | 'INT' | 'BOOLEAN' | 'DURATION' | 'CRON' | 'DOMAIN_LIST' | 'SECRET';

export interface Setting {
  key: string;
  category: string;
  type: SettingType;
  description: string;
  value: string | null;
  defaultValue: string | null;
  overridden: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface AuditEntry {
  id: string;
  actor: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  ip: string | null;
  success: boolean;
  error: string | null;
  at: string;
}

export interface ScheduledJob {
  name: string;
  cron: string;
  enabled: boolean;
  scheduled: boolean;
  nextRunAt: string | null;
  running: boolean;
  lastTrigger: string | null;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastDurationMs: number | null;
  lastSuccess: boolean | null;
  lastResult: string | null;
}

export interface Portal {
  id: string;
  domain: string;
  name: string;
  riskBand: RiskBand;
  enabled: boolean;
  selectors: Record<string, string>;
  createdAt: string;
}

export interface PortalInput {
  domain: string;
  name: string;
  riskBand: RiskBand;
  enabled: boolean;
  selectors: Record<string, string>;
}

export interface StorageMigration {
  files: number;
  copied: number;
  alreadyThere: number;
  missingLocally: number;
}

// ---------- admin: platform (per service) ----------

export type ServiceName = 'core-api' | 'job-service' | 'matching-service' | 'notification-service';

export interface DependencyState {
  name: string;
  state: string;
  failureRate: number;
  recentCalls: number;
  recentFailures: number;
  refusedCalls: number;
  freeSlots: number;
}

export interface OutboxStats {
  pending: number;
  oldestPendingSeconds: number;
  failing: number;
  sentLastHour: number;
}

export interface CacheStats {
  name: string;
  localSize: number;
  localHits: number;
  sharedHits: number;
  misses: number;
  loads: number;
  waits: number;
  errors: number;
  hitRatio: number;
  averageLoadMillis: number;
  localTtl: string;
  sharedTtl: string;
}

export interface DeadLetter {
  id: string;
  topic: string;
  key: string | null;
  payload: string;
  error: string | null;
  failedAt: string;
  replayedAt: string | null;
}

// ---------- admin: job sources and fetching ----------

export type SourceRunStatus = 'NEVER' | 'SUCCESS' | 'FAILED';

export interface JobSource {
  id: string;
  code: string;
  name: string;
  type: 'REST_JSON';
  baseUrl: string;
  searchPath: string | null;
  method: 'GET' | 'POST';
  bodyTemplate: string | null;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  resultsPath: string;
  fieldMappings: Record<string, string>;
  enabled: boolean;
  priority: number;
  timeoutSeconds: number;
  maxPages: number;
  lastRunAt: string | null;
  lastRunStatus: SourceRunStatus;
  lastRunMessage: string | null;
  consecutiveFailures: number;
  jobCount: number;
}

export type JobSourceInput = Omit<JobSource, 'id' | 'lastRunAt' | 'lastRunStatus' | 'lastRunMessage' | 'consecutiveFailures' | 'jobCount'>;

export interface SourceResult {
  sourceCode: string;
  status: SourceRunStatus;
  message: string | null;
  received: number;
  inserted: number;
  updated: number;
  duplicates: number;
  skipped: number;
  durationMs: number;
}

export interface FetchRun {
  id: string;
  trigger: 'MANUAL' | 'SCHEDULED';
  status: 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  startedAt: string;
  finishedAt: string | null;
  message: string | null;
  sourcesSucceeded: number;
  sourcesFailed: number;
  received: number;
  inserted: number;
  updated: number;
  duplicates: number;
  skipped: number;
  sources: SourceResult[];
}

export interface JobPreview {
  externalId: string;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  postedAt: string | null;
  applyUrl: string | null;
}

export interface SourceDryRun {
  sourceCode: string;
  ok: boolean;
  error: string | null;
  pagesFetched: number;
  received: number;
  valid: number;
  skipped: number;
  sample: JobPreview[];
  problems: string[];
}

export interface SourceFetchResult {
  sourceCode: string;
  status: SourceRunStatus;
  pagesFetched: number;
  received: number;
  inserted: number;
  updated: number;
  duplicates: number;
  skipped: number;
  message: string | null;
  sourceDisabled: boolean;
  durationMs: number;
}

export interface Cleanup {
  closed: number;
  deleted: number;
}

// ---------- admin: AI ----------

export type AiProviderType = 'ANTHROPIC' | 'OPENAI' | 'GEMINI' | 'OLLAMA';

export interface AiProviderTypeInfo {
  type: AiProviderType;
  label: string;
  defaultBaseUrl: string;
  needsApiKey: boolean;
  exampleModels: string[];
  supportsEmbeddings: boolean;
  exampleEmbeddingModels: string[];
  note: string;
}

export interface AiProvider {
  name: string;
  type: AiProviderType;
  baseUrl: string;
  model: string;
  strongModel: string | null;
  embeddingModel: string | null;
  enabled: boolean;
  ready: boolean;
  primary: boolean;
  priority: number;
  apiKeySet: boolean;
  apiKeyHint: string | null;
  timeoutSeconds: number;
  inputPrice: number | null;
  outputPrice: number | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface AiProviderCreate {
  name: string;
  type: AiProviderType;
  baseUrl?: string;
  apiKey?: string;
  model: string;
  strongModel?: string;
  embeddingModel?: string;
  enabled?: boolean;
  timeoutSeconds?: number;
  inputPrice?: number;
  outputPrice?: number;
}

export type AiProviderUpdate = Partial<Omit<AiProviderCreate, 'name' | 'type'>>;

export interface AiTestResult {
  provider: string;
  model: string;
  answer: Json;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  fallbacks: number;
}

export interface AiUsageRow {
  group: string;
  calls: number;
  failed: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  averageLatencyMs: number;
}

export interface Prompt {
  code: string;
  version: number;
  active: boolean;
  system: string | null;
  template: string;
  outputSchema: string | null;
  createdAt: string;
  activatedAt: string | null;
  evalGated: boolean;
}

export interface EmbeddingStatus {
  currentModel: string;
  local: boolean;
  jobsWithVectors: number;
  storedByModel: Record<string, number>;
  indexModel: string | null;
  indexSize: number;
}

export interface EvalCaseProfile {
  skills: string[];
  targetRoles: string[];
  experienceYears: number | null;
  preferredLocations: string[];
  remoteOk: boolean | null;
}

export interface EvalCaseJob {
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean | null;
  description: string | null;
  requiredSkills: string[];
  minYearsExperience: number | null;
  seniority: string | null;
}

export interface EvalCase {
  id: string;
  name: string;
  profile: EvalCaseProfile;
  job: EvalCaseJob;
  expectedScore: number;
  notes: string | null;
  createdAt: string;
}

export interface EvalMetrics {
  cases: number;
  mae: number;
  within15: number;
  spearman: number | null;
  precision: number;
  recall: number;
  f1: number;
}

export interface EvalRun {
  id: string;
  kind: 'MATCHER' | 'PROMPT';
  promptCode: string | null;
  promptVersion: number | null;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  passed: boolean | null;
  caseCount: number;
  metrics: EvalRunMetrics | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface EvalRunMetrics {
  embeddingModel?: string;
  embeddingFellBack?: boolean;
  keyword?: EvalMetrics;
  hybrid?: EvalMetrics;
  ai?: EvalMetrics;
  verdict?: string;
  prompt?: string;
  version?: number;
  validRate?: number;
  costUsd?: number;
  averageLatencyMs?: number;
  passWhen?: { maxMae: number; minValidRate: number };
  cases?: Record<string, Json>[];
}
