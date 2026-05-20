import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Folder, CheckSquare, Clock, AlertCircle, Calendar } from 'lucide-react';

export default function DashboardView({ onNavigate }) {
  const { token, apiBase } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${apiBase}/api/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Loading workspace intelligence...</div>;
  }

  if (!stats) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Failed to generate dashboard intelligence.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Workspace Intel</h1>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <Folder size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalProjects}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <CheckSquare size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.myTasks}</span>
            <span className="stat-label">My Tasks</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckSquare size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.done}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      </div>

      <div className="dashboard-details">
        <div className="glass-panel progress-section">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>Project Milestones</h2>
          {stats.projectsProgress.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '20px 0' }}>
              No project milestones to report.
            </div>
          ) : (
            stats.projectsProgress.map((proj) => (
              <div
                key={proj.id}
                className="project-progress-row"
                onClick={() => onNavigate('project', proj.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="project-progress-info">
                  <span>{proj.name}</span>
                  <span style={{ color: 'var(--primary)' }}>{proj.progressPercent}%</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${proj.progressPercent}%` }}></div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="glass-panel">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Upcoming Schedule</h2>
          <div className="upcoming-tasks-list">
            {stats.upcomingTasks.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>
                All clear! No pending tasks on deck.
              </div>
            ) : (
              stats.upcomingTasks.map((task) => (
                <div key={task.id} className="upcoming-task-item">
                  <div>
                    <div className="upcoming-task-title">{task.title}</div>
                    <div className="upcoming-task-proj">{task.project?.name}</div>
                  </div>
                  <div className="upcoming-task-date">
                    <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {task.dueDate}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
