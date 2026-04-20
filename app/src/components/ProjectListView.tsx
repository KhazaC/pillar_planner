import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  ProjectLifecycleStatus,
  ProjectPriority,
  ProjectCadence,
  PRIORITY_LABELS,
  createProject,
} from '../types';

export function ProjectListView() {
  const navigate = useNavigate();
  const {
    projects,
    deleteProject,
    completeProject,
    archiveProject,
    reactivateProject,
  } = useStore();

  const [filter, setFilter] = useState<string>('Active');
  const [showForm, setShowForm] = useState(false);

  const filters = ['Active', 'Completed', 'Archived', 'Abandoned', 'All'];

  const filtered =
    filter === 'All'
      ? projects
      : projects.filter((p) => p.status === filter);

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/settings')}>
          ← Back
        </button>
        <h1>Projects</h1>
      </div>

      <div className="segmented" style={{ marginBottom: 16 }}>
        {filters.map((f) => (
          <button
            key={f}
            className={filter === f ? 'active' : ''}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.map((project) => (
        <div key={project.id} className="list-item">
          <div className="list-item-info">
            <h4>{project.name}</h4>
            <p>
              {project.category && `${project.category} · `}
              {PRIORITY_LABELS[project.priority]} · {project.cadence}
            </p>
          </div>
          <div className="list-item-actions">
            {project.status === ProjectLifecycleStatus.Active ? (
              <>
                <button
                  className="edit-btn"
                  onClick={() => completeProject(project.id, '')}
                >
                  ✓
                </button>
                <button
                  className="edit-btn"
                  onClick={() => archiveProject(project.id, '')}
                >
                  📦
                </button>
              </>
            ) : (
              <button
                className="edit-btn"
                onClick={() => reactivateProject(project.id)}
              >
                ↩
              </button>
            )}
            <button className="delete-btn" onClick={() => deleteProject(project.id)}>
              ✕
            </button>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No {filter.toLowerCase()} projects</p>
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 12 }}
        onClick={() => setShowForm(true)}
      >
        + Add Project
      </button>

      {showForm && <ProjectFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}

function ProjectFormModal({ onClose }: { onClose: () => void }) {
  const { addProject } = useStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>(ProjectPriority.Medium);
  const [cadence, setCadence] = useState<ProjectCadence>(ProjectCadence.Weekly);
  const [tracksCompletion, setTracksCompletion] = useState(false);
  const [exertEligible, setExertEligible] = useState(true);

  const handleSave = () => {
    if (!name.trim()) return;
    addProject(
      createProject({
        name,
        category,
        priority,
        cadence,
        tracksCompletion,
        exertEligible,
      })
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Project</h2>
          <button className="modal-close" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as ProjectPriority)}
          >
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Cadence</label>
          <select value={cadence} onChange={(e) => setCadence(e.target.value as ProjectCadence)}>
            {Object.values(ProjectCadence).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-row">
          <label>Tracks Completion %</label>
          <div
            className={`toggle ${tracksCompletion ? 'on' : ''}`}
            onClick={() => setTracksCompletion(!tracksCompletion)}
          />
        </div>

        <div className="settings-row" style={{ marginTop: 4 }}>
          <label>Exert Eligible</label>
          <div
            className={`toggle ${exertEligible ? 'on' : ''}`}
            onClick={() => setExertEligible(!exertEligible)}
          />
        </div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
