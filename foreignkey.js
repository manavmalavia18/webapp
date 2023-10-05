const User=require("./models/user.js").User
const Assignment=require("./models/assignments.js").assignment

Assignment.belongsTo(User)
