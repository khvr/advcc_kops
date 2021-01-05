const models = require("../../models");
const Kafka = require("kafkajs").Kafka
const promClient = require("prom-client");
const { logger, WinstonLogCreator } = require("../logger/winston");
const consumerTopicWeatherCounter = new promClient.Counter({
    name: 'consumer_topic_weather_counter',
    help: 'Number of times consumer consumes on topic weather'
});

const consumerWeatherkafkaSummary = new promClient.Summary({
    name: 'consumer_weather_kafka_call_summary',
    help: 'Summary of the duration of consumer weather kafka call'
});


const PostNotifierConsumerWatchDatabaseSummary = new promClient.Summary({
    name: 'post_notifier_consumer_watch_database_call_summary',
    help: 'Summary of the duration of post notifier consumer watch database call'
});


// const PutConsumerWatchDatabaseSummary = new promClient.Summary({
//     name: 'put_consumer_watch_database_call_summary',
//     help: 'Summary of the duration of put consumer watch database call'
// });

const DeleteNotifierConsumerWatchDatabaseSummary = new promClient.Summary({
    name: 'delete_notifier_consumer_watch_database_call_summary',
    help: 'Summary of the duration of delete notifier consumer watch database call'
});

const DeleteNotifierConsumerAlertDatabaseSummary = new promClient.Summary({
    name: 'delete_notifier_consumer_alert_database_call_summary',
    help: 'Summary of the duration of delete notifier consumer alert database call'
});

const PostNotifierConsumerAlertDatabaseSummary = new promClient.Summary({
    name: 'post_notifier_consumer_alert_database_call_summary',
    help: 'Summary of the duration of post notifier consumer alert database call'
});

const PostNotifierConsumerLogsDatabaseSummary = new promClient.Summary({
    name: 'post_notifier_consumer_logs_database_call_summary',
    help: 'Summary of the duration of post notifier consumer logs database call'
});

const PostNotifierConsumerWeatherDatabaseSummary = new promClient.Summary({
    name: 'post_notifier_consumer_weather_database_call_summary',
    help: 'Summary of the duration of post notifier consumer weather database call'
});


module.exports = async function (topic, callback) {
    try {
        const kafka = new Kafka({
            "clientId": "myapp",
            "brokers": [`${process.env.BROKER1}`, `${process.env.BROKER2}`, `${process.env.BROKER3}`],
            "logCreator": WinstonLogCreator
        })

        const consumer = kafka.consumer({
            "groupId": "weather_cg1"
        });
        const end = consumerWeatherkafkaSummary.startTimer();
        logger.info("Notifier Consumer Connecting .....")
        await consumer.connect()
        logger.info("Notifier Consumer Connected")

        consumer.subscribe({
            "topic": topic,
            "fromBeginning": true
        })
        end()
        await consumer.run({
            "eachMessage": async result => {
                consumerTopicWeatherCounter.inc()
                logger.info("Consumed Message " + JSON.stringify({
                    topic: result.topic,
                    partition: result.partition,
                    offset: result.message.offset
                }))
                if (result.message.value.toString().includes("Deleted Successfully")) {
                    // logger.log(`Received Message ${result.message.value}`);

                    const logs = JSON.parse(JSON.stringify(await models.Weather.findAll()));
                    // logger.log(logs)
                    // create logs
                    if (logs != null) {
                        for (var i = 0; i < logs.length; i++) {
                            const end = PostNotifierConsumerLogsDatabaseSummary.startTimer();
                            await models.Logs.create({
                                id: logs[i].id,
                                zipcode: logs[i].zipcode,
                                temp: logs[i].temp,
                                feels_like: logs[i].feels_like,
                                temp_min: logs[i].temp_min,
                                temp_max: logs[i].temp_max,
                                pressure: logs[i].pressure,
                                humidity: logs[i].humidity,
                                weather_created: logs[i].weather_created
                            }).catch(err => {
                                logger.error(err)
                              });
                            end();
                        }
                    }
                    // logger.log(result.message.value.toString().substring(11, 47));
                    var w_id = result.message.value.toString().substring(11, 47);
                    // delete watch
                    const end = DeleteNotifierConsumerWatchDatabaseSummary.startTimer();
                    await models.Watch.destroy({
                        where: {
                            id: w_id
                        }
                    }).catch(err => {
                        logger.error(err)
                      });
                    end()
                } else {
                    var data = JSON.parse(JSON.parse(result.message.value.toString()));
                    // const index = data.Weather.length - 1;
                    // logger.log("\n\nIndex :" + index)
                    // logger.log(data.Weather[index].zipcode);
                    // logger.log(data);
                    await models.Watch.findOne({
                        where: {
                            id: data.id,
                        }
                    }).then(async function (watch) {
                        if (watch == null) {
                            // create watch
                            const end = PostNotifierConsumerWatchDatabaseSummary.startTimer();
                            await models.Watch.create({
                                id: data.id,
                                user_id: data.user_id,
                                zipcode: data.zipcode,
                                watch_created: data.watch_created,
                                watch_updated: data.watch_updated
                            });
                            end()
                        }
                    }).catch(err => {
                        logger.error(err)
                      });
                    // Delete Alert
                    const end = DeleteNotifierConsumerAlertDatabaseSummary.startTimer();
                    await models.Alert.destroy({
                        where: {
                            watch_id: data.id

                        }
                    }).catch(err => {
                        logger.error(err)
                      });
                    end()

                    for (var i = 0; i < data.Alerts.length; i++) {
                        await models.Alert.findOne({
                            where: {
                                id: data.Alerts[i].id,
                            }
                        }).then(async function (alert) {
                            if (alert == null) {
                                // create alert
                                const end = PostNotifierConsumerAlertDatabaseSummary.startTimer();
                                await models.Alert.create({
                                    id: data.Alerts[i].id,
                                    field_type: data.Alerts[i].field_type,
                                    operator: data.Alerts[i].operator,
                                    value: data.Alerts[i].value,
                                    watch_id: data.Alerts[i].watch_id,
                                    alert_created: data.Alerts[i].alert_created,
                                    alert_updated: data.Alerts[i].alert_updated
                                })
                                end()
                            }
                        }).catch(err => {
                            logger.error(err)
                          });
                    }

                    for (var i = 0; i < data.Weather.length; i++) {
                        await models.Weather.findOne({
                            where: {
                                id: data.Weather[i].id,
                            }
                        }).then(async function (weather) {
                            if (weather == null) {
                                // create weather
                                const end = PostNotifierConsumerWeatherDatabaseSummary.startTimer();
                                await models.Weather.create({
                                    id: data.Weather[i].id,
                                    zipcode: data.Weather[i].zipcode,
                                    temp: data.Weather[i].temp,
                                    feels_like: data.Weather[i].feels_like,
                                    temp_min: data.Weather[i].temp_min,
                                    temp_max: data.Weather[i].temp_max,
                                    pressure: data.Weather[i].pressure,
                                    humidity: data.Weather[i].humidity,
                                    weather_created: data.Weather[i].weather_created,
                                    watch_id: data.Weather[i].watch_id
                                }).then(weather => {
                                    end()
                                    callback(data.Weather[i])
                                }).catch(err => {
                                    logger.error(err)
                                  });
                            }
                        }).catch(err => {
                            logger.error(err)
                          });
                    }

                    // callback(data.id)
                }
            }
        })

    }
    catch (ex) {
        logger.error(`Something bad happened ${ex}`)
    }


}