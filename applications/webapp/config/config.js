require('dotenv').config();

module.exports = {
  "development": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASS,
    "database": process.env.DB_NAME_WEBAPP,
    "dialect": "mysql",
    "host": process.env.DB_HOST_WEBAPP
  },
  "production": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASS,
    "database": process.env.DB_NAME_WEBAPP,
    "dialect": "mysql",
    "host": process.env.DB_HOST_WEBAPP,
    "logging":false
  }
};