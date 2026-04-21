import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  type TaskDefinition,
  DIFFICULTY_LABELS,
  createTaskDefinition,
  TaskDifficulty,
} from '../types';

export function TaskRegistryView() {
  const navigate = useNavigate();
  const { taskDefinitions, deleteTaskDefinition } = useStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);

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
              {task.requiresCompletionDetails ? ' · detailed completion' : ''}
              {task.defaultProjectIDs.length > 0 ? ' · 📁' : ''}
            </p>
          </div>
          <button
            className="edit-btn"
            style={{ marginRight: 8 }}
            onClick={() => setEditingTask(task)}
          >
            Edit
          </button>
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
      {editingTask && (
        <TaskFormModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

function TaskFormModal({
  task,
  onClose,
}: {
  task?: TaskDefinition;
  onClose: () => void;
}) {
  const { addTaskDefinition, updateTaskDefinition, projects } = useStore();
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title || '');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(task?.defaultDifficulty || TaskDifficulty.Low);
  const [duration, setDuration] = useState<number | ''>(task?.defaultDurationMinutes ?? '');
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(task?.defaultProjectIDs[0] || null);
  const [requiresCompletionDetails, setRequiresCompletionDetails] = useState(
    task?.requiresCompletionDetails ?? false
  );

  const handleSave = () => {
    if (!title.trim()) return;
    if (task) {
      updateTaskDefinition({
        ...task,
        title,
        defaultDifficulty: difficulty,
        defaultDurationMinutes: duration || null,
        defaultProjectIDs: linkedProjectId ? [linkedProjectId] : [],
        requiresCompletionDetails,
      });
    } else {
      addTaskDefinition(
        createTaskDefinition({
          title,
          defaultDifficulty: difficulty,
          defaultDurationMinutes: duration || null,
          defaultProjectIDs: linkedProjectId ? [linkedProjectId] : [],
          requiresCompletionDetails,
        })
      );
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task Definition' : 'New Task Definition'}</h2>
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

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={requiresCompletionDetails}
              onChange={(e) => setRequiresCompletionDetails(e.target.checked)}
            />
            Prompt for duration and rating on completion
          </label>
        </div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
