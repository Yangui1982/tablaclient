import axios from 'axios'

const base = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1'

export const api = axios.create({ baseURL: base })

export const setToken  = t => localStorage.setItem('jwt', t)
export const getToken  = () => localStorage.getItem('jwt')
export const clearToken = () => localStorage.removeItem('jwt')

api.interceptors.request.use(cfg => {
  const t = getToken()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(err)
  }
)
