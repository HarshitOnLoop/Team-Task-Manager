import jwt from 'jsonwebtoken';
import { User, Project } from '../models/index.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  next();
};

export const hasProjectAccess = async (req, res, next) => {
  const projectId = req.params.id || req.params.projectId || req.body.projectId;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  try {
    const project = await Project.findByPk(projectId, {
      include: [{
        model: User,
        as: 'members',
        where: { id: req.user.id },
        required: false
      }]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = project.members && project.members.length > 0;
    const isOwner = project.ownerId === req.user.id;

    if (!isMember && !isOwner) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error verifying access' });
  }
};
