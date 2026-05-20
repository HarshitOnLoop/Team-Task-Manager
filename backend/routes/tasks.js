import express from 'express';
import { Task, Project, User, ProjectMember } from '../models/index.js';
import { authenticateToken, requireAdmin, hasProjectAccess } from '../middleware/auth.js';

const router = express.Router();

router.post('/projects/:projectId/tasks', authenticateToken, requireAdmin, hasProjectAccess, async (req, res) => {
  const { projectId } = req.params;
  const { title, description, priority, dueDate, assigneeId } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    if (assigneeId) {
      const user = await User.findByPk(assigneeId);
      if (!user) {
        return res.status(404).json({ error: 'Assignee not found' });
      }

      const isMember = await ProjectMember.findOne({
        where: { projectId, userId: assigneeId }
      });

      if (!isMember) {
        return res.status(400).json({ error: 'Assignee is not a member of this project' });
      }
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      projectId,
      assigneeId: assigneeId || null
    });

    const taskWithAssignee = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }]
    });

    return res.status(201).json(taskWithAssignee);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, dueDate, assigneeId } = req.body;

  try {
    const task = await Task.findByPk(id, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isMember = await ProjectMember.findOne({
      where: { projectId: task.projectId, userId: req.user.id }
    });

    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'admin') {
      if (assigneeId) {
        const user = await User.findByPk(assigneeId);
        if (!user) {
          return res.status(404).json({ error: 'Assignee not found' });
        }

        const isUserMember = await ProjectMember.findOne({
          where: { projectId: task.projectId, userId: assigneeId }
        });

        if (!isUserMember) {
          return res.status(400).json({ error: 'Assignee is not a member of this project' });
        }
      }

      await task.update({
        title: title !== undefined ? title : task.title,
        description: description !== undefined ? description : task.description,
        status: status !== undefined ? status : task.status,
        priority: priority !== undefined ? priority : task.priority,
        dueDate: dueDate !== undefined ? dueDate : task.dueDate,
        assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId
      });
    } else {
      if (task.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'Only the assigned member can update the status' });
      }

      if (title !== undefined || description !== undefined || priority !== undefined || dueDate !== undefined || assigneeId !== undefined) {
        return res.status(403).json({ error: 'Members can only update the task status' });
      }

      await task.update({
        status: status !== undefined ? status : task.status
      });
    }

    const updatedTask = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }]
    });

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/tasks/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();
    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
