import { MapPin, BriefcaseBusiness, Building2, IndianRupee, Pencil, Trash2 } from "lucide-react";

function salary(job) {
  if (job.salaryMin == null && job.salaryMax == null) return "Salary not disclosed";
  const format = value => value == null ? null : `₹${Number(value).toLocaleString("en-IN")}`;
  if (job.salaryMin != null && job.salaryMax != null) return `${format(job.salaryMin)} – ${format(job.salaryMax)}`;
  return job.salaryMin != null ? `From ${format(job.salaryMin)}` : `Up to ${format(job.salaryMax)}`;
}

export default function JobList({ jobs, onEdit, onDelete, deletingId }) {
  if (!jobs.length) return <div className="empty-state"><BriefcaseBusiness size={34} /><h3>No jobs found</h3><p>Try a different search or publish a new job listing.</p></div>;
  return (
    <div className="jobs-grid">
      {jobs.map(job => <article className="job-card" key={job.id}>
        <div className="job-card-top"><div className="company-icon"><Building2 size={23} /></div><span className="job-type">{job.jobType}</span></div>
        <h3>{job.title}</h3><p className="company-name">{job.company}</p>
        <div className="job-meta"><MapPin size={16} /><span>{job.location}</span></div>
        <div className="job-meta"><IndianRupee size={16} /><span>{salary(job)}</span></div>
        <p className="job-description">{job.description}</p>
        <div className="job-actions">
          <button className="button secondary" onClick={() => onEdit(job)}><Pencil size={15} /> Edit</button>
          <button className="button danger" disabled={deletingId === job.id} onClick={() => onDelete(job.id)}><Trash2 size={15} /> {deletingId === job.id ? "Deleting..." : "Delete"}</button>
        </div>
      </article>)}
    </div>
  );
}
