const Kafka = require("kafkajs").Kafka
const promClient = require("prom-client");
const { logger } = require("../logger/winston");
const adminWeatherkafkaSummary = new promClient.Summary({
	name: 'admin_weather_kafka_call_summary',
	help: 'Summary of the duration of admin weather kafka call'
});
module.exports= async function(callback){
    try{
        const kafka = new Kafka({
            "clientId": "myapp",
            "brokers": [`${process.env.BROKER1}`,`${process.env.BROKER2}`,`${process.env.BROKER3}`]
        })
        const end = adminWeatherkafkaSummary.startTimer();
        const admin = kafka.admin();
        logger.info("notifier Connecting admin.....")
        await admin.connect()
        logger.info("Notifier Admin Connected")
        
        await admin.disconnect();
        end();
        await callback(true)
    }
    catch(ex){
        logger.error(`Something bad happened ${ex}`)
        callback(false)
    }
   

}