import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import type { ResolvedBlock } from '../types';
import { AnchorPhase, COLOR_MAP, DIFFICULTY_LABELS, TaskDifficulty, effortScore } from '../types';
import { AdHocDaySection } from './AdHocDaySection';

export function DayView() {
  const {
    routineTemplates,
    selectedRoutine,
    resolvedBlocks,
    taskDefinitions,
    isLoading,
    errorMessage,
    selectRoutine,
    loadDay,
    toggleAction,
    completeActionWithDetails,
    updateNote,
  } = useStore();

  const contentRef = useRef<HTMLDivElement>(null);
  const [pendingCompletion, setPendingCompletion] = useState<{
    blockIndex: number;
    actionIndex: number;
    title: string;
    durationMinutes: number | '';
    difficulty: TaskDifficulty;
  } | null>(null);

  useEffect(() => {
    if (selectedRoutine) {
      loadDay();
    }
  }, [selectedRoutine]);

  // Auto-scroll to active block
  useEffect(() => {
    if (resolvedBlocks.length > 0 && contentRef.current) {
      const now = new Date();
      const activeIdx = resolvedBlocks.findIndex(
        (b) => now >= b.startTime && now < b.endTime
      );
      if (activeIdx >= 0) {
        const el = contentRef.current.querySelector(`[data-block-index="${activeIdx}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [resolvedBlocks]);

  const handleToggleAction = (blockIndex: number, actionIndex: number) => {
    const action = resolvedBlocks[blockIndex]?.actions[actionIndex];
    if (!action) return;

    if (action.isCompleted) {
      toggleAction(blockIndex, actionIndex);
      return;
    }

    const taskDef = action.taskID
      ? taskDefinitions.find((td) => td.id === action.taskID)
      : null;

    if (taskDef?.requiresCompletionDetails) {
      setPendingCompletion({
        blockIndex,
        actionIndex,
        title: action.title,
        durationMinutes: action.durationMinutes ?? '',
        difficulty: action.difficulty,
      });
      return;
    }

    toggleAction(blockIndex, actionIndex);
  };

  return (
    <>
      {/* Routine selector */}
      <div className="routine-selector">
        {routineTemplates.map((r) => (
          <button
            key={r.id}
            className={`routine-pill ${selectedRoutine?.id === r.id ? 'active' : ''}`}
            onClick={() => selectRoutine(r)}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div ref={contentRef}>
        {isLoading && (
          <div className="loading-state">
            <div className="spinner" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Loading prayer times...
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="error-state">
            <div className="icon">📡</div>
            <p>{errorMessage}</p>
            <button className="retry-btn" onClick={() => loadDay()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && resolvedBlocks.length > 0 && (
          <>
            <AdHocDaySection />
            {resolvedBlocks.map((block, i) => (
              <BlockRow
                key={block.id}
                block={block}
                index={i}
                onToggleAction={(ai) => handleToggleAction(i, ai)}
                onUpdateNote={(note) => updateNote(i, note)}
              />
            ))}
          </>
        )}
      </div>

      {pendingCompletion && (
        <CompletionDetailsModal
          title={pendingCompletion.title}
          durationMinutes={pendingCompletion.durationMinutes}
          difficulty={pendingCompletion.difficulty}
          onChangeDuration={(value) =>
            setPendingCompletion((prev) =>
              prev ? { ...prev, durationMinutes: value } : prev
            )
          }
          onChangeDifficulty={(value) =>
            setPendingCompletion((prev) =>
              prev ? { ...prev, difficulty: value } : prev
            )
          }
          onClose={() => setPendingCompletion(null)}
          onConfirm={() => {
            if (!pendingCompletion) return;
            completeActionWithDetails(pendingCompletion.blockIndex, pendingCompletion.actionIndex, {
              durationMinutes:
                pendingCompletion.durationMinutes === ''
                  ? null
                  : pendingCompletion.durationMinutes,
              difficulty: pendingCompletion.difficulty,
            });
            setPendingCompletion(null);
          }}
        />
      )}
    </>
  );
}

function CompletionDetailsModal({
  title,
  durationMinutes,
  difficulty,
  onChangeDuration,
  onChangeDifficulty,
  onClose,
  onConfirm,
}: {
  title: string;
  durationMinutes: number | '';
  difficulty: TaskDifficulty;
  onChangeDuration: (value: number | '') => void;
  onChangeDifficulty: (value: TaskDifficulty) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Complete Task</h2>
          <button className="modal-close" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="form-group">
          <label>Task</label>
          <input value={title} disabled />
        </div>

        <div className="form-group">
          <label>Duration (minutes)</label>
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => onChangeDuration(e.target.value ? Number(e.target.value) : '')}
          />
        </div>

        <div className="form-group">
          <label>Rating (difficulty/quality)</label>
          <select
            value={difficulty}
            onChange={(e) => onChangeDifficulty(Number(e.target.value) as TaskDifficulty)}
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
          <button className="btn btn-primary" onClick={onConfirm}>
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BlockRow Component ──────────────────────────────────

interface BlockRowProps {
  block: ResolvedBlock;
  index: number;
  onToggleAction: (actionIndex: number) => void;
  onUpdateNote: (note: string) => void;
}

function BlockRow({ block, index, onToggleAction, onUpdateNote }: BlockRowProps) {
  const now = new Date();
  const isActive = now >= block.startTime && now < block.endTime;
  const isPast = now >= block.endTime;
  const [expanded, setExpanded] = useState(isActive);
  const [userToggled, setUserToggled] = useState(false);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (isActive && !userToggled) setExpanded(true);
  }, [isActive]);

  const handleToggle = () => {
    setExpanded(!expanded);
    setUserToggled(true);
  };

  const doneCount = block.actions.filter((a) => a.isCompleted).length;
  const totalCount = block.actions.length;
  const allDone = doneCount === totalCount && totalCount > 0;
  const color = COLOR_MAP[block.template.colorTag] || COLOR_MAP.blue;

  const startStr = format(block.startTime, 'h:mm a');
  const endStr = format(block.endTime, 'h:mm a');
  const durationMin = Math.round(
    (block.endTime.getTime() - block.startTime.getTime()) / 60_000
  );
  const durationStr =
    durationMin >= 60
      ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
      : `${durationMin}m`;

  const handleNoteChange = useCallback(
    (value: string) => {
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
      noteTimerRef.current = setTimeout(() => onUpdateNote(value), 500);
    },
    [onUpdateNote]
  );

  // Group actions by phase if any have phases
  const hasPhases = block.actions.some((a) => a.anchorPhase !== AnchorPhase.None);

  return (
    <div className="block-row" data-block-index={index}>
      <div className="timeline-bar">
        <div
          className={`timeline-dot ${isActive ? 'active' : isPast ? 'past' : 'future'}`}
          style={{ backgroundColor: color, borderColor: color }}
        />
        <div className="timeline-line" />
      </div>

      <div className="block-content">
        <div className="block-header" onClick={handleToggle}>
          <h3>{block.template.name}</h3>
          <span className="block-time">
            {startStr} – {endStr} · {durationStr}
          </span>
          {isActive && <span className="now-badge">NOW</span>}
          {!expanded && (
            <span className={`done-badge ${allDone ? 'all-done' : ''}`}>
              {doneCount}/{totalCount}
            </span>
          )}
          <span className={`chevron ${expanded ? 'expanded' : ''}`}>▼</span>
        </div>

        {expanded && (
          <div className={`block-expanded ${isActive ? 'block-active-bg' : ''}`}>
            {hasPhases ? (
              <PhasedActions actions={block.actions} onToggle={onToggleAction} />
            ) : (
              block.actions.map((action, ai) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  onToggle={() => onToggleAction(ai)}
                />
              ))
            )}

            <div className="reflection-section">
              <div className="reflection-label">Reflection</div>
              <textarea
                className="reflection-input"
                placeholder="How did this block go?"
                defaultValue={block.note}
                onChange={(e) => handleNoteChange(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phased Actions ──────────────────────────────────────

function PhasedActions({
  actions,
  onToggle,
}: {
  actions: ResolvedBlock['actions'];
  onToggle: (index: number) => void;
}) {
  const phases = [
    { phase: AnchorPhase.PreAnchor, label: 'BEFORE' },
    { phase: AnchorPhase.Anchor, label: 'PRAYER' },
    { phase: AnchorPhase.PostAnchor, label: 'AFTER' },
    { phase: AnchorPhase.None, label: '' },
  ];

  return (
    <>
      {phases.map(({ phase, label }) => {
        const phaseActions = actions
          .map((a, i) => ({ action: a, index: i }))
          .filter(({ action }) => action.anchorPhase === phase);
        if (phaseActions.length === 0) return null;

        return (
          <div key={phase}>
            {label && <div className="phase-label">{label}</div>}
            {phaseActions.map(({ action, index }) => (
              <ActionRow
                key={action.id}
                action={action}
                onToggle={() => onToggle(index)}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

// ─── Action Row ──────────────────────────────────────────

function ActionRow({
  action,
  onToggle,
}: {
  action: ResolvedBlock['actions'][0];
  onToggle: () => void;
}) {
  const pts = effortScore(action.durationMinutes, action.difficulty);

  return (
    <div className="action-row">
      <button
        className={`action-checkbox ${action.isCompleted ? 'checked' : ''}`}
        onClick={onToggle}
      >
        {action.isCompleted && '✓'}
      </button>
      <div className="action-info">
        <div className={`action-title ${action.isCompleted ? 'completed' : ''}`}>
          {action.title}
        </div>
        <div className="action-meta">
          {action.durationMinutes && <span>{action.durationMinutes}m</span>}
          <span className={`action-pts ${action.isCompleted ? 'earned' : ''}`}>
            {pts.toFixed(0)} pts
          </span>
        </div>
      </div>
    </div>
  );
}
