import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import ProjectsView from './components/ProjectsView';
import ProjectDetailView from './components/ProjectDetailView';
import { Home, Folder, LogOut, CheckSquare } from 'lucide-react';

function DashboardLayout() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [activeProjectId, setActiveProjectId] = useState(null);

  const handleNavigate = (view, projectId = null) => {
    setActiveView(view);
    setActiveProjectId(projectId);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'projects':
        return <ProjectsView onNavigate={handleNavigate} />;
      case 'project':
        return <ProjectDetailView projectId={activeProjectId} onNavigate={handleNavigate} />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">APEX TASK</div>

        <nav style={{ flex: 1 }}>
          <ul className="nav-list">
            <li
              className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigate('dashboard')}
            >
              <Home size={18} /> Dashboard
            </li>
            <li
              className={`nav-item ${activeView === 'projects' || activeView === 'project' ? 'active' : ''}`}
              onClick={() => handleNavigate('projects')}
            >
              <Folder size={18} /> Projects
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-info">
            <span className="user-profile-name">{user?.name}</span>
            <span className="user-profile-role">{user?.role}</span>
          </div>
          <button className="btn-logout" onClick={logout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

function MainAppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#08090c', color: '#f3f4f6' }}>Initializing Application...</div>;
  }

  return user ? <DashboardLayout /> : <AuthView />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
