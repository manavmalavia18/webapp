const bcrypt = require("bcrypt");
const { DataTypes } = require("sequelize");
const sequelize = require("../connection.js").sequelize

const User = sequelize.define("users", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[0, 1]] // Ensures the role is either 0 (professor) or 1 (student)
    }
    // 0 for professor, 1 for student
  }
},
  {
    timestamps:true,
    createdAt:'account_created',
    updatedAt:'account_updated',
    underscore:true
  })
User.beforeCreate(async(User) => {
  const encryptedPass= await bcrypt.hash(User.password, 10);
  User.password = encryptedPass
});

module.exports = {
  User: User,
};