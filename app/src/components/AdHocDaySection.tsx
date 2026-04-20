import { useState } from 'react';
import { useStore } from '../store/useStore';
import { AdHocStatus } from '../types';

export function AdHocDaySection() {
  const { adHocPlans, toggleAdHocCompletion, skipAdHocForDay, removeAdHocPlan } = useStore();
  const [showPicker, setShowPicker] = useState(false);

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
    </div>
  );
}

function AdHocPickerModal({ onClose }: { onClose: () => void }) {
  const { adHocTasks, adHocPlans, planAdHocForDay } = useStore();
  const [search, setSearch] = useState('');

  const activeTasks = adHocTasks.filter((t) => t.status === AdHocStatus.Active);
  const plannedIds = new Set(adHocPlans.map((p) => p.adHocTaskID));

  const filtered = activeTasks.filter((t) =>
    t.taskID.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Plan Ad-Hoc Tasks</h2>
          <button className="modal-close" onClick={onClose}>
            Done
          </button>
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
                <h4>{task.taskID}</h4>
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
      </div>
    </div>
  );
}
