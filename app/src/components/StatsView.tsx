import { useNavigate } from 'react-router-dom';
import * as persistence from '../services/persistence';
import { subDays, format, startOfDay } from 'date-fns';

export function StatsView() {
  const navigate = useNavigate();
  const dayLogs = persistence.loadDayLogs();

  // Sort by date
  const sorted = [...dayLogs].sort((a, b) => a.date.localeCompare(b.date));

  // Last 28 days data
  const today = startOfDay(new Date());
  const last28: { date: string; earned: number; possible: number }[] = [];
  for (let i = 27; i >= 0; i--) {
    const dateKey = format(subDays(today, i), 'yyyy-MM-dd');
    const log = sorted.find((l) => l.date === dateKey);
    last28.push({
      date: dateKey,
      earned: log?.earnedScore || 0,
      possible: log?.possibleScore || 0,
    });
  }

  const maxEarned = Math.max(...last28.map((d) => d.earned), 1);

  // Streaks
  const THRESHOLD = 0.8;
  let currentStreak = 0;
  for (let i = last28.length - 1; i >= 0; i--) {
    const d = last28[i];
    if (d.possible === 0) continue;
    if (d.earned / d.possible >= THRESHOLD) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let tempStreak = 0;
  for (const d of last28) {
    if (d.possible === 0) continue;
    if (d.earned / d.possible >= THRESHOLD) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Training load
  const todayLog = sorted.find((l) => l.date === format(today, 'yyyy-MM-dd'));
  const shortTerm = todayLog?.shortTermLoad || 0;
  const longTerm = todayLog?.longTermLoad || 0;

  let trend = 'Steady';
  if (longTerm === 0) {
    trend = shortTerm > 0 ? 'Leveling Up' : 'Steady';
  } else {
    const ratio = shortTerm / longTerm;
    if (ratio > 1.1) trend = 'Leveling Up';
    else if (ratio < 0.9) trend = 'Leveling Down';
  }

  const trendEmoji = trend === 'Leveling Up' ? '📈' : trend === 'Leveling Down' ? '📉' : '➡️';

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1>Stats</h1>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <h4>Current Streak</h4>
          <div className="stat-value">{currentStreak}</div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>days</span>
        </div>
        <div className="stat-card">
          <h4>Longest Streak</h4>
          <div className="stat-value">{longestStreak}</div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>days</span>
        </div>
        <div className="stat-card">
          <h4>Trend</h4>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {trendEmoji}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{trend}</span>
        </div>
      </div>

      <div className="stat-card">
        <h4>Training Load (28 Days)</h4>
        <div className="bar-chart">
          {last28.map((d, i) => (
            <div
              key={d.date}
              className={`bar ${i === last28.length - 1 ? 'today' : ''}`}
              style={{ height: `${(d.earned / maxEarned) * 100}%` }}
              title={`${d.date}: ${d.earned.toFixed(0)} pts`}
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span>28d ago</span>
          <span>Today</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          7-day avg: <strong>{shortTerm.toFixed(1)}</strong> · 28-day avg:{' '}
          <strong>{longTerm.toFixed(1)}</strong>
        </div>
      </div>

      {dayLogs.length === 0 && (
        <div className="empty-state">
          <p>No data yet. Complete your first day to see stats!</p>
        </div>
      )}
    </div>
  );
}
