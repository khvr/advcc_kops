
const promClient = require("prom-client");
const logger = require("../services/logger/winston").logger;

exports.getMetrics = (req, res) => {
	logger.info("metrics get request successful")
	res.set('Content-Type', promClient.register.contentType);
	res.end(promClient.register.metrics());
};