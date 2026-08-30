import bcryptjs from 'bcryptjs';

export default function defineUser(sequelize, DataTypes) {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcryptjs.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcryptjs.hash(user.password, 12);
        }
      }
    }
  });

  User.prototype.validatePassword = async function (password) {
    return await bcryptjs.compare(password, this.password);
  };

  User.prototype.toSafeJSON = function () {
    const user = this.toJSON();
    delete user.password;
    return user;
  };

  return User;
}
