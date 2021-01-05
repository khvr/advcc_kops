const auth = require('basic-auth');
var models = require('../models');
const topic_service = require('../services/kafka-services/topic');
const producer_service = require('../services/kafka-services/producer')
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const compare = require('tsscmp');
const promClient = require("prom-client");
const logger = require("../services/logger/winston").logger;

// counters for all APIs
const createWatchCounter = new promClient.Counter({
    name: 'create_watch_counter',
    help: 'Number of times create watch API is called'
});
const getWatchCounter = new promClient.Counter({
    name: 'get_watch_counter',
    help: 'Number of times get watch API is called'
});

const getAllWatchesCounter = new promClient.Counter({
    name: 'get_All_Watches_counter',
    help: 'Number of times get all watches API is called'
});

const updateWatchCounter = new promClient.Counter({
    name: 'update_watch_counter',
    help: 'Number of times update watch API is called'
});

const deleteWatchCounter = new promClient.Counter({
    name: 'delete_watch_counter',
    help: 'Number of times delete watch API is called'
});
// Prometheus summary
const createWatchdatabaseSummary = new promClient.Summary({
    name: 'create_watch_database_call_summary',
    help: 'Summary of the duration of create watch database call'
});

const getWatchdatabaseSummary = new promClient.Summary({
    name: 'get_watch_database_call_summary',
    help: 'Summary of the duration of get watch database call'
});

const getAllWatchesdatabaseSummary = new promClient.Summary({
    name: 'get_All_watches_database_call_summary',
    help: 'Summary of the duration of get all watches database call'
});

const updateWatchdatabaseSummary = new promClient.Summary({
    name: 'update_watch_database_call_summary',
    help: 'Summary of the duration of update watch database call'
});

const deleteWatchdatabaseSummary = new promClient.Summary({
    name: 'delete_watch_database_call_summary',
    help: 'Summary of the duration of delete watch database call'
});






exports.create = (req, res) => {
    logger.info("watch creation request")
    createWatchCounter.inc()
    var uuid = uuidv4();
    var creds = auth(req);
    const data = req.body;
    var datetimestamp = new Date();
    datetimestamp = datetimestamp.toString();

    if (!creds) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Access denied')
    } else {
        if (isNaN(data.zipcode) || data.zipcode.length != '5') {

            res.send("Enter valid Zip");
        }

        else {
            var watch = null;
            var id = null;
            var username = creds.name;
            var password = creds.pass;
            models.User.findOne({
                where: {
                    email_address: username
                }
            }).then(async function (account) {
                var valid = true;
                id = account.id;
                valid = compare(username, account.email_address);
                valid = bcrypt.compareSync(password, account.password) && valid;

                if (valid) {
                    const end = createWatchdatabaseSummary.startTimer()
                    watch = await models.Watch.create({
                        id: uuid,
                        user_id: account.id,
                        zipcode: data.zipcode,
                        watch_created: datetimestamp,
                        watch_updated: datetimestamp
                    });

                    for (var i = 0; i < data.alerts.length; i++) {
                        await models.Alert.create({
                            id: uuidv4(),
                            field_type: data.alerts[i].field_type,
                            operator: data.alerts[i].operator,
                            value: data.alerts[i].value,
                            watch_id: watch.id,
                            alert_created: datetimestamp,
                            alert_updated: datetimestamp
                        })

                    }
                    const w = await models.Watch.findOne({
                        where: {
                            id: watch.id,
                        },
                        include: [
                            {
                                model: models.Alert,
                                required: false
                            }
                        ],
                    })
                    res.send(w);
                    logger.info("Watch creation request successful")
                    end()
                    //send to kafka topic watch
                    topic_service("watch", JSON.stringify(w), producer_service)
                } else {
                    res.statusCode = 401
                    res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                    res.end('Access denied')
                    logger.info("Watch creation request unsuccessful")
                }
            })
                .catch(async function (SequelizeDatabaseError) {
                    logger.error(SequelizeDatabaseError)
                    await models.Watch.destroy({
                        where: {
                            id: watch.id,
                            user_id: id

                        }
                    })
                    res.statusCode = 401
                    res.send("Wrong input in alerts")
                    logger.info("Watch creation request unsuccessful")
                })
                .catch(function (err) {
                    logger.info("Watch creation request unsuccessful")
                    logger.error(err)
                    res.status(404).send({ error: "No User found with this Username" });
                    res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                });
        }

    }
}


exports.view = (req, res) => {
    logger.info("Watch get request")
    getWatchCounter.inc()
    var creds = auth(req);
    if (!creds) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Access denied')
        logger.info("Watch get request unsuccessful")
    } else {
        var username = creds.name;
        var password = creds.pass;
        models.User.findAll({
            where: {
                email_address: username
            }
        }).then(async function (account) {

            var valid = true;

            valid = compare(username, account[0].email_address);
            valid = bcrypt.compareSync(password, account[0].password) && valid;

            if (valid) {
                const end = getWatchdatabaseSummary.startTimer()
                var watch = await models.Watch.findOne({
                    where: {
                        id: req.params.watchID,
                        user_id: account[0].id

                    }, include: [
                        {
                            model: models.Alert,
                            required: false
                        }
                    ],
                })

                if (watch == null) {
                    res.send(res.statusCode = 404);
                    logger.info("Watch get request unsuccessful")

                }
                else {
                    res.send(watch);
                    logger.info("Watch get request successful")
                }
                end();

            }
            else {
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Access denied')
                logger.info("Watch get request unsuccessful")
            }
        })
            .catch(function (err) {
                logger.info("Watch get request unsuccessful")
                logger.error(err)
                res.status(404).send({ error: "No User found with this Username" });
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            });
    }



}

exports.viewall = (req, res) => {
    logger.info("Watch get all request")
    getAllWatchesCounter.inc()
    var creds = auth(req);
    if (!creds) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Access denied')
        logger.info("Watch get all request unsuccessful")
    } else {
        // var userId = req.params.userId;
        var username = creds.name;
        var password = creds.pass;
        models.User.findAll({
            where: {
                email_address: username
            }
        }).then(async function (account) {

            var valid = true;

            valid = compare(username, account[0].email_address);
            valid = bcrypt.compareSync(password, account[0].password) && valid;

            if (valid) {
                const end = getAllWatchesdatabaseSummary.startTimer();
                var watch = await models.Watch.findAll({
                    where: {
                        user_id: account[0].id

                    }, include: [
                        {
                            model: models.Alert,
                            required: false
                        }
                    ],
                })


                res.send(watch);
                logger.info("Watch get all request successful")
                end()
            }
            else {
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Access denied')
                logger.info("Watch get all request unsuccessful")
            }
        })
            .catch(function (err) {
                logger.info("Watch get all request unsuccessful")
                logger.error(err)
                res.status(404).send({ error: "No User found with this Username" });
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            });
    }
}



exports.delete = (req, res) => {
    logger.info("Watch delete request")
    deleteWatchCounter.inc()
    var creds = auth(req);
    if (!creds) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Access denied')
        logger.info("Watch delete request unsuccessful")
    } else {
        // var userId = req.params.userId;
        var username = creds.name;
        var password = creds.pass;
        models.User.findAll({
            where: {
                email_address: username
            }
        }).then(async function (account) {

            var valid = true;

            valid = compare(username, account[0].email_address);
            valid = bcrypt.compareSync(password, account[0].password) && valid;

            if (valid) {
                const end = deleteWatchdatabaseSummary.startTimer();
                var watch = await models.Watch.findOne({
                    where: {
                        id: req.params.watchID,
                        user_id: account[0].id

                    }, include: [
                        {
                            model: models.Alert,
                            required: false
                        }
                    ],
                })

                if (watch == null) {
                    res.send(res.statusCode = 404);
                    logger.info("Watch delete request unsuccessful")
                }
                else {
                    await models.Watch.destroy({
                        where: {

                            id: req.params.watchID,
                            user_id: account[0].id

                        }

                    })
                    end();
                    res.send(res.statusCode = 204);
                    logger.info("Watch delete request successful")
                    var msg = ` WatchId: ${req.params.watchID} Deleted Successfully`;
                    //send to kafka topic watch
                    topic_service("watch", msg, producer_service)

                }



            }
            else {
                res.statusCode = 401
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                res.end('Access denied')
                logger.info("Watch delete request unsuccessful")
            }
        })
            .catch(function (err) {
                logger.error(err)
                res.status(404).send({ error: "No User found with this Username" });
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
                logger.info("Watch delete request unsuccessful")
            });
    }



}



exports.update = (req, res) => {
    logger.info("Watch update request")
    updateWatchCounter.inc()
    var uuid = uuidv4();
    var creds = auth(req);
    const data = req.body;
    var datetimestamp = new Date();
    datetimestamp = datetimestamp.toString();
    var email_address;

    if (!creds) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
        res.end('Access denied')
        logger.info("Watch update request unsuccessful")
    } else {
        if (isNaN(data.zipcode) || data.zipcode.length != '5') {

            res.send("Enter valid Zip");
            logger.info("Watch update request unsuccessful")
        }

        else {

            var username = creds.name;
            var password = creds.pass;
            models.User.findAll({
                where: {
                    email_address: username
                }
            }).then(async function (account) {
                var valid = true;
                valid = compare(username, account[0].email_address);
                valid = bcrypt.compareSync(password, account[0].password) && valid;

                if (valid) {
                    const end = updateWatchdatabaseSummary.startTimer();
                    await models.Watch.update({
                        zipcode: data.zipcode,
                        watch_updated: datetimestamp
                    }, {
                        where: {
                            user_id: account[0].id,
                            id: req.params.watchID
                        }
                    }).catch(function (err) {
                        logger.error(err);
                        logger.info("Watch update request unsuccessful");
                        res.status(400)
                        res.end();
                    });

                    await models.Alert.destroy({
                        where: {
                            watch_id: req.params.watchID

                        }
                    })

                    for (var i = 0; i < data.alerts.length; i++) {
                        await models.Alert.create({
                            id: uuidv4(),
                            field_type: data.alerts[i].field_type,
                            operator: data.alerts[i].operator,
                            value: data.alerts[i].value,
                            watch_id: req.params.watchID,
                            alert_created: datetimestamp,
                            alert_updated: datetimestamp
                        })

                    }

                    const w = await models.Watch.findOne({
                        where: {
                            id: req.params.watchID
                        },
                        include: [
                            {
                                model: models.Alert,
                                required: false
                            }
                        ],
                    })
                    end();
                    res.send(w);
                    logger.info("Watch update request successful")
                    //send to kafka topic watch
                    topic_service("watch", JSON.stringify(w), producer_service)
                }

            }).catch(function (err) {
                logger.info("Watch update request unsuccessful")
                logger.error(err)
                res.status(404).send({ error: "No User found with this Username" });
                res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
            })

        }

    }
}