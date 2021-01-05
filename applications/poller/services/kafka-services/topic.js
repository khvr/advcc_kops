const { logger } = require("../logger/winston");

const Kafka = require("kafkajs").Kafka

module.exports = async function (topic, msg, callback) {
    try {
        const kafka = new Kafka({
            "clientId": "myapp",
            "brokers": [`${process.env.BROKER1}`, `${process.env.BROKER2}`, `${process.env.BROKER3}`]
        })

        const admin = kafka.admin();
        logger.info("poller Connecting admin......")
        await admin.connect()
        logger.info("poller Admin Connected")
        const existing_topics = await admin.listTopics()
        if (existing_topics.includes(topic)) {
            logger.info(`Topic ${topic} exists!`)
        }
        else {
            await admin.createTopics({
                "topics": [{
                    "topic": topic,
                    "numPartitions": 2,
                    "replicationFactor": 3
                }]
            })

            logger.info(`Topic ${topic} Created Successfully!`)

        }
        await admin.disconnect();

        await callback(topic, msg)
    }
    catch (ex) {
        logger.error(`Something bad happened ${ex}`)
    }


}