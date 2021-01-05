const Kafka = require("kafkajs").Kafka
const promClient = require("prom-client");
const { logger } = require("../logger/winston");

// counters for all APIs
const producerTopicWeatherCounter = new promClient.Counter({
    name: 'producer_topic_weather_counter',
    help: 'Number of times producer pubilshes on topic weather'
});

const producerWeatherkafkaSummary = new promClient.Summary({
    name: 'producer_weather_kafka_call_summary',
    help: 'Summary of the duration of producer weather kafka call'
});
module.exports = async function (topic, msg) {
    try {
        const kafka = new Kafka({
            "clientId": "myapp",
            "brokers": [`${process.env.BROKER1}`, `${process.env.BROKER2}`, `${process.env.BROKER3}`]
        })
        const end = producerWeatherkafkaSummary.startTimer();
        const producer = kafka.producer();
        logger.info("Connecting poller producer ......")
        await producer.connect()
        logger.info("poller producer Connected")
        const result = await producer.send({
            "topic": topic,
            "messages": [{
                "value": JSON.stringify(msg)
            }]
        })
        producerTopicWeatherCounter.inc()
        logger.info(`Sent Successfully! ${JSON.stringify(result)}`)
        end()
        await producer.disconnect();
    }
    catch (ex) {
        logger.error(`Something bad happened in producer ${ex}`)
    }

}