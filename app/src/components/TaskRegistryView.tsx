import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  DIFFICULTY_LABELS,
  createTaskDefinition,
  TaskDifficulty,
} from '../types';

export function TaskRegistryView() {
  const navigate = useNavigate();
  const { taskDefinitions, deleteTaskDefinition } = useStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = search
    ? taskDefinitions.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      )
    : taskDefinitions;

  // Sort alphabetically
  const sorted = [...filtered].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/settings')}>
          ← Back
        </button>
        <h1>Task Registry</h1>
      </div>

      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {sorted.map((task) => (
        <div key={task.id} className="list-item">
          <div className="list-item-info">
            <h4>{task.title}</h4>
            <p>
              {DIFFICULTY_LABELS[task.defaultDifficulty]}
              {task.defaultDurationMinutes
                ? ` · ${task.defaultDurationMinutes}m`
                : ''}
              {task.defaultProjectIDs.length > 0 ? ' · 📁' : ''}
            </p>
          </div>
          <button className="delete-btn" onClick={() => deleteTaskDefinition(task.id)}>
            ✕
          </button>
        </div>
      ))}

      {sorted.length === 0 && (
        <div className="empty-state">
          <p>{search ? 'No matching tasks' : 'No task definitions yet'}</p>
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 12 }}
        onClick={() => setShowForm(true)}
      >
        + Add Task Definition
      </button>

      {showForm && <TaskFormModal onClose={() => setShowForm(false)} />}
    </div>
  );
}

function TaskFormModal({ onClose }: { onClose: () => void }) {
  const { addTaskDefinition, projects } = useStore();
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(TaskDifficulty.Low);
  const [duration, setDuration] = useState<number | ''>('');
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);

  const handleSave = () => {
    if (!title.trim()) return;
    addTaskDefinition(
      createTaskDefinition({
        title,
        defaultDifficulty: difficulty,
        defaultDurationMinutes: duration || null,
        defaultProjectIDs: linkedProjectId ? [linkedProjectId] : [],
      })
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Task Definition</h2>
          <button className="modal-close" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Default Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value) as TaskDifficulty)}
          >
            {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Default Duration (min, optional)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')}
          />
        </div>

        <div className="form-group">
          <label>Linked Project</label>
          <select
            value={linkedProjectId || ''}
            onChange={(e) =>
              setLinkedProjectId(e.target.value || null)
            }
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
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
