const { DataTypes } = require("sequelize");
const sequelize = require('../connection.js').sequelize;

const assignment = sequelize.define("assignments", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
        min: 1, 
        max: 100, 
      }
  },
  num_of_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
        min: 1,
        max: 100 
      }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
  }},{
    timestamps:true,
    createdAt:'assignment_created',
    updatedAt:'assignment_updated',
    underscore:true
  }
);

module.exports = {
  assignment: assignment,
  sequelize: sequelize
};