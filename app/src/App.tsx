import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { DayView } from './components/DayView';
import { SettingsView } from './components/SettingsView';
import { StatsView } from './components/StatsView';
import { ProjectListView } from './components/ProjectListView';
import { ProjectRadarView } from './components/ProjectRadarView';
import { TaskRegistryView } from './components/TaskRegistryView';
import { format } from 'date-fns';

function AppShell() {
  const navigate = useNavigate();
  const { initialize, date } = useStore();

  useEffect(() => {
    initialize();
  }, []);

  const dateLabel = format(date, 'EEEE, MMM d');

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">{dateLabel}</h1>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => navigate('/radar')} title="Radar">
            🎯
          </button>
          <button className="icon-btn" onClick={() => navigate('/stats')} title="Stats">
            📊
          </button>
          <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings">
            ⚙️
          </button>
        </div>
      </header>
      <main className="app-main">
        <DayView />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<AppShell />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/stats" element={<StatsView />} />
        <Route path="/projects" element={<ProjectListView />} />
        <Route path="/radar" element={<ProjectRadarView />} />
        <Route path="/tasks" element={<TaskRegistryView />} />
      </Routes>
    </BrowserRouter>
  );
}