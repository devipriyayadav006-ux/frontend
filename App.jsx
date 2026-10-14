import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Search, LogOut, UserRound, Building2, CalendarClock, RefreshCw } from "lucide-react";
import JobForm from "./components/JobForm.jsx";
import {
  login, register, me, logout, getJobs, createJob, updateJob, deleteJob,
  applyForJob, getMyApplications, getAllApplications, updateApplication
} from "./services/jobService.js";

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (mode === "register") {
        await register(fullName, email, password);
        setMode("login");
        setError("Account created. Log in with your new account.");
      } else {
        await onLogin(email, password);
      }
    } catch (err) { setError(err.message || "Authentication failed."); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-art">
      <a className="brand brand-light" href="#"><span className="brand-mark"><BriefcaseBusiness size={20}/></span> JobConnect</a>
      <div className="auth-message"><p className="eyebrow light">CAREERS START HERE</p><h1>Your next opportunity is closer than you think.</h1><p>Find roles, apply with confidence, and follow your application journey in one place.</p></div>
      <div className="auth-decoration">JC</div>
    </section>
    <section className="auth-form-wrap">
      <form className="auth-form" onSubmit={submit}>
        <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN JOBCONNECT"}</p>
        <h2>{mode === "login" ? "Sign in to your account" : "Create a job seeker account"}</h2>
        <p className="auth-subtitle">{mode === "login" ? "Use your registered email and password." : "Register as a user to explore and apply for jobs."}</p>
        {mode === "register" && <label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} required maxLength="120" autoComplete="name"/></label>}
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength="8" autoComplete={mode==="login"?"current-password":"new-password"}/></label>
        {error && <p className={error.startsWith("Account created") ? "success-text" : "error-message"}>{error}</p>}
        <button className="button primary auth-submit" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
        <p className="auth-switch">{mode === "login" ? "New to JobConnect?" : "Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}}>{mode==="login"?"Create an account":"Sign in"}</button></p>
        <p className="auth-note">Admin access is provided by the system administrator. User registration cannot create admin accounts.</p>
      </form>
    </section>
  </main>;
}

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [search, setSearch] = useState("");
  const [coverLetters, setCoverLetters] = useState({});
  const [interviewFields, setInterviewFields] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    me().then(setUser).catch(()=>setUser(null)).finally(()=>setAuthChecked(true));
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try { setJobs(await getJobs()); setError(""); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadApplications = useCallback(async (role) => {
    try {
      setApplications(role === "ADMIN" ? await getAllApplications() : await getMyApplications());
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    if (user) { loadJobs(); loadApplications(user.role); }
  }, [user, loadJobs, loadApplications]);

  async function handleLogin(email, password) {
    const loggedIn = await login(email, password);
    setUser(loggedIn); setNotice(`Welcome, ${loggedIn.fullName}.`); setError("");
  }

  async function handleLogout() {
    try { await logout(); } finally { setUser(null); setJobs([]); setApplications([]); setNotice(""); }
  }

  async function saveJob(job) {
    if (editingJob) { await updateJob(editingJob.id, job); setEditingJob(null); setNotice("Job updated."); }
    else { await createJob(job); setNotice("Job published."); }
    await loadJobs();
  }

  async function removeJob(id) {
    if (!window.confirm("Delete this job? Applications linked to it may prevent deletion.")) return;
    try { await deleteJob(id); setNotice("Job deleted."); await loadJobs(); }
    catch (e) { setError(e.message); }
  }

  async function apply(jobId) {
    try {
      await applyForJob(jobId, coverLetters[jobId] || "");
      setNotice("Application submitted successfully.");
      setCoverLetters(v=>({...v,[jobId]:""}));
      await loadApplications("USER");
    } catch (e) { setError(e.message); }
  }

  async function saveApplicationStatus(app) {
    const fields = interviewFields[app.id] || {};
    const payload = {
      status: fields.status || app.status,
      interviewAt: fields.interviewAt ? fields.interviewAt.replace("T", "T") : "",
      interviewNotes: fields.interviewNotes ?? app.interviewNotes ?? ""
    };
    try {
      await updateApplication(app.id, payload);
      setNotice("Application status updated.");
      await loadApplications("ADMIN");
    } catch (e) { setError(e.message); }
  }

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs.filter(j => [j.title,j.company,j.location,j.jobType,j.description].some(v=>v?.toLowerCase().includes(term)));
  }, [jobs, search]);

  if (!authChecked) return <div className="loading-screen">Loading JobConnect...</div>;
  if (!user) return <AuthScreen onLogin={handleLogin}/>;

  return <div className="app-shell">
    <nav className="navbar">
      <a className="brand" href="#"><span className="brand-mark"><BriefcaseBusiness size={20}/></span> JobConnect</a>
      <div className="nav-right"><span className="role-chip">{user.role === "ADMIN" ? "ADMIN WORKSPACE" : "JOB SEEKER"}</span><span className="user-name"><UserRound size={16}/>{user.fullName}</span><button className="button secondary" onClick={handleLogout}><LogOut size={15}/> Sign out</button></div>
    </nav>
    <header className="hero"><div className="hero-content">
      <p className="eyebrow light">{user.role === "ADMIN" ? "RECRUITMENT CONTROL CENTER" : "YOUR NEXT CHAPTER STARTS HERE"}</p>
      <h1>{user.role === "ADMIN" ? <>Manage talent.<br/><span>Build your team.</span></> : <>Find work that<br/><span>moves you forward.</span></>}</h1>
      <p className="hero-copy">{user.role === "ADMIN" ? "Publish job openings, review applicants, and coordinate interviews." : "Discover opportunities and track your applications from one place."}</p>
      {user.role === "USER" && <div className="hero-search"><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search job title, company, skill or location"/></div>}
    </div></header>

    <main className="main-content">
      {error && <div className="error-banner"><div><strong>Action needs attention</strong><p>{error}</p></div><button className="button secondary" onClick={()=>{setError("");loadJobs();loadApplications(user.role);}}>Dismiss / retry</button></div>}
      {notice && <div className="success-message">{notice}<button onClick={()=>setNotice("")}>×</button></div>}

      {user.role === "ADMIN" ? <>
        <section className="stats-row">
          <div className="stat-card"><span className="stat-icon"><Building2 size={19}/></span><div><strong>{jobs.length}</strong><span>Published jobs</span></div></div>
          <div className="stat-card"><span className="stat-icon"><UserRound size={19}/></span><div><strong>{applications.length}</strong><span>Applications received</span></div></div>
          <div className="stat-card"><span className="stat-icon"><CalendarClock size={19}/></span><div><strong>{applications.filter(a=>a.status==="INTERVIEW_SCHEDULED").length}</strong><span>Interviews scheduled</span></div></div>
        </section>
        <section className="admin-grid"><div><JobForm editingJob={editingJob} onSave={saveJob} onCancel={()=>setEditingJob(null)}/></div>
          <section className="panel"><div className="section-heading"><div><p className="eyebrow">JOB MANAGEMENT</p><h2>Published jobs</h2></div><button className="button secondary" onClick={loadJobs}><RefreshCw size={14}/> Refresh</button></div>
            {jobs.length===0?<p className="muted">No jobs posted yet.</p>:jobs.map(job=><div className="admin-job" key={job.id}><div><strong>{job.title}</strong><p>{job.company} · {job.location}</p></div><div className="inline-actions"><button className="button secondary" onClick={()=>{setEditingJob(job);window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});}}>Edit</button><button className="button danger" onClick={()=>removeJob(job.id)}>Delete</button></div></div>)}
          </section>
        </section>
        <section className="panel applications-panel"><div className="section-heading"><div><p className="eyebrow">CANDIDATE PIPELINE</p><h2>Job applications ({applications.length})</h2></div><button className="button secondary" onClick={()=>loadApplications("ADMIN")}><RefreshCw size={14}/> Refresh</button></div>
          {applications.length===0?<p className="muted">No applications received yet. They will appear here when users apply.</p>:<div className="table-wrap"><table><thead><tr><th>Applicant</th><th>Job</th><th>Application</th><th>Interview / decision</th><th>Action</th></tr></thead><tbody>
            {applications.map(app=>{const fields=interviewFields[app.id]||{};return <tr key={app.id}>
              <td><strong>{app.applicantName}</strong><small>{app.applicantEmail}</small></td>
              <td><strong>{app.title}</strong><small>{app.company} · {app.location}</small></td>
              <td><span className={`status status-${app.status.toLowerCase()}`}>{app.status.replaceAll("_"," ")}</span>{app.coverLetter&&<details><summary>Cover letter</summary><p>{app.coverLetter}</p></details>}<small>Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleString() : "—"}</small></td>
              <td className="interview-cell"><select value={fields.status||app.status} onChange={e=>setInterviewFields(v=>({...v,[app.id]:{...v[app.id],status:e.target.value}}))}><option value="APPLIED">Applied</option><option value="SHORTLISTED">Shortlisted</option><option value="INTERVIEW_SCHEDULED">Schedule interview</option><option value="REJECTED">Rejected</option><option value="HIRED">Hired</option></select>
                <input type="datetime-local" aria-label="Interview date and time" value={fields.interviewAt ?? (app.interviewAt ? app.interviewAt.slice(0,16) : "")} onChange={e=>setInterviewFields(v=>({...v,[app.id]:{...v[app.id],interviewAt:e.target.value}}))}/>
                <input placeholder="Interview notes / meeting details" value={fields.interviewNotes ?? app.interviewNotes ?? ""} onChange={e=>setInterviewFields(v=>({...v,[app.id]:{...v[app.id],interviewNotes:e.target.value}}))}/>
              </td>
              <td><button className="button primary" onClick={()=>saveApplicationStatus(app)}>Save</button></td>
            </tr>})}
          </tbody></table></div>}
        </section>
      </> : <>
        <section className="list-section"><div className="section-heading"><div><p className="eyebrow">EXPLORE OPPORTUNITIES</p><h2>Available jobs <span className="count-pill">{filteredJobs.length}</span></h2></div><button className="button secondary" onClick={loadJobs}><RefreshCw size={14}/> Refresh</button></div>
          {loading?<p className="muted">Loading jobs...</p>:<div className="jobs-grid">{filteredJobs.map(job=><article className="job-card" key={job.id}><div className="job-card-top"><div className="company-icon"><Building2 size={23}/></div><span className="job-type">{job.jobType}</span></div><h3>{job.title}</h3><p className="company-name">{job.company}</p><p className="job-meta">{job.location}</p><p className="job-description">{job.description}</p><p className="salary">{job.salaryMin==null&&job.salaryMax==null?"Salary not disclosed":`₹${Number(job.salaryMin||0).toLocaleString("en-IN")} – ${job.salaryMax==null?"Not specified":`₹${Number(job.salaryMax).toLocaleString("en-IN")}`}`}</p><label className="cover-label">Cover letter (optional)<textarea rows="2" value={coverLetters[job.id]||""} onChange={e=>setCoverLetters(v=>({...v,[job.id]:e.target.value}))} placeholder="Introduce yourself briefly"/></label><button className="button primary" onClick={()=>apply(job.id)}>Apply for this job</button></article>)}</div>}
        </section>
        <section className="panel applications-panel"><div className="section-heading"><div><p className="eyebrow">YOUR PROGRESS</p><h2>My applications ({applications.length})</h2></div><button className="button secondary" onClick={()=>loadApplications("USER")}><RefreshCw size={14}/> Refresh</button></div>
          {applications.length===0?<p className="muted">You haven't applied for any jobs yet.</p>:<div className="my-applications">{applications.map(app=><article className="my-app" key={app.id}><div><h3>{app.title}</h3><p>{app.company} · {app.location}</p><span className={`status status-${app.status.toLowerCase()}`}>{app.status.replaceAll("_"," ")}</span>{app.interviewAt&&<p className="interview-info"><CalendarClock size={15}/> Interview: {new Date(app.interviewAt).toLocaleString()}</p>}{app.interviewNotes&&<p className="muted">{app.interviewNotes}</p>}</div><small>Applied {app.appliedAt?new Date(app.appliedAt).toLocaleDateString():""}</small></article>)}</div>}
        </section>
      </>}
    </main>
    <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><BriefcaseBusiness size={18}/></span> JobConnect</a><span>Job portal · React, Spring Boot and MySQL</span></footer>
  </div>;
}

export default App;
