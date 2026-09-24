import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

let refreshing = null

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // One transparent refresh attempt before giving up on the session.
    if (status === 401 && !original._retried && localStorage.getItem('refreshToken')) {
      original._retried = true
      try {
        refreshing =
          refreshing ||
          axios.post('/api/auth/refresh', {
            refreshToken: localStorage.getItem('refreshToken'),
          })
        const { data } = await refreshing
        refreshing = null
        const auth = data.data
        localStorage.setItem('token', auth.token)
        localStorage.setItem('refreshToken', auth.refreshToken)
        original.headers.Authorization = `Bearer ${auth.token}`
        return api(original)
      } catch {
        refreshing = null
        localStorage.clear()
        if (!window.location.pathname.startsWith('/login')) window.location.href = '/login'
      }
    }

    if (status === 401 && !localStorage.getItem('refreshToken')) {
      localStorage.clear()
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

/** Unwraps the ApiResponse envelope every endpoint returns. */
const unwrap = (promise) => promise.then((res) => res.data?.data ?? res.data)

export const errorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback

export const publicApi = {
  config: () => unwrap(api.get('/public/config')),
}

export const authApi = {
  register: (data) => unwrap(api.post('/auth/register', data)),
  login: (data) => unwrap(api.post('/auth/login', data)),
  logout: () => unwrap(api.post('/auth/logout')),
  profile: () => unwrap(api.get('/auth/profile')),
  updateProfile: (data) => unwrap(api.put('/auth/profile', data)),
  changePassword: (data) => unwrap(api.post('/auth/change-password', data)),
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return unwrap(
      api.post('/auth/resume', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
    )
  },
}

export const jobsApi = {
  list: (params) => unwrap(api.get('/jobs', { params })),
  get: (id) => unwrap(api.get(`/jobs/${id}`)),
  fetchNew: () => unwrap(api.post('/jobs/fetch')),
}

export const matchApi = {
  run: () => unwrap(api.post('/matches/run')),
  list: () => unwrap(api.get('/matches')),
  recommended: () => unwrap(api.get('/matches/recommended')),
}

export const applyApi = {
  run: () => unwrap(api.post('/apply/run')),
  history: () => unwrap(api.get('/apply/history')),
  stats: () => unwrap(api.get('/apply/stats')),
  assisted: () => unwrap(api.get('/apply/assisted')),
  markAssistedDone: (id) => unwrap(api.post(`/apply/assisted/${id}/done`)),
  skipAssisted: (id) => unwrap(api.post(`/apply/assisted/${id}/skip`)),
}

export const adminApi = {
  overview: () => unwrap(api.get('/admin/overview')),
  timeline: (days = 30) => unwrap(api.get('/admin/analytics/timeline', { params: { days } })),
  byStatus: () => unwrap(api.get('/admin/analytics/status')),
  bySource: () => unwrap(api.get('/admin/analytics/sources')),
  activity: () => unwrap(api.get('/admin/activity')),
  health: () => unwrap(api.get('/admin/health')),

  settings: () => unwrap(api.get('/admin/settings')),
  updateSetting: (key, value) => unwrap(api.put(`/admin/settings/${key}`, { value })),
  resetSetting: (key) => unwrap(api.post(`/admin/settings/${key}/reset`)),
  reloadSettings: () => unwrap(api.post('/admin/settings/reload')),

  users: (params) => unwrap(api.get('/admin/users', { params })),
  user: (id) => unwrap(api.get(`/admin/users/${id}`)),
  userStats: (id) => unwrap(api.get(`/admin/users/${id}/stats`)),
  updateUser: (id, data) => unwrap(api.patch(`/admin/users/${id}`, data)),
  unlockUser: (id) => unwrap(api.post(`/admin/users/${id}/unlock`)),
  resetUserPassword: (id, newPassword) =>
    unwrap(api.post(`/admin/users/${id}/reset-password`, { newPassword })),
  deleteUser: (id) => unwrap(api.delete(`/admin/users/${id}`)),

  jobSources: () => unwrap(api.get('/admin/job-sources')),
  createJobSource: (data) => unwrap(api.post('/admin/job-sources', data)),
  updateJobSource: (id, data) => unwrap(api.put(`/admin/job-sources/${id}`, data)),
  deleteJobSource: (id) => unwrap(api.delete(`/admin/job-sources/${id}`)),
  testJobSource: (id, query) =>
    unwrap(api.post(`/admin/job-sources/${id}/test`, null, { params: { query } })),
  fetchAllSources: () => unwrap(api.post('/admin/job-sources/fetch-all')),

  portals: () => unwrap(api.get('/admin/portals')),
  portalFieldReference: () => unwrap(api.get('/admin/portals/field-reference')),
  createPortal: (data) => unwrap(api.post('/admin/portals', data)),
  updatePortal: (id, data) => unwrap(api.put(`/admin/portals/${id}`, data)),
  deletePortal: (id) => unwrap(api.delete(`/admin/portals/${id}`)),

  scheduler: () => unwrap(api.get('/admin/scheduler')),
  runTask: (id) => unwrap(api.post(`/admin/scheduler/${id}/run`)),
  reloadScheduler: () => unwrap(api.post('/admin/scheduler/reload')),

  prompts: () => unwrap(api.get('/admin/prompts')),
  updatePrompt: (code, data) => unwrap(api.put(`/admin/prompts/${code}`, data)),
  testAi: (prompt) => unwrap(api.post('/admin/ai/test', { prompt })),

  channels: () => unwrap(api.get('/admin/notifications/channels')),
  testChannel: (channel, recipient) =>
    unwrap(api.post('/admin/notifications/test', null, { params: { channel, recipient } })),

  audit: (params) => unwrap(api.get('/admin/audit', { params })),
  auditActions: () => unwrap(api.get('/admin/audit/actions')),
}

export default api
