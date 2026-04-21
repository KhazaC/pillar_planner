import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import quickStartBundle from '../data/quickStartBundle.json';
import type { BlockTemplate, RoutineTemplate, BlockAnchor } from '../types';
import {
  NotificationMode,
  COLOR_MAP,
  anchorShortLabel,
  blockDurationMinutes,
  blockPreAnchorMinutes,
  PrayerTime,
  createBlockTemplate,
  createRoutineTemplate,
  createActionItem,
  createTaskDefinition,
  AnchorPhase,
  TaskDifficulty,
  DIFFICULTY_LABELS,
  VALID_COLORS,
} from '../types';

export function SettingsView() {
  const navigate = useNavigate();
  const {
    city,
    setCity,
    notificationMode,
    setNotificationMode,
    includeNap,
    setIncludeNap,
    blockTemplates,
    routineTemplates,
    deleteBlock,
    deleteRoutine,
    exportBundle,
    importBundle,
    initialize,
  } = useStore();

  const [cityInput, setCityInput] = useState(city);
  const [showBlockEditor, setShowBlockEditor] = useState<BlockTemplate | null | 'new'>(null);
  const [showRoutineEditor, setShowRoutineEditor] = useState<RoutineTemplate | null | 'new'>(null);
  const [importText, setImportText] = useState('');

  const handleCityBlur = () => {
    if (cityInput.trim() && cityInput !== city) {
      setCity(cityInput.trim());
    }
  };

  const handleExport = () => {
    const json = exportBundle();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sigh-bundle.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (mode: 'replace' | 'merge') => {
    if (importText.trim()) {
      importBundle(importText, mode);
      initialize();
      setImportText('');
    }
  };

  const handleQuickStart = () => {
    const confirmed = window.confirm(
      'Load quick start bundle and replace your current templates, routines, projects, and tasks?'
    );
    if (!confirmed) return;

    importBundle(JSON.stringify(quickStartBundle), 'replace');
    initialize();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1>Settings</h1>
      </div>

      {/* City */}
      <div className="settings-section">
        <h3>City</h3>
        <div className="settings-row">
          <label>Prayer times city</label>
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onBlur={handleCityBlur}
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-row">
          <label>Mode</label>
          <select
            value={notificationMode}
            onChange={(e) => setNotificationMode(e.target.value as NotificationMode)}
          >
            {Object.values(NotificationMode).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nap */}
      <div className="settings-section">
        <h3>Qaylulah (Nap)</h3>
        <div className="settings-row">
          <label>Include nap block</label>
          <div
            className={`toggle ${includeNap ? 'on' : ''}`}
            onClick={() => setIncludeNap(!includeNap)}
          />
        </div>
      </div>

      {/* Blocks */}
      <div className="settings-section">
        <h3>Blocks</h3>
        {blockTemplates.map((b) => (
          <div key={b.id} className="list-item">
            <div className="list-item-info">
              <h4>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: COLOR_MAP[b.colorTag] || COLOR_MAP.blue,
                    marginRight: 8,
                  }}
                />
                {b.name}
              </h4>
              <p>{anchorShortLabel(b.anchor)} · {b.actions.length} tasks</p>
            </div>
            <div className="list-item-actions">
              <button className="edit-btn" onClick={() => setShowBlockEditor(b)}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => deleteBlock(b.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        <button
          className="btn btn-primary"
          style={{ marginTop: 8, width: '100%' }}
          onClick={() => setShowBlockEditor('new')}
        >
          + Add Block
        </button>
      </div>

      {/* Routines */}
      <div className="settings-section">
        <h3>Routines</h3>
        {routineTemplates.map((r) => (
          <div key={r.id} className="list-item">
            <div className="list-item-info">
              <h4>{r.name}</h4>
              <p>{r.description || `${r.blockIDs.length} blocks`}</p>
            </div>
            <div className="list-item-actions">
              <button className="edit-btn" onClick={() => setShowRoutineEditor(r)}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => deleteRoutine(r.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        <button
          className="btn btn-primary"
          style={{ marginTop: 8, width: '100%' }}
          onClick={() => setShowRoutineEditor('new')}
        >
          + Add Routine
        </button>
      </div>

      {/* Projects & Task Registry links */}
      <div className="settings-section">
        <h3>Management</h3>
        <button
          className="list-item"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
          onClick={() => navigate('/projects')}
        >
          <div className="list-item-info">
            <h4>Projects</h4>
            <p>Manage project tracking</p>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
        </button>
        <button
          className="list-item"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
          onClick={() => navigate('/tasks')}
        >
          <div className="list-item-info">
            <h4>Task Registry</h4>
            <p>View all task definitions</p>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
        </button>
      </div>

      {/* Import/Export */}
      <div className="settings-section">
        <h3>Import / Export</h3>
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 8 }}
          onClick={handleQuickStart}
        >
          Load Quick Start Bundle
        </button>
        <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 8 }} onClick={handleExport}>
          Export JSON Bundle
        </button>
        <div className="form-group">
          <label>Import JSON</label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste JSON bundle here..."
            rows={4}
          />
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => handleImport('replace')}>
            Replace All
          </button>
          <button className="btn btn-secondary" onClick={() => handleImport('merge')}>
            Merge
          </button>
        </div>
      </div>

      {/* Block Editor Modal */}
      {showBlockEditor && (
        <BlockEditorModal
          block={showBlockEditor === 'new' ? null : showBlockEditor}
          onClose={() => setShowBlockEditor(null)}
        />
      )}

      {/* Routine Editor Modal */}
      {showRoutineEditor && (
        <RoutineEditorModal
          routine={showRoutineEditor === 'new' ? null : showRoutineEditor}
          onClose={() => setShowRoutineEditor(null)}
        />
      )}
    </div>
  );
}

// ─── Block Editor Modal ──────────────────────────────────

function BlockEditorModal({
  block,
  onClose,
}: {
  block: BlockTemplate | null;
  onClose: () => void;
}) {
  const { addBlock, updateBlock, taskDefinitions, addTaskDefinition } = useStore();
  const isNew = !block;

  const [name, setName] = useState(block?.name || '');
  const [colorTag, setColorTag] = useState(block?.colorTag || 'blue');
  const [anchorType, setAnchorType] = useState<BlockAnchor['type']>(
    block?.anchor.type || 'prayerTime'
  );
  const [prayer, setPrayer] = useState<PrayerTime>(
    (block?.anchor.type === 'prayerTime' || block?.anchor.type === 'iqamahTime'
      ? block.anchor.prayer
      : PrayerTime.Fajr)
  );
  const [offsetMinutes, setOffsetMinutes] = useState<number | ''>(
    block?.anchor.type === 'prayerTime' || block?.anchor.type === 'iqamahTime'
      ? (block.anchor.offsetMinutes ?? '')
      : ''
  );
  const [fixedHour, setFixedHour] = useState(
    block?.anchor.type === 'fixedTime' ? block.anchor.hour : 0
  );
  const [fixedMinute, setFixedMinute] = useState(
    block?.anchor.type === 'fixedTime' ? block.anchor.minute : 0
  );
  const [duration, setDuration] = useState<number | ''>(block?.overallDurationMinutes ?? '');
  const [earlyNotif, setEarlyNotif] = useState(block?.earlyNotificationMinutes || 0);
  const [actions, setActions] = useState(block?.actions || []);

  const buildAnchor = (): BlockAnchor => {
    switch (anchorType) {
      case 'prayerTime':
        return {
          type: 'prayerTime',
          prayer,
          offsetMinutes: offsetMinutes === '' ? null : offsetMinutes,
        };
      case 'iqamahTime':
        return {
          type: 'iqamahTime',
          prayer,
          offsetMinutes: offsetMinutes === '' ? null : offsetMinutes,
        };
      case 'fixedTime':
        return { type: 'fixedTime', hour: fixedHour, minute: fixedMinute };
      case 'filler':
        return { type: 'filler' };
    }
  };

  const previewBlock: BlockTemplate = {
    id: block?.id || 'preview',
    name: name || 'Preview',
    anchor: buildAnchor(),
    actions,
    overallDurationMinutes: null,
    earlyNotificationMinutes: earlyNotif,
    colorTag,
  };
  const derivedDuration = blockDurationMinutes(previewBlock);
  const derivedPreAnchor = blockPreAnchorMinutes(previewBlock);

  const handleSave = () => {
    if (!name.trim()) return;
    const cleanedActions = actions.filter((a) => a.taskID && a.title.trim());
    const template: BlockTemplate = block
      ? {
          ...block,
          name,
          colorTag,
          anchor: buildAnchor(),
          overallDurationMinutes: anchorType === 'filler' || duration === '' ? null : duration,
          earlyNotificationMinutes: earlyNotif,
          actions: cleanedActions,
        }
      : createBlockTemplate({
          name,
          colorTag,
          anchor: buildAnchor(),
          overallDurationMinutes: anchorType === 'filler' || duration === '' ? null : duration,
          earlyNotificationMinutes: earlyNotif,
          actions: cleanedActions,
        });

    if (isNew) addBlock(template);
    else updateBlock(template);
    onClose();
  };

  const addAction = () => {
    if (taskDefinitions.length === 0) return;
    const td = taskDefinitions[0];
    setActions([
      ...actions,
      createActionItem({
        title: td.title,
        taskID: td.id,
        durationMinutes: td.defaultDurationMinutes,
        difficulty: td.defaultDifficulty,
        defaultProjectIDs: td.defaultProjectIDs,
      }),
    ]);
  };

  const updateAction = (index: number, updates: Partial<(typeof actions)[0]>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], ...updates };
    setActions(updated);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= actions.length) return;

    const updated = [...actions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setActions(updated);
  };

  const linkActionToTask = (index: number, taskId: string) => {
    const td = taskDefinitions.find((t) => t.id === taskId);
    if (!td) return;
    updateAction(index, {
      taskID: td.id,
      title: td.title,
      durationMinutes: td.defaultDurationMinutes,
      difficulty: td.defaultDifficulty,
      defaultProjectIDs: td.defaultProjectIDs,
    });
  };

  const createTaskAndLink = (index: number, title: string) => {
    const normalized = title.trim();
    if (!normalized) return;
    const existing = taskDefinitions.find(
      (td) => td.title.trim().toLowerCase() === normalized.toLowerCase()
    );
    const td =
      existing ||
      createTaskDefinition({
        title: normalized,
        defaultDurationMinutes: actions[index]?.durationMinutes ?? null,
        defaultDifficulty: actions[index]?.difficulty ?? TaskDifficulty.Low,
        defaultProjectIDs: actions[index]?.defaultProjectIDs ?? [],
      });

    if (!existing) {
      addTaskDefinition(td);
    }

    linkActionToTask(index, td.id);
  };

  const prayers = Object.values(PrayerTime);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? 'New Block' : 'Edit Block'}</h2>
          <button className="modal-close" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Color</label>
          <div className="color-picker">
            {VALID_COLORS.map((c) => (
              <div
                key={c}
                className={`color-swatch ${colorTag === c ? 'selected' : ''}`}
                style={{ background: COLOR_MAP[c] }}
                onClick={() => setColorTag(c)}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Anchor Type</label>
          <div className="segmented">
            {(['prayerTime', 'iqamahTime', 'fixedTime', 'filler'] as const).map((t) => (
              <button
                key={t}
                className={anchorType === t ? 'active' : ''}
                onClick={() => setAnchorType(t)}
              >
                {t === 'prayerTime'
                  ? 'Prayer'
                  : t === 'iqamahTime'
                    ? 'Iqamah'
                    : t === 'fixedTime'
                      ? 'Fixed'
                      : 'Filler'}
              </button>
            ))}
          </div>
        </div>

        {(anchorType === 'prayerTime' || anchorType === 'iqamahTime') && (
          <>
            <div className="form-group">
              <label>Prayer</label>
              <select value={prayer} onChange={(e) => setPrayer(e.target.value as PrayerTime)}>
                {prayers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Offset (minutes)</label>
              <input
                type="number"
                value={offsetMinutes}
                placeholder={anchorType === 'prayerTime' ? `Auto (-${derivedPreAnchor}m)` : 'Auto'}
                onChange={(e) =>
                  setOffsetMinutes(e.target.value === '' ? '' : Number(e.target.value))
                }
              />
            </div>
          </>
        )}

        {anchorType === 'fixedTime' && (
          <div className="form-group">
            <label>Time (0:00 = auto-chain)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                min={0}
                max={23}
                value={fixedHour}
                onChange={(e) => setFixedHour(Number(e.target.value))}
                style={{ width: 70 }}
              />
              <span style={{ lineHeight: '36px' }}>:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={fixedMinute}
                onChange={(e) => setFixedMinute(Number(e.target.value))}
                style={{ width: 70 }}
              />
            </div>
          </div>
        )}

        {anchorType !== 'filler' && (
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={duration}
              placeholder={`Auto (${derivedDuration}m)`}
              onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        )}

        <div className="form-group">
          <label>Early Notification (minutes)</label>
          <input
            type="number"
            min={0}
            max={60}
            step={5}
            value={earlyNotif}
            onChange={(e) => setEarlyNotif(Number(e.target.value))}
          />
        </div>

        {/* Tasks */}
        <div className="form-group">
          <label>Tasks</label>
          {taskDefinitions.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Create tasks in Task Registry first, then add them to this block.
            </p>
          )}
          {actions.map((action, i) => (
            <div
              key={action.id}
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 8,
                padding: 8,
                marginBottom: 6,
              }}
            >
              <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                <select
                  value={action.taskID || ''}
                  onChange={(e) => linkActionToTask(i, e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="" disabled>
                    Select task
                  </option>
                  {taskDefinitions.map((td) => (
                    <option key={td.id} value={td.id}>
                      {td.title}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="min"
                  value={action.durationMinutes ?? ''}
                  onChange={(e) =>
                    updateAction(i, {
                      durationMinutes: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  style={{ width: 60 }}
                />
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  onClick={() => moveAction(i, 'up')}
                  disabled={i === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  onClick={() => moveAction(i, 'down')}
                  disabled={i === actions.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button className="delete-btn" onClick={() => removeAction(i)}>
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                <input
                  placeholder="New task title"
                  value={action.taskID ? '' : action.title}
                  onChange={(e) => updateAction(i, { title: e.target.value, taskID: null })}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  onClick={() => createTaskAndLink(i, action.title)}
                >
                  Create + Link
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={action.anchorPhase}
                  onChange={(e) =>
                    updateAction(i, { anchorPhase: e.target.value as AnchorPhase })
                  }
                  style={{ flex: 1 }}
                >
                  <option value={AnchorPhase.None}>None</option>
                  <option value={AnchorPhase.PreAnchor}>Pre</option>
                  <option value={AnchorPhase.Anchor}>Anchor</option>
                  <option value={AnchorPhase.PostAnchor}>Post</option>
                </select>
                <select
                  value={action.difficulty}
                  onChange={(e) =>
                    updateAction(i, { difficulty: Number(e.target.value) as TaskDifficulty })
                  }
                  style={{ flex: 1 }}
                >
                  {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={addAction}
            disabled={taskDefinitions.length === 0}
          >
            + Add Task
          </button>
        </div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isNew ? 'Create Block' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Routine Editor Modal ────────────────────────────────

function RoutineEditorModal({
  routine,
  onClose,
}: {
  routine: RoutineTemplate | null;
  onClose: () => void;
}) {
  const { addRoutine, updateRoutine, blockTemplates } = useStore();
  const isNew = !routine;

  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [weekdays, setWeekdays] = useState<number[]>(routine?.suggestedWeekdays || []);
  const [blockIDs, setBlockIDs] = useState<string[]>(routine?.blockIDs || []);
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const removeBlock = (index: number) => {
    setBlockIDs(blockIDs.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blockIDs.length) return;

    const updated = [...blockIDs];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setBlockIDs(updated);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const template: RoutineTemplate = routine
      ? { ...routine, name, description, suggestedWeekdays: weekdays, blockIDs }
      : createRoutineTemplate({ name, description, suggestedWeekdays: weekdays, blockIDs });

    if (isNew) addRoutine(template);
    else updateRoutine(template);
    onClose();
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? 'New Routine' : 'Edit Routine'}</h2>
          <button className="modal-close" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Suggested Weekdays</label>
          <div className="weekday-picker">
            {dayLabels.map((label, i) => (
              <button
                key={i}
                className={`weekday-btn ${weekdays.includes(i + 1) ? 'active' : ''}`}
                onClick={() => toggleWeekday(i + 1)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Blocks (in order)</label>
          {blockIDs.map((bid, i) => {
            const b = blockTemplates.find((bt) => bt.id === bid);
            return (
              <div key={`${bid}-${i}`} className="list-item" style={{ marginBottom: 4 }}>
                <div className="list-item-info">
                  <h4>
                    {b && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: COLOR_MAP[b.colorTag] || COLOR_MAP.blue,
                          marginRight: 8,
                        }}
                      />
                    )}
                    {b?.name || 'Unknown'}
                  </h4>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: 12, marginRight: 6 }}
                  onClick={() => moveBlock(i, 'up')}
                  disabled={i === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: 12, marginRight: 6 }}
                  onClick={() => moveBlock(i, 'down')}
                  disabled={i === blockIDs.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button className="delete-btn" onClick={() => removeBlock(i)}>
                  ✕
                </button>
              </div>
            );
          })}
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setShowBlockPicker(true)}
          >
            + Add Block
          </button>
        </div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isNew ? 'Create Routine' : 'Save'}
          </button>
        </div>

        {showBlockPicker && (
          <div
            className="modal-overlay"
            onClick={() => setShowBlockPicker(false)}
          >
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Select Block</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowBlockPicker(false)}
                >
                  Done
                </button>
              </div>
              {blockTemplates.map((b) => (
                <button
                  key={b.id}
                  className="list-item"
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => {
                    setBlockIDs([...blockIDs, b.id]);
                    setShowBlockPicker(false);
                  }}
                >
                  <div className="list-item-info">
                    <h4>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: COLOR_MAP[b.colorTag] || COLOR_MAP.blue,
                          marginRight: 8,
                        }}
                      />
                      {b.name}
                    </h4>
                    <p>{anchorShortLabel(b.anchor)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
