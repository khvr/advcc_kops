const models = require("./models");
const express = require("express");
const weather = require("./services/weather/weather")
const topic_service = require('./services/kafka-services/topic');
const producer_service = require('./services/kafka-services/producer')
const test_service = require("./services/kafka-services/test")
const bodyParser = require("body-parser");
var port = normalizePort(process.env.PORT || "3001");
const { v4: uuidv4 } = require('uuid');
const consumer_service = require("./services/kafka-services/consumer")
var mysql = require('mysql');
const logger = require("./services/logger/winston").logger;
const promClient = require("prom-client");

const app = express();
app.set("port", port);
app.use(bodyParser.json());

var pool = mysql.createPool({
  host: process.env.DB_HOST_POLLER,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME_POLLER
});


app.get('/test', (req, res) => {
  pool.getConnection(function (err, connection) {
    if (err) {
      logger.error(err);
      res.status(500).send("Error connecting to Poller Database!")
    }
    else if (connection) {
      test_service(function (flag) {
        if (flag == true) {
          logger.info("Poller Database and kafka connected")
          res.status(200).send("Poller Database and Kafka Connected!");
        } else {
          logger.error("Error connecting Poller kafka")
          res.status(500).send("Error connecting to Poller Kafka!")
        }
      })
    }
    connection.release()
  })
});

app.get('/health', (req, res) => {
  logger.info("poller health get request successful")
  res.status(200).send('OK')
});

app.get('/metrics', (req, res) => {
  logger.info("poller metrics get request successful")
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
})

consumer_service("watch", async function (zipcode, watchID) {
  if (zipcode != "DELETE") {
    // Weather

    weather(zipcode, async function (weatherJSON) {
      var weather_uuid = uuidv4();
      var datetimestamp = new Date();
      weather_datetimestamp = datetimestamp.toString();

      await models.Weather.create({
        id: weather_uuid,
        watch_id: watchID,
        zipcode: zipcode,
        temp: weatherJSON.temp,
        feels_like: weatherJSON.feels_like,
        temp_min: weatherJSON.temp_min,
        temp_max: weatherJSON.temp_max,
        pressure: weatherJSON.pressure,
        humidity: weatherJSON.humidity,
        weather_created: weather_datetimestamp
      }).then(async res => {
        const w = await models.Watch.findOne({
          where: {
            id: watchID,
            zipcode: zipcode
          },
          include: [
            {
              model: models.Alert,
              required: false
            },
            {
              model: models.Weather,
              required: false
            }
          ]
        })
        topic_service("weather", JSON.stringify(w), producer_service)
      }).catch(err => { logger.error(`Something bad happened in main app${err}`) });


    })
  } else {
    var msg = ` WatchId: ${watchID} Deleted Successfully`;
    topic_service("weather", msg, producer_service)

  }
})

app.listen(port, function () {
  logger.info("Server listening on port " + port);
});
app.on("error", onError);
app.on("listening", onListening);

pool.getConnection(function (err, connection) {
  if (err) {
    logger.info("Poller Database Error")
    logger.error(err)
  }
  else {
    logger.info("Poller Database connected")
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
  logger.info("Listening on " + bind);
}
