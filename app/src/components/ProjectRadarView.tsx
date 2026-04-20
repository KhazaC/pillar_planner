import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  CADENCE_DAYS,
  ProjectLifecycleStatus,
} from '../types';
import * as persistence from '../services/persistence';
import { differenceInDays, startOfDay, subDays, format } from 'date-fns';

interface ProjectStatus {
  projectId: string;
  name: string;
  category: string;
  priority: number;
  cadence: string;
  daysSinceLastWorked: number | null;
  neglectScore: number;
  statusLabel: string;
  minutesLast7: number;
  minutesLast30: number;
}

function computeNeglectRadar(): ProjectStatus[] {
  const store = useStore.getState();
  const projects = store.projects.filter((p) => p.status === ProjectLifecycleStatus.Active);
  const projectLogs = persistence.loadProjectLogs();
  const dayTags = persistence.loadDayProjectTags();
  const today = startOfDay(new Date());
  const d7 = format(subDays(today, 7), 'yyyy-MM-dd');
  const d30 = format(subDays(today, 30), 'yyyy-MM-dd');

  return projects
    .map((project) => {
      // Find last worked date
      const pLogs = projectLogs
        .filter((l) => l.projectId === project.id)
        .map((l) => l.date);
      const dTags = dayTags
        .filter((t) => t.projectId === project.id)
        .map((t) => t.date);
      const allDates = [...pLogs, ...dTags].sort().reverse();
      const lastDate = allDates[0] || null;

      const daysSinceLastWorked = lastDate
        ? differenceInDays(today, new Date(lastDate))
        : null;

      const targetDays = CADENCE_DAYS[project.cadence] || 7;
      const neglectScore =
        daysSinceLastWorked !== null ? daysSinceLastWorked / targetDays : 10.0;

      let statusLabel: string;
      if (neglectScore > 2.0) statusLabel = 'Severely neglected';
      else if (neglectScore > 1.0) statusLabel = 'Neglected';
      else if (neglectScore > 0.5) statusLabel = 'Due soon';
      else statusLabel = 'On track';

      const minutesLast7 = projectLogs
        .filter((l) => l.projectId === project.id && l.date >= d7)
        .reduce((s, l) => s + l.minutesSpent, 0);
      const minutesLast30 = projectLogs
        .filter((l) => l.projectId === project.id && l.date >= d30)
        .reduce((s, l) => s + l.minutesSpent, 0);

      return {
        projectId: project.id,
        name: project.name,
        category: project.category,
        priority: project.priority,
        cadence: project.cadence,
        daysSinceLastWorked,
        neglectScore,
        statusLabel,
        minutesLast7,
        minutesLast30,
      };
    })
    .sort((a, b) => b.neglectScore - a.neglectScore);
}

function statusColor(label: string): string {
  switch (label) {
    case 'Severely neglected':
      return 'var(--red)';
    case 'Neglected':
      return 'var(--orange)';
    case 'Due soon':
      return 'var(--yellow)';
    default:
      return 'var(--green)';
  }
}

function statusBadgeClass(label: string): string {
  switch (label) {
    case 'Severely neglected':
      return 'badge badge-red';
    case 'Neglected':
      return 'badge badge-orange';
    case 'Due soon':
      return 'badge badge-yellow';
    default:
      return 'badge badge-green';
  }
}

export function ProjectRadarView() {
  const navigate = useNavigate();
  const radar = computeNeglectRadar();

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1>Project Radar</h1>
      </div>

      {radar.length === 0 ? (
        <div className="empty-state">
          <p>No active projects. Create projects in Settings.</p>
        </div>
      ) : (
        radar.map((status) => (
          <div key={status.projectId} className="radar-item">
            <div
              className="radar-dot"
              style={{ background: statusColor(status.statusLabel) }}
            />
            <div className="radar-info">
              <h4>{status.name}</h4>
              <p>
                {status.daysSinceLastWorked !== null
                  ? `${status.daysSinceLastWorked}d ago`
                  : 'Never started'}{' '}
                · Target: every {CADENCE_DAYS[status.cadence as keyof typeof CADENCE_DAYS] || '?'}d
              </p>
              <p style={{ fontSize: 11, marginTop: 2 }}>
                7d: {status.minutesLast7}m · 30d: {status.minutesLast30}m
              </p>
            </div>
            <span className={statusBadgeClass(status.statusLabel)}>
              {status.statusLabel}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
