const models = require("./models");

const express = require("express");
const bodyParser = require("body-parser");
var port = normalizePort(process.env.PORT || "3002");
const notifier = require("./services/notifier/notifier")
const { v4: uuidv4 } = require('uuid');
const consumer_service = require("./services/kafka-services/consumer")
const test_service = require("./services/kafka-services/test")
const Sequelize = require('sequelize');
const app = express();
var mysql = require('mysql');
const promClient = require("prom-client");
const { logger } = require("./services/logger/winston");

const PostConsumerStatusDatabaseSummary = new promClient.Summary({
    name: 'put_consumer_status_database_call_summary',
    help: 'Summary of the duration of post consumer status database call'
});


var pool = mysql.createPool({
  host: process.env.DB_HOST_NOTIFIER,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME_NOTIFIER
});


app.get('/test', (req, res) => {
  pool.getConnection(function (err, connection) {
    if (err) {
      logger.error(err)
      res.status(500).send("Error connecting to Notifier Database!")
    }
    else if (connection) {
      test_service(function (flag) {
        if (flag == true) {
          logger.info("Notifier Database and kafka connected")
          res.status(200).send("Notifier Database and Kafka Connected!");
        } else {
          logger.error("Error connecting Notifier kafka")
          res.status(500).send("Error connecting to Notifier Kafka!")
        }
      })
    }
    connection.release()
  })
});



app.get('/health', (req, res) => {
  logger.info("notifier health get request successful")
  res.status(200).send('OK')
});

app.get('/metrics', (req, res) => {
  logger.info("notifier metrics get request successful")
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
})


consumer_service("weather", async function (weather) {

  await models.Status.findOne({
    where: {
      Flag: "true"
    }
  }).then(async status => {
    if (status == null) {
      var dict = {
        "temp": weather.temp,
        "feels_like": weather.feels_like,
        "temp_min": weather.temp_min,
        "temp_max": weather.temp_max,
        "pressure": weather.pressure,
        "humidity": weather.humidity,
      };

      const watchId = weather.watch_id

      const w = await models.Watch.findOne({
        where: {
          id: watchId,
        },
        include: [
          {
            model: models.Alert,
            required: false
          }
        ]

      })
      for (var i = 0; i < w.Alerts.length; i++) {
        const field_type = w.Alerts[i].field_type
        const operator = w.Alerts[i].operator
        const value = w.Alerts[i].value
        notifier(operator, value, field_type, dict[field_type]).then(async result => {

          // var string_DateTimeStamp = timestamp.toString()
          // logger.log(string_DateTimeStamp)
          logger.info("Alert Result: "+result)
          if (result == true) {
            logger.info("Status: ALERT SENT")
            const end = PostConsumerStatusDatabaseSummary.startTimer();
            await models.Status.create({
              id: uuidv4(),
              Status: "ALERT_SEND",
              Status_created: (new Date()).toString(),
              Flag: "true"
            }).catch(err => {
              logger.error(err)
            });
            end()
          } else {
            const end = PostConsumerStatusDatabaseSummary.startTimer();
            logger.info("Status: ALERT IGNORED TRESHOLD REACHED")
            await models.Status.create({
              id: uuidv4(),
              Status: "Status: ALERT_IGNORED_TRESHOLD_REACHED",
              Status_created: (new Date()).toString(),
              Flag: "true"
            }).catch(err => {
              logger.error(err)
            });
            end();
          }
        })


      }
    } else {
      var alert_time = new Date(status.dataValues.Status_created)
      // logger.log("alert_time\n\n"+alert_time)
      var current_date = new Date()
      // logger.log("current_date\n\n"+current_date)
      var diff = Math.abs(current_date - alert_time);
      // logger.log("diff\n\n"+diff)
      var minutes = Math.floor((diff / 1000) / 60);
      // logger.log("minutes\n\n"+minutes)
      var notification_limit = process.env.NOTIFICATION_LIMIT
      if (minutes >= notification_limit) {
        logger.info("Notification limit reached, checking watch again ...")
        models.Status.findOne(
          {
            where: { Flag: 'true' },
          }).then(function (record) {
            return record.update({ Flag: "false" })
          })
      } else {
        const end = PostConsumerStatusDatabaseSummary.startTimer();
        logger.info("Status: ALERT IGNORED DUPLICATE")
        await models.Status.create({
          id: uuidv4(),
          Status: "ALERT_IGNORED_DUPLICATE",
          Status_created: (new Date()).toString(),
          Flag: "false"
        }).catch(err => {
          logger.error(err)
        });
        end()
      }

    }
  })


})





app.listen(port, function () {
  logger.info("Server listening on port " + port);
});
app.on("error", onError);
app.on("listening", onListening);

pool.getConnection(function (err, connection) {
  if (err) {
    logger.error("Notifier Database Error")
  }
  else {
    logger.info("Notifier Database connected")
    connection.release();

    models.sequelize
      .sync()
      .then(function () {
        /**
         * Listen on provided port, on all network interfaces.
         */

      })
      .catch(function (err) {
        logger.error(err);
      });
  }
})



app.set("port", port);
app.use(bodyParser.json());



function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      logger.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      logger.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = app.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  logger.log("Listening on " + bind);
}
