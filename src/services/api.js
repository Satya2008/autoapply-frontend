import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
}

export const jobsApi = {
  getAll: () => api.get('/jobs'),
  search: (keyword) => api.get(`/jobs/search?keyword=${keyword}`),
  fetchNew: (query) => api.post(`/jobs/fetch?query=${query}`),
}

export const matchApi = {
  runMatching: (userId) => api.post(`/matches/run/${userId}`),
  getMatches: (userId) => api.get(`/matches/${userId}`),
  getRecommended: (userId) => api.get(`/matches/${userId}/recommended`),
}

export const applyApi = {
  startAutoApply: (userId) => api.post(`/apply/run/${userId}`),
  getHistory: (userId) => api.get(`/apply/history/${userId}`),
}

export default api
