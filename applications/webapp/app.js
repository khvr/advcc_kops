const models = require("./models");
const express = require("express");
const bodyParser = require("body-parser");
const test_service = require("./services/kafka-services/test")
const logger = require("./services/logger/winston").logger;
var port = normalizePort(process.env.PORT || "3000");
var mysql = require('mysql');



var pool = mysql.createPool({
  host: process.env.DB_HOST_WEBAPP,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASS, 
  database: process.env.DB_NAME_WEBAPP 
});

const app = express();
app.set("port", port);
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend Account Creation!!" });
});

app.get('/health', (req, res) => {
  logger.info("Backend health get request successful")
  res.status(200).send('OK')
});

app.get('/test', (req, res) => {

  pool.getConnection(function(err,connection) {
    if (err){ 
        logger.error(err)
        res.status(500).send("Error connecting to Backend Database!")
      }
    else if(connection){
      test_service(function(flag){
          if(flag==true){
            logger.info("Backend Database and kafka connected")
            res.status(200).send("Backend Database and Kafka Connected!");
          }else{
            logger.error("Error connecting Backend kafka")
            res.status(500).send("Error connecting to Backend Kafka!")
          }
          })
    }
    connection.release();
  })  
});

app.listen(port, function () {
  logger.info("Server listening on port " + port);
});
app.on("error", onError);
app.on("listening", onListening);

pool.getConnection(function(err, connection){
  if(err){
    logger.error("Backend Database Error: \n"+err)
  }
  else{
    logger.info("Backend Database connected")
    connection.release();
    require("./routes/userRoutes")(app);
    require("./routes/watchRoutes")(app); 
    require("./routes/metricsRoute")(app); 

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
