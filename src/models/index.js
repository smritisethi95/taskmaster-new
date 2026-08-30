import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

import defineUser from './User.js';
import defineTeam from './Team.js';
import defineTeamMember from './TeamMember.js';
import defineTask from './Task.js';
import defineComment from './Comment.js';
import defineAttachment from './Attachment.js';
import defineNotification from './Notification.js';

const User = defineUser(sequelize, DataTypes);
const Team = defineTeam(sequelize, DataTypes);
const TeamMember = defineTeamMember(sequelize, DataTypes);
const Task = defineTask(sequelize, DataTypes);
const Comment = defineComment(sequelize, DataTypes);
const Attachment = defineAttachment(sequelize, DataTypes);
const Notification = defineNotification(sequelize, DataTypes);

// User and Task
User.hasMany(Task, { as: 'createdTasks', foreignKey: 'createdBy' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigneeId' });
Task.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });

// User and Team (Creator)
User.hasMany(Team, { foreignKey: 'createdBy' });
Team.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Team and User (Members)
Team.belongsToMany(User, { through: TeamMember, foreignKey: 'teamId', otherKey: 'userId' });
User.belongsToMany(Team, { through: TeamMember, foreignKey: 'userId', otherKey: 'teamId' });
Team.hasMany(TeamMember, { foreignKey: 'teamId' });
User.hasMany(TeamMember, { foreignKey: 'userId' });
TeamMember.belongsTo(User, { foreignKey: 'userId' });
TeamMember.belongsTo(Team, { foreignKey: 'teamId' });

// Team and Task
Team.hasMany(Task, { foreignKey: 'teamId' });
Task.belongsTo(Team, { foreignKey: 'teamId' });

// Task and Comment
Task.hasMany(Comment, { foreignKey: 'taskId' });
Comment.belongsTo(Task, { foreignKey: 'taskId' });

// User and Comment
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// Task and Attachment
Task.hasMany(Attachment, { foreignKey: 'taskId' });
Attachment.belongsTo(Task, { foreignKey: 'taskId' });

// User and Attachment
User.hasMany(Attachment, { foreignKey: 'uploadedBy' });
Attachment.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });

// User and Notification
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

export {
  sequelize,
  User,
  Team,
  TeamMember,
  Task,
  Comment,
  Attachment,
  Notification
};
