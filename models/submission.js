const sequelize=require('../connection').sequelize
const { DataTypes } = require("sequelize");
const User=require("../models/user").User
const Assignment=require("../models/assignments").assignment

const Submission = sequelize.define('submission', {
    
    submission_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    
});

Assignment.belongsTo(User)
User.hasMany(Submission, { foreignKey: 'UserId' });
Assignment.hasMany(Submission, { foreignKey: 'AssignmentId' });
Submission.belongsTo(User, { foreignKey: 'UserId' });
Submission.belongsTo(Assignment, { foreignKey: 'AssignmentId' });


module.exports = {
    Submission:Submission,
    sequelize
  };