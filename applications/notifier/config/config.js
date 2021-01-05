require('dotenv').config();

module.exports = {
  "development": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASS,
    "database": process.env.DB_NAME_NOTIFIER,
    "dialect": "mysql",
    "host": process.env.DB_HOST_NOTIFIER
  },
  "production": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASS,
    "database": process.env.DB_NAME_NOTIFIER,
    "dialect": "mysql",
    "host": process.env.DB_HOST_NOTIFIER,
    "logging": false
  }
};