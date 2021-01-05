module.exports = (app) => {
  const metric = require('../controllers/metricController');

  app.get('/metrics', metric.getMetrics);


}