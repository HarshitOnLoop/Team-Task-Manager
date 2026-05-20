import sequelize from '../config/database.js';
import User from './User.js';
import Project from './Project.js';
import ProjectMember from './ProjectMember.js';
import Task from './Task.js';

Project.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(Project, { as: 'ownedProjects', foreignKey: 'ownerId' });

Project.belongsToMany(User, { as: 'members', through: ProjectMember, foreignKey: 'projectId', otherKey: 'userId' });
User.belongsToMany(Project, { as: 'memberProjects', through: ProjectMember, foreignKey: 'userId', otherKey: 'projectId' });

Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId', onDelete: 'CASCADE' });
Project.hasMany(Task, { as: 'tasks', foreignKey: 'projectId', onDelete: 'CASCADE' });

Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId', onDelete: 'SET NULL' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigneeId', onDelete: 'SET NULL' });

export {
  sequelize,
  User,
  Project,
  ProjectMember,
  Task
};
