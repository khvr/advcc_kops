const bcrypt = require('bcrypt');
const auth = require('basic-auth');
const compare = require('tsscmp');
const saltRounds = 10;
var models = require('../models');
const { v4: uuidv4 } = require('uuid');
var passwordValidator = require('password-validator');
const promClient = require("prom-client");
const logger = require("../services/logger/winston").logger;

// counters for all APIs
const createUserCounter = new promClient.Counter({
	name: 'create_user_counter',
	help: 'Number of times create user API is called'
});
const getUserCounter = new promClient.Counter({
	name: 'get_user_counter',
	help: 'Number of times get user API is called'
});

const getUserUACounter = new promClient.Counter({
	name: 'get_user_UA_counter',
	help: 'Number of times get user Unauthenticated API is called'
});

const updateUserCounter = new promClient.Counter({
	name: 'update_user_counter',
	help: 'Number of times update user API is called'
});

// Prometheus summary
const createUserdatabaseSummary = new promClient.Summary({
	name: 'create_user_database_call_summary',
	help: 'Summary of the duration of create user database call'
});

const getUserdatabaseSummary = new promClient.Summary({
	name: 'get_user_database_call_summary',
	help: 'Summary of the duration of get user database call'
});

const getUserUAdatabaseSummary = new promClient.Summary({
	name: 'get_user_UA_database_call_summary',
	help: 'Summary of the duration of get user unauthenticated database call'
});

const updateUserdatabaseSummary = new promClient.Summary({
	name: 'update_user_database_call_summary',
	help: 'Summary of the duration of update user database call'
});




var schema = new passwordValidator();
schema
	.is().min(8)  // Minimum length 8
	.is().max(100)   // Maximum length 100
	.has().uppercase()  // Must have uppercase letters
	.has().lowercase()   // Must have lowercase letters
	.has().digits()  // Must have digits
	.has().not().spaces()  // Should not have spaces
	.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values


exports.create = (req, res) => {
	createUserCounter.inc();
	logger.info("User Creation request")
	var uuid = uuidv4();
	const data = req.body;

	var datetimestamp = new Date();
	datetimestamp = datetimestamp.toString();


	var validated_email = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email_address);
	var validated_fname = /^[A-Za-z.-]+(\s*[A-Za-z.-]+)*$/.test(data.first_name);
	var validated_lname = /^[A-Za-z.-]+(\s*[A-Za-z.-]+)*$/.test(data.last_name);

	if (!data.first_name) {
		res.status(400).send({
			Message: "Please provide first_name"
		});
	} else if (!data.last_name) {
		res.status(400).send({
			Message: "Please provide last_name"
		});
	} else if (!data.password) {
		res.status(400).send({
			Message: "Please provide password"
		});
	} else if (!data.email_address) {
		res.status(400).send({
			Message: "Please provide email address"
		});
	}
	else if (!validated_fname) {
		res.status(400).send({
			Message: "Please enter a valid first_name with characters!"
		});
	} else if (!validated_lname) {
		res.status(400).send({
			Message: "Please enter a valid last_name with characters!"
		});

	} else if (!schema.validate(data.password)) {
		res.status(400).send({
			Message: "Please enter a valid password!"
		});
	} else if (!validated_email) {
		res.status(400).send({
			Message: "Please enter a valid email address!"
		});
	}

	else {
		bcrypt.hash(data.password, saltRounds, function (err, hash) {
			if (err) {
				logger.error("Password storage Unsuccessful: \n" + err)
			} else {
				const end = createUserdatabaseSummary.startTimer();
				var User = models.User.build({
					id: uuid,
					first_name: data.first_name,
					last_name: data.last_name,
					password: hash,
					email_address: data.email_address,
					account_created: datetimestamp,
					account_updated: datetimestamp
				})
				User.save().then(function (err) {
					logger.info("User Created");
					User.password = undefined;
					res.status(201);
					res.send(User);
				}).catch(function (err) {
					logger.error("Duplicate user");
					res.status(400);
					res.send("Try with a different email address. Unable to create user");
				});
				end();
			}
		});
	}
}

exports.view = (req, res) => {
	logger.info("User Get Request")
	getUserCounter.inc()
	var creds = auth(req);
	if (!creds) {
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
		res.end('Access denied')
	} else {
		var username = creds.name;
		var password = creds.pass;
		const end = getUserdatabaseSummary.startTimer();
		models.User.findAll({
			where: {
				email_address: username
			}
		}).then(function (account) {
			var valid = true;
			var User;
			valid = compare(username, account[0].email_address);
			valid = bcrypt.compareSync(password, account[0].password) && valid;
			if (valid) {
				User = {
					id: account[0].id,
					first_name: account[0].first_name,
					last_name: account[0].last_name,
					email_address: account[0].email_address,
					account_created: account[0].account_created,
					account_updated: account[0].account_updated
				}
				res.statusCode = 200
				logger.info("User Get request successful")
				res.send(User);
				end();
			} else {
				logger.info("User Get request unsuccessful")
				res.statusCode = 401
				res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
				res.end('Access denied')
			}
		}).catch(function (err) {
			logger.error(err)
			res.statusCode = 401
			res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
			res.end('Access denied')
		});
	}
}


exports.update = (req, res) => {
	updateUserCounter.inc()
	logger.info("User update request")
	var creds = auth(req);
	const data = req.body;

	var datetimestamp = new Date();
	datetimestamp = datetimestamp.toString();

	if (!creds) {
		res.statusCode = 401
		res.setHeader('WWW-Authenticate', 'Basic realm="user Authentication"')
		res.end('Access denied')
	} else if (!data.first_name) {
		res.status(400).send({
			Message: "Please provide first_name"
		});
	} else if (!data.last_name) {
		res.status(400).send({
			Message: "Please provide last_name"
		});
	} else if (!data.password) {
		res.status(400).send({
			Message: "Please provide password"
		});
	} else
		if (!schema.validate(data.password)) {
			res.status(400).send({
				Message: "Please enter a valid password!"
			});
			res.end();
		}
		else if (!data.email_address) {
			res.status(400).send({
				Message: "Please provide email address"
			});
		} else if (data.account_created) {
			res.status(400).send({
				Message: "Account creation date cannot be updated"
			});
		} else if (data.account_updated) {
			res.status(400).send({
				Message: "Account updation date cannot be updated"
			});
		} else if (data.id) {
			res.status(400).send({
				Message: "Account id cannot be updated"
			});
		} else {
			var username = creds.name;
			var password = creds.pass;
			const end = updateUserdatabaseSummary.startTimer();
			models.User.findAll({
				where: {
					email_address: username
				}
			}).then(function (result) {
				var valid = true;
				valid = bcrypt.compareSync(password, result[0].password) && valid;
				valid = compare(username, data.email_address) && valid;
				if (valid) {
					bcrypt.hash(data.password, saltRounds, function (err, hash) {
						if (err) {
							logger.error(err);
						}
						else {
							models.User.update({
								first_name: data.first_name,
								last_name: data.last_name,
								password: hash,
								account_updated: datetimestamp
							}, {
								where: {
									email_address: username
								}
							}).then(function () {
								res.status(204)
								res.end("Details Updated");
								logger.info("User updation request successful")
							}).catch(function (err) {
								logger.error(err);
								res.status(400)
								res.end();
							})
						}
					});
				} else {
					res.statusCode = 401
					res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
					logger.info("User updation request unsuccessful")
					res.end('Access denied')
				}
			}).catch(function (err) {
				res.statusCode = 401
				res.setHeader('WWW-Authenticate', 'Basic realm="user account authentication"')
				res.end('User Not Found')
				logger.error(err);
			});
			end();
		}

}

exports.view_unauthenticated = (req, res) => {
	getUserUACounter.inc()
	logger.info("User Get information")
	var userId = req.params.userId;

	const end = getUserUAdatabaseSummary.startTimer();
	models.User.findAll({
		where: {
			id: userId
		}
	}).then(function (account) {
		User = {
			id: account[0].id,
			first_name: account[0].first_name,
			last_name: account[0].last_name,
			email_address: account[0].email_address,
			account_created: account[0].account_created,
			account_updated: account[0].account_updated
		}
		res.statusCode = 200
		logger.info("User Get information successful")
		res.send(User);
	}).catch(function (err) {
		logger.error("User not found")
		res.status(404).send({
			Message: "No user found"
		});
	})

	end();
}



promClient.collectDefaultMetrics();