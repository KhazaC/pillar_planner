import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  AdHocStatus,
  AdHocRecurrence,
  TaskDifficulty,
  DIFFICULTY_LABELS,
  createAdHocTask,
} from '../types';

export function AdHocDaySection() {
  const { adHocPlans, resolvedBlocks, toggleAdHocCompletion, skipAdHocForDay, removeAdHocPlan, moveAdHocPlanToBlock } = useStore();
  const [showPicker, setShowPicker] = useState(false);
  const [movingAdHocTaskID, setMovingAdHocTaskID] = useState<string | null>(null);
  const [targetBlockIndex, setTargetBlockIndex] = useState(0);

  const skippedCount = adHocPlans.filter((p) => p.isSkipped).length;
  const skipRate = adHocPlans.length > 0 ? skippedCount / adHocPlans.length : 0;

  return (
    <div className="adhoc-section">
      <div className="adhoc-header">
        <h3>Ad-Hoc Tasks</h3>
        <button className="adhoc-add-btn" onClick={() => setShowPicker(true)}>
          +
        </button>
      </div>

      {adHocPlans.length === 0 ? (
        <div className="empty-state">
          <p>No ad-hoc tasks planned</p>
          <button onClick={() => setShowPicker(true)}>Plan Tasks</button>
        </div>
      ) : (
        <>
          {adHocPlans.map((plan) => (
            <div key={plan.id} className="adhoc-item">
              <button
                className={`action-checkbox ${plan.isCompleted ? 'checked' : ''}`}
                onClick={() => toggleAdHocCompletion(plan.adHocTaskID)}
              >
                {plan.isCompleted && '✓'}
              </button>
              <div className="action-info">
                <div
                  className={`action-title ${plan.isCompleted ? 'completed' : ''} ${plan.isSkipped ? 'completed' : ''}`}
                >
                  {plan.title}
                </div>
                <div className="action-meta">
                  {plan.skipCount > 0 && (
                    <span className="skip-badge">{plan.skipCount}× skipped</span>
                  )}
                  {plan.timeWindowLabel && <span>{plan.timeWindowLabel}</span>}
                  <span>{plan.effortScore.toFixed(0)} pts</span>
                </div>
              </div>
              <div className="adhoc-actions">
                <button
                  className="adhoc-action-btn skip"
                  onClick={() => skipAdHocForDay(plan.adHocTaskID)}
                >
                  Skip
                </button>
                <button
                  className="adhoc-action-btn"
                  onClick={() => {
                    setMovingAdHocTaskID(plan.adHocTaskID);
                    setTargetBlockIndex(0);
                  }}
                >
                  Move
                </button>
                <button
                  className="adhoc-action-btn remove"
                  onClick={() => removeAdHocPlan(plan.adHocTaskID)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {skipRate > 0.5 && (
            <div className="adhoc-warning">
              ⚠️ High skip rate — consider simplifying
            </div>
          )}
        </>
      )}

      {showPicker && <AdHocPickerModal onClose={() => setShowPicker(false)} />}

      {movingAdHocTaskID && (
        <div className="modal-overlay" onClick={() => setMovingAdHocTaskID(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Move Ad-Hoc Task</h2>
              <button className="modal-close" onClick={() => setMovingAdHocTaskID(null)}>
                Cancel
              </button>
            </div>

            <div className="form-group">
              <label>Move to block</label>
              <select
                value={targetBlockIndex}
                onChange={(e) => setTargetBlockIndex(Number(e.target.value))}
              >
                {resolvedBlocks.map((block, index) => (
                  <option key={`${block.id}-${index}`} value={index}>
                    {block.template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => setMovingAdHocTaskID(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  moveAdHocPlanToBlock(movingAdHocTaskID, targetBlockIndex);
                  setMovingAdHocTaskID(null);
                }}
              >
                Move to Day Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdHocPickerModal({ onClose }: { onClose: () => void }) {
  const {
    adHocTasks,
    adHocPlans,
    taskDefinitions,
    addAdHocTask,
    findOrCreateTaskDefinition,
    planAdHocForDay,
  } = useStore();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeTasks = adHocTasks.filter((t) => t.status === AdHocStatus.Active);
  const plannedIds = new Set(adHocPlans.map((p) => p.adHocTaskID));

  const taskLabel = (taskID: string) => {
    const td = taskDefinitions.find((t) => t.id === taskID);
    return td?.title || 'Unknown task';
  };

  const filtered = activeTasks.filter((t) =>
    taskLabel(t.taskID).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Plan Ad-Hoc Tasks</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(true)}>
              + New
            </button>
            <button className="modal-close" onClick={onClose}>
              Done
            </button>
          </div>
        </div>

        <input
          className="search-bar"
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No active ad-hoc tasks</p>
          </div>
        ) : (
          filtered.map((task) => (
            <div key={task.id} className="list-item">
              <div className="list-item-info">
                <h4>{taskLabel(task.taskID)}</h4>
                <p>
                  {task.estimatedMinutes ? `${task.estimatedMinutes}m` : ''}{' '}
                  {task.recurrence}
                </p>
              </div>
              {plannedIds.has(task.id) ? (
                <span style={{ color: 'var(--green)' }}>✓</span>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => planAdHocForDay(task)}
                >
                  Plan
                </button>
              )}
            </div>
          ))
        )}

        {showCreateModal && (
          <AdHocCreateModal
            onClose={() => setShowCreateModal(false)}
            onCreate={({ title, recurrence, estimatedMinutes, difficulty }) => {
              const taskDef = findOrCreateTaskDefinition(title);
              addAdHocTask(
                createAdHocTask({
                  taskID: taskDef.id,
                  recurrence,
                  estimatedMinutes,
                  difficulty,
                })
              );
              setShowCreateModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function AdHocCreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    recurrence: AdHocRecurrence;
    estimatedMinutes: number | null;
    difficulty: TaskDifficulty;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<AdHocRecurrence>(AdHocRecurrence.RePlannable);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(TaskDifficulty.Low);

  const handleCreate = () => {
    const normalized = title.trim();
    if (!normalized) return;
    onCreate({
      title: normalized,
      recurrence,
      estimatedMinutes: estimatedMinutes === '' ? null : estimatedMinutes,
      difficulty,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Ad-Hoc Task</h2>
          <button className="modal-close" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Recurrence</label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as AdHocRecurrence)}
          >
            {Object.values(AdHocRecurrence).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Estimated Duration (minutes, optional)</label>
          <input
            type="number"
            value={estimatedMinutes}
            onChange={(e) =>
              setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')
            }
          />
        </div>

        <div className="form-group">
          <label>Default Rating</label>
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

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
