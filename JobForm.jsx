import { useEffect, useState } from "react";

const emptyJob = { title:"", company:"", location:"", jobType:"Full-time", description:"", salaryMin:"", salaryMax:"" };

export default function JobForm({ editingJob, onSave, onCancel }) {
  const [job, setJob] = useState(emptyJob);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setJob(editingJob ? { ...editingJob, salaryMin: editingJob.salaryMin ?? "", salaryMax: editingJob.salaryMax ?? "" } : emptyJob);
    setError("");
  }, [editingJob]);
  function change(e) { setJob(v => ({ ...v, [e.target.name]: e.target.value })); }
  async function submit(e) {
    e.preventDefault(); setError("");
    if (job.salaryMin !== "" && job.salaryMax !== "" && Number(job.salaryMin) > Number(job.salaryMax)) {
      setError("Minimum salary cannot exceed maximum salary."); return;
    }
    const payload = { ...job, salaryMin: job.salaryMin === "" ? null : Number(job.salaryMin), salaryMax: job.salaryMax === "" ? null : Number(job.salaryMax) };
    setSaving(true);
    try { await onSave(payload); if (!editingJob) setJob(emptyJob); }
    catch (err) { setError(err.message || "Could not save job."); }
    finally { setSaving(false); }
  }
  return <form className="panel" onSubmit={submit}>
    <div className="section-heading"><div><p className="eyebrow">ADMIN WORKSPACE</p><h2>{editingJob ? "Edit job" : "Post a new job"}</h2></div>
      {editingJob && <button className="button secondary" type="button" onClick={onCancel}>Cancel</button>}</div>
    <div className="form-grid">
      <label>Job title<input name="title" value={job.title} onChange={change} required maxLength="150" /></label>
      <label>Company<input name="company" value={job.company} onChange={change} required maxLength="150" /></label>
      <label>Location<input name="location" value={job.location} onChange={change} required maxLength="150" /></label>
      <label>Job type<select name="jobType" value={job.jobType} onChange={change}><option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option><option>Remote</option></select></label>
      <label>Minimum annual salary (₹)<input type="number" min="0" name="salaryMin" value={job.salaryMin} onChange={change} /></label>
      <label>Maximum annual salary (₹)<input type="number" min="0" name="salaryMax" value={job.salaryMax} onChange={change} /></label>
      <label className="full-width">Job description<textarea name="description" rows="4" value={job.description} onChange={change} required /></label>
    </div>
    {error && <p className="error-message">{error}</p>}
    <button className="button primary" disabled={saving}>{saving ? "Saving..." : editingJob ? "Save changes" : "Publish job"}</button>
  </form>;
}
