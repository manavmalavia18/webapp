const sequelize=require('../connection').sequelize
const { DataTypes } = require("sequelize");
const User=require("../models/user").User
const Assignment=require("../models/assignments").assignment

const Submission = sequelize.define('submission', {
    
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
    submission_url: {
        type: DataTypes.STRING,
        defaultValue: 0,
        allowNull: false,
    },
    
});

Assignment.belongsTo(User)
User.hasMany(Submission, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Assignment.hasMany(Submission, { foreignKey: 'AssignmentId',onDelete: 'CASCADE' });
Submission.belongsTo(User, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Submission.belongsTo(Assignment, { foreignKey: 'AssignmentId' });


module.exports = {
    Submission:Submission,
    sequelize:sequelize,
  };