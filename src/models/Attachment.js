export default function defineAttachment(sequelize, DataTypes) {
  return sequelize.define('Attachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING
    },
    size: {
      type: DataTypes.INTEGER
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'attachments',
    timestamps: true,
    updatedAt: false
  });
}
