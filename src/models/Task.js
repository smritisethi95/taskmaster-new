export default function defineTask(sequelize, DataTypes) {
  return sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'completed', 'archived'),
      defaultValue: 'open'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'tasks',
    timestamps: true
  });
}
