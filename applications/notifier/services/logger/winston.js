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

const { logLevel } = require('kafkajs')
const winston = require('winston')
const toWinstonLogLevel = level => {switch(level) {
    case logLevel.ERROR:
    case logLevel.NOTHING:
        return 'error'
    case logLevel.WARN:
        return 'warn'
    case logLevel.INFO:
        return 'info'
    case logLevel.DEBUG:
        return 'debug'
}
}
const WinstonLogCreator = logLevel => {
    const logger = winston.createLogger({
        format: format.combine(
            // format.timestamp(),
            format.splat(),
            format.simple()
        ),
        level: toWinstonLogLevel(logLevel),
        transports: [
            new winston.transports.Console()
        ]
    })

    return ({ namespace, level, label, log }) => {
        const { message, ...extra } = log
        logger.log({
            level: toWinstonLogLevel(level),
            message,
            extra,
        })
    }
}
module.exports = {
    logger,
    WinstonLogCreator
}