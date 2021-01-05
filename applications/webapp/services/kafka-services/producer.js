const Kafka = require("kafkajs").Kafka
const promClient = require("prom-client");
const logger = require("../../services/logger/winston").logger;

const producerTopicWatchCounter = new promClient.Counter({
    name: 'producer_topic_watch_counter',
    help: 'Number of times producer pubilshes on topic watch'
});

const producerWatchkafkaSummary = new promClient.Summary({
    name: 'producer_watch_kafka_call_summary',
    help: 'Summary of the duration of producer watch kafka call'
});

module.exports = async function (topic, msg) {
    try {
        const kafka = new Kafka({
            "clientId": "myapp",
            "brokers": [`${process.env.BROKER1}`, `${process.env.BROKER2}`, `${process.env.BROKER3}`]
        })
        const end = producerWatchkafkaSummary.startTimer();
        const producer = kafka.producer();
        logger.info("Backend Connecting producer ......")
        await producer.connect()
        logger.info("Backend Producer Connected")
        // logger.info(`Sending message: ${msg}`)
        const result = await producer.send({
            "topic": topic,
            "messages": [{
                "value": msg
            }]
        })
        producerTopicWatchCounter.inc()
        logger.info(`Backend Producer Sent Successfully! ${JSON.stringify(result)}`)
        end()
        await producer.disconnect();
    }
    catch (ex) {
        logger.error(`Something bad happened when connecting to Backend kafka broker: \n ${ex}`)
    }
}