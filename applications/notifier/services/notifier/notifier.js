const { logger } = require("../logger/winston");

module.exports= async function(op,val,user_field,current_value){
    // logger.info("Operator: "+op)
    switch (op) {
        case 'gt':
            // logger.info(current_value+">"+val)
          return current_value>val
          break;
        case 'gte':
            // logger.info(current_value+">="+val)
            return  current_value>=val
            break;
        case 'eq':
            // logger.info(current_value+"=="+val)
            return  current_value == val
            break;
        case 'lt':
            // logger.info(current_value+"<"+val)
            return current_value < val
            break;
        case 'lte':
            // logger.info(current_value+"<="+val)
            return current_value <= val
            break;
        default:
            logger.info(`unexpected operator`);
      }

}