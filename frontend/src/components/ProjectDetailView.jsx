import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, UserPlus, Trash, Edit, CheckSquare, Calendar, ChevronRight } from 'lucide-react';

export default function ProjectDetailView({ projectId, onNavigate }) {
  const { token, user, apiBase } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  
  const [editStatus, setEditStatus] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`${apiBase}/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        onNavigate('projects');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${apiBase}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    if (user?.role === 'admin') {
      fetchAllUsers();
    }
  }, [projectId, token]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filtered = allUsers.filter(u => {
      const isAlreadyMember = project?.members?.some(m => m.id === u.id);
      return !isAlreadyMember && (
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    setSearchResults(filtered);
  }, [searchQuery, allUsers, project]);

  const handleAddMember = async (userId) => {
    try {
      const response = await fetch(`${apiBase}/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const updatedMembers = await response.json();
        setProject({ ...project, members: updatedMembers });
        setSearchQuery('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const response = await fetch(`${apiBase}/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedMembers = await response.json();
        setProject({
          ...project,
          members: updatedMembers,
          tasks: project.tasks.map(t => t.assigneeId === userId ? { ...t, assigneeId: null, assignee: null } : t)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBase}/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          dueDate: taskDueDate || null,
          assigneeId: taskAssigneeId || null
        })
      });

      if (response.ok) {
        const newTask = await response.json();
        setProject({
          ...project,
          tasks: [...project.tasks, newTask]
        });
        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskPriority('medium');
        setTaskDueDate('');
        setTaskAssigneeId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditModal = (task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate || '');
    setTaskAssigneeId(task.assigneeId || '');
    setEditStatus(task.status);
    setIsEditTaskModalOpen(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const isUserAdmin = user?.role === 'admin';
      const bodyPayload = isUserAdmin
        ? {
            title: taskTitle,
            description: taskDescription,
            priority: taskPriority,
            dueDate: taskDueDate || null,
            assigneeId: taskAssigneeId || null,
            status: editStatus
          }
        : { status: editStatus };

      const response = await fetch(`${apiBase}/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setProject({
          ...project,
          tasks: project.tasks.map(t => t.id === selectedTask.id ? updatedTask : t)
        });
        setIsEditTaskModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task permanently?')) return;

    try {
      const response = await fetch(`${apiBase}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProject({
          ...project,
          tasks: project.tasks.filter(t => t.id !== taskId)
        });
        setIsEditTaskModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project? This action is irreversible.')) return;

    try {
      const response = await fetch(`${apiBase}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onNavigate('projects');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Loading project workspaces...</div>;
  }

  if (!project) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Project not found.</div>;
  }

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' }
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px', maxWidth: '700px' }}>
            {project.description || 'No detailed overview provided.'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-danger" onClick={handleDeleteProject}>
            <Trash size={16} /> Delete Project
          </button>
        )}
      </div>

      <div className="project-board-layout">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Task Board</h2>
            {user?.role === 'admin' && (
              <button className="btn-primary" onClick={() => setIsTaskModalOpen(true)}>
                <Plus size={16} /> Add Task
              </button>
            )}
          </div>

          <div className="kanban-board">
            {columns.map(col => {
              const colTasks = project.tasks?.filter(t => t.status === col.id) || [];
              return (
                <div key={col.id} className="kanban-column">
                  <div className="kanban-column-header">
                    <span className="kanban-column-title">{col.title}</span>
                    <span className="kanban-column-count">{colTasks.length}</span>
                  </div>

                  {colTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      No tasks
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <div key={task.id} className="task-card" onClick={() => handleOpenEditModal(task)}>
                        <div className="task-card-header">
                          <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                        </div>
                        <h4 className="task-card-title">{task.title}</h4>
                        <div className="task-card-footer">
                          <span className="task-due-date">
                            <Calendar size={11} />
                            {task.dueDate || 'No due date'}
                          </span>
                          {task.assignee ? (
                            <div className="task-assignee-avatar" title={`Assigned to ${task.assignee.name}`}>
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div className="task-assignee-avatar" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }} title="Unassigned">
                              -
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="project-sidebar">
          <div className="glass-panel">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} /> Team Members
            </h3>

            {user?.role === 'admin' && (
              <div className="member-search-box" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Invite user to project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                />
                {searchResults.length > 0 && (
                  <div className="member-search-results">
                    {searchResults.map(u => (
                      <div key={u.id} className="member-search-item" onClick={() => handleAddMember(u.id)}>
                        <div>
                          <div className="member-search-name">{u.name}</div>
                          <div className="member-search-email">{u.email}</div>
                        </div>
                        <UserPlus size={14} style={{ color: 'var(--primary)' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="member-list">
              {project.members?.map(m => (
                <div key={m.id} className="member-row">
                  <div className="member-user-info">
                    <div className="member-user-avatar">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="member-user-name">{m.name}</div>
                      <div className="member-user-role">{m.role}</div>
                    </div>
                  </div>
                  {user?.role === 'admin' && m.id !== project.ownerId && (
                    <button className="btn-remove-member" onClick={() => handleRemoveMember(m.id)}>
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-title">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Review schema definitions..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Task Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Scope of work details..."
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsTaskModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditTaskModalOpen && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-title">Task Details</h2>
            <form onSubmit={handleUpdateTask}>
              {user?.role === 'admin' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Task Title</label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Task Description</label>
                    <textarea
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)}>
                      <option value="">Unassigned</option>
                      {project.members?.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{selectedTask.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                    {selectedTask.description || 'No description supplied.'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <div>Priority: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{selectedTask.priority}</strong></div>
                    <div>Due Date: <strong style={{ color: 'var(--text-primary)' }}>{selectedTask.dueDate || 'None'}</strong></div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Task Status</label>
                {user?.role === 'admin' || selectedTask.assigneeId === user?.id ? (
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                ) : (
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'capitalize', fontWeight: '500' }}>
                    {selectedTask.status.replace('_', ' ')}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      (Only assigned member can update status)
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <div>
                  {user?.role === 'admin' && (
                    <button type="button" className="btn-danger" onClick={() => handleDeleteTask(selectedTask.id)}>
                      <Trash size={16} /> Delete
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditTaskModalOpen(false)}>
                    Cancel
                  </button>
                  {(user?.role === 'admin' || selectedTask.assigneeId === user?.id) && (
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
