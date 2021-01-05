const models = require("../../models");
const Kafka = require("kafkajs").Kafka
const promClient = require("prom-client");
const { logger, WinstonLogCreator } = require("../logger/winston");
const consumerTopicWatchCounter = new promClient.Counter({
    name: 'consumer_topic_watch_counter',
    help: 'Number of times consumer consumes on topic watch'
});

const consumerWatchkafkaSummary = new promClient.Summary({
    name: 'consumer_watch_kafka_call_summary',
    help: 'Summary of the duration of consumer watch kafka call'
});

const PostConsumerWatchDatabaseSummary = new promClient.Summary({
    name: 'post_consumer_watch_database_call_summary',
    help: 'Summary of the duration of post consumer watch database call'
});


const PutConsumerWatchDatabaseSummary = new promClient.Summary({
    name: 'put_consumer_watch_database_call_summary',
    help: 'Summary of the duration of put consumer watch database call'
});

const DeleteConsumerWatchDatabaseSummary = new promClient.Summary({
    name: 'delete_consumer_watch_database_call_summary',
    help: 'Summary of the duration of delete consumer watch database call'
});

const DeleteConsumerAlertDatabaseSummary = new promClient.Summary({
    name: 'delete_consumer_alert_database_call_summary',
    help: 'Summary of the duration of delete consumer alert database call'
});

const PostConsumerAlertDatabaseSummary = new promClient.Summary({
    name: 'post_consumer_alert_database_call_summary',
    help: 'Summary of the duration of post consumer alert database call'
});

module.exports = async function (topic, callback) {
    try {
        const kafka = new Kafka({
            "clientId": "myapp",
            "brokers": [`${process.env.BROKER1}`, `${process.env.BROKER2}`, `${process.env.BROKER3}`],
            "logCreator": WinstonLogCreator
        })

        const consumer = kafka.consumer({
            "groupId": "cg1"
        });

        const end = consumerWatchkafkaSummary.startTimer();
        logger.info("Poller Consumer Connecting .....")
        await consumer.connect()
        logger.info("Poller Consumer Connected")

        consumer.subscribe({
            "topic": topic,
            "fromBeginning": true
        })
        end()
        await consumer.run({
            "eachMessage": async result => {
                consumerTopicWatchCounter.inc()
                logger.info("Consumed Message " + JSON.stringify({
                    topic: result.topic,
                    partition: result.partition,
                    offset: result.message.offset
                }))
                // logger.info(`Received Message: ${result.message.value}`)
                //Consumer delete watch
                if (result.message.value.toString().includes("Deleted Successfully")) {
                    var w_id = result.message.value.toString().substring(10, 46);
                    const end = DeleteConsumerWatchDatabaseSummary.startTimer();
                    await models.Watch.destroy({
                        where: {
                            id: w_id
                        }
                    })
                    end();
                    callback("DELETE", w_id)
                } else {
                    var data = JSON.parse(result.message.value.toString());

                    await models.Watch.findOne({
                        where: {
                            id: data.id,
                        }
                    }).then(async function (watch) {
                        if (watch == null) {
                            //create watch
                            const end = PostConsumerWatchDatabaseSummary.startTimer();
                            await models.Watch.create({
                                id: data.id,
                                user_id: data.user_id,
                                zipcode: data.zipcode,
                                watch_created: data.watch_created,
                                watch_updated: data.watch_updated
                            });
                            end()
                        } else {
                            //update watch
                            const end = PutConsumerWatchDatabaseSummary.startTimer();
                            models.Watch.update({
                                zipcode: data.zipcode,
                                watch_updated: data.watch_updated
                            }, {
                                where: {
                                    id: data.id,
                                    user_id: data.user_id
                                }
                            })
                            end();
                        }
                    })
                    //delete alert
                    const end = DeleteConsumerAlertDatabaseSummary.startTimer();
                    await models.Alert.destroy({
                        where: {
                            watch_id: data.id

                        }
                    })
                    end()
                    //   create alert
                    for (var i = 0; i < data.Alerts.length; i++) {
                        const end = PostConsumerAlertDatabaseSummary.startTimer();
                        await models.Alert.findOne({
                            where: {
                                id: data.Alerts[i].id,
                            }
                        })
                            .then(async function (alert) {
                                if (alert == null) {
                                    await models.Alert.create({
                                        id: data.Alerts[i].id,
                                        field_type: data.Alerts[i].field_type,
                                        operator: data.Alerts[i].operator,
                                        value: data.Alerts[i].value,
                                        watch_id: data.Alerts[i].watch_id,
                                        alert_created: data.Alerts[i].alert_created,
                                        alert_updated: data.Alerts[i].alert_updated
                                    })
                                }
                            })
                        end();
                        callback(data.zipcode, data.id)
                    }
                }
            }

        })

    }
    catch (ex) {
        logger.error(`Something bad happened in consumer ${ex}`)
    }

}