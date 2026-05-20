import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, FolderPlus, ArrowRight, User } from 'lucide-react';

export default function ProjectsView({ onNavigate }) {
  const { token, user, apiBase } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${apiBase}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${apiBase}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setProjects([...projects, data]);
      setName('');
      setDescription('');
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to create project');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Loading projects list...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Team Projects</h1>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="glass-panel empty-state">
          <FolderPlus size={48} style={{ color: 'var(--text-muted)' }} />
          <div className="empty-state-title">No projects active</div>
          <p className="empty-state-subtitle">
            {user?.role === 'admin'
              ? 'Get started by creating your first team project.'
              : 'You are not assigned to any projects at the moment.'}
          </p>
          {user?.role === 'admin' && (
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="glass-panel project-card"
              onClick={() => onNavigate('project', proj.id)}
            >
              <div className="project-card-header">
                <h3 className="project-card-title">{proj.name}</h3>
              </div>
              <p className="project-card-desc">
                {proj.description || 'No project scope or overview is detailed.'}
              </p>
              <div className="project-card-footer">
                <span className="project-owner-badge">
                  Owner: {proj.owner?.name || 'Admin'}
                </span>
                <div className="members-avatar-stack">
                  {proj.members?.slice(0, 3).map((member) => (
                    <div key={member.id} className="member-avatar-icon" title={member.name}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {proj.members?.length > 3 && (
                    <div className="member-avatar-icon excess">
                      +{proj.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-title">Initiate New Project</h2>
            {error && <div className="alert-message error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Website Redesign"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the scope and goals..."
                  rows={4}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
