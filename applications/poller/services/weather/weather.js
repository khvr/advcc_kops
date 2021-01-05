var weather = require('openweather-apis');
const { logger } = require('../logger/winston');
require('dotenv').config();
module.exports= function(zipcode,callback){
weather.setLang('en');
weather.setZipCode(zipcode);

weather.setAPPID(process.env.OW_API_KEY);

weather.getAllWeather(function(err, JSONObj){
    if(err){
        logger.error(err);
    }
    else{
        if(JSONObj.cod==200){
            logger.info(`Weather JSON received ${JSON.stringify(JSONObj.main)}`)
            return callback(JSONObj.main);
        }
        else{
            logger.error(JSONObj.message)
        }
    }

})

var minutes = process.env.WEATHER_POLL_TIME, the_interval = minutes* 60 * 1000;
setInterval(function() {
    weather.getAllWeather(function(err, JSONObj){
        if(err){
            logger.error(err);
        }
        else{
        logger.info(`Weather JSON received ${JSON.stringify(JSONObj.main)}`)
        return callback(JSONObj.main);
        }
    })
}, the_interval);


}