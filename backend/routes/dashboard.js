import express from 'express';
import { Op } from 'sequelize';
import { Task, Project, User, ProjectMember } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    let projectIds = [];

    if (req.user.role === 'admin') {
      const allProjects = await Project.findAll({ attributes: ['id'] });
      projectIds = allProjects.map(p => p.id);
    } else {
      const memberAssociations = await ProjectMember.findAll({
        where: { userId: req.user.id },
        attributes: ['projectId']
      });
      projectIds = memberAssociations.map(ma => ma.projectId);
    }

    if (projectIds.length === 0) {
      return res.json({
        totalProjects: 0,
        totalTasks: 0,
        myTasks: 0,
        todo: 0,
        inProgress: 0,
        review: 0,
        done: 0,
        overdue: 0,
        projectsProgress: [],
        upcomingTasks: []
      });
    }

    const totalProjects = projectIds.length;

    const allTasksInProjects = await Task.findAll({
      where: { projectId: { [Op.in]: projectIds } }
    });

    const totalTasks = allTasksInProjects.length;

    const myTasks = allTasksInProjects.filter(t => t.assigneeId === req.user.id);
    const myTasksCount = myTasks.length;

    const todoCount = myTasks.filter(t => t.status === 'todo').length;
    const inProgressCount = myTasks.filter(t => t.status === 'in_progress').length;
    const reviewCount = myTasks.filter(t => t.status === 'review').length;
    const doneCount = myTasks.filter(t => t.status === 'done').length;

    const overdueCount = myTasks.filter(t => {
      return t.status !== 'done' && t.dueDate && t.dueDate < todayStr;
    }).length;

    const upcomingTasks = await Task.findAll({
      where: {
        projectId: { [Op.in]: projectIds },
        [Op.or]: [
          { assigneeId: req.user.id },
          { '$project.ownerId$': req.user.id }
        ],
        status: { [Op.ne]: 'done' },
        dueDate: { [Op.ne]: null }
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'name'] }
      ],
      order: [['dueDate', 'ASC']],
      limit: 5
    });

    const projectsWithTasks = await Project.findAll({
      where: { id: { [Op.in]: projectIds } },
      include: [{ model: Task, as: 'tasks', attributes: ['status'] }]
    });

    const projectsProgress = projectsWithTasks.map(proj => {
      const total = proj.tasks.length;
      const completed = proj.tasks.filter(t => t.status === 'done').length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: proj.id,
        name: proj.name,
        totalTasks: total,
        completedTasks: completed,
        progressPercent: percent
      };
    });

    return res.json({
      totalProjects,
      totalTasks,
      myTasks: myTasksCount,
      todo: todoCount,
      inProgress: inProgressCount,
      review: reviewCount,
      done: doneCount,
      overdue: overdueCount,
      projectsProgress,
      upcomingTasks
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate dashboard analytics' });
  }
});

export default router;
