module.exports = (app) => {
    const user = require('../controllers/userController.js');

    app.post('/v1/user', user.create);
    app.get('/v1/user/self', user.view);
    app.put('/v1/user/self', user.update);
    app.get('/v1/user/:userId', user.view_unauthenticated);

}