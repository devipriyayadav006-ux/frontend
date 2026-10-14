const API = "http://localhost:8080";

async function request(url, options = {}) {
  const response = await fetch(`${API}${url}`, {
    credentials: "include",
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const body = await response.json(); message = body.message || message; } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const login = (email, password) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const register = (fullName, email, password) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify({ fullName, email, password }) });
export const me = () => request("/api/auth/me");
export const logout = () => request("/api/auth/logout", { method: "POST" });
export const getJobs = () => request("/api/jobs");
export const createJob = job => request("/api/jobs", { method: "POST", body: JSON.stringify(job) });
export const updateJob = (id, job) => request(`/api/jobs/${id}`, { method: "PUT", body: JSON.stringify(job) });
export const deleteJob = id => request(`/api/jobs/${id}`, { method: "DELETE" });
export const applyForJob = (jobId, coverLetter) =>
  request("/api/applications", { method: "POST", body: JSON.stringify({ jobId: String(jobId), coverLetter }) });
export const getMyApplications = () => request("/api/applications/mine");
export const getAllApplications = () => request("/api/applications");
export const updateApplication = (id, payload) =>
  request(`/api/applications/${id}/status`, { method: "PUT", body: JSON.stringify(payload) });
