module.exports = (app) => {
    const watch = require('../controllers/watchController.js');

    app.post('/v1/watch', watch.create);
    app.get('/v1/watch/:watchID', watch.view);
    app.get('/v1/watches', watch.viewall);
    app.put('/v1/watch/:watchID', watch.update);
    app.delete('/v1/watch/:watchID', watch.delete);
}