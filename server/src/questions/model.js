const Sequelize = require("sequelize");
const sequelize = require("../../db");
const Response = require("../responses/model");

// String based operators are now deprecated. Please use Symbol based operators for better security, read more at http://docs.sequelizejs.com/manual/tutorial/querying.html#operators node_modules/sequelize/lib/sequelize.js:242:13
// Todo: fix above error.

const Question = sequelize.define(
  "questions",
  {
    text: {
      type: Sequelize.STRING,
      allowNull: false,
      field: "text"
    }
  },
  { tableName: "questions", timestamps: false }
);

Question.hasMany(Response, { foreignKey: "question_id" });
Response.belongsTo(Question, { foreignKey: "question_id" });

module.exports = Question;
