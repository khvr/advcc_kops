const { createLogger, format, transports } = require('winston');
const logger = createLogger({
    format: format.combine(
        // format.timestamp(),
        format.splat(),
        format.simple()
    ),
    transports: [
        new transports.Console()
    ]
});


module.exports = {
    logger
}