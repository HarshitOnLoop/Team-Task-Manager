import express from 'express';
import { Project, User, ProjectMember, Task } from '../models/index.js';
import { authenticateToken, requireAdmin, hasProjectAccess } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
        ]
      });
    } else {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { 
            model: User, 
            as: 'members', 
            attributes: ['id', 'name', 'email'],
            where: { id: req.user.id }
          }
        ]
      });
    }

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const project = await Project.create({
      name,
      description,
      ownerId: req.user.id
    });

    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id
    });

    const projectWithAssociations = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
      ]
    });

    return res.status(201).json(projectWithAssociations);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/:id', authenticateToken, hasProjectAccess, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'] },
        { 
          model: Task, 
          as: 'tasks',
          include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;

  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.update({ name, description });

    const updatedProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
      ]
    });

    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.destroy();
    return res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.post('/:id/members', authenticateToken, requireAdmin, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingMember = await ProjectMember.findOne({
      where: { projectId: project.id, userId }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    await ProjectMember.create({
      projectId: project.id,
      userId
    });

    const projectWithMembers = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    return res.json(projectWithMembers.members);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add project member' });
  }
});

router.delete('/:id/members/:userId', authenticateToken, requireAdmin, async (req, res) => {
  const { id, userId } = req.params;

  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const member = await ProjectMember.findOne({
      where: { projectId: id, userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member association not found' });
    }

    await member.destroy();

    const projectWithMembers = await Project.findByPk(id, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    return res.json(projectWithMembers.members);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove project member' });
  }
});

export default router;
