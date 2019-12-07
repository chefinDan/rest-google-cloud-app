'use strict'

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const boatController = require('../controller/boat')
const authController = require('../controller/auth')
const userController = require('../controller/user')
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});


router.get('/',
    authController.loginScreen
);

router.post('/tokensignin',
    urlencodedParser,
    authController.verifyLogin,
    userController.login,
    authController.checkAuth
)

router.get('/auth/redirect',
    authController.redirect
);


router.get('/boats',
    boatController.validate('listBoats'),
    boatController.listBoatsPublic
);

router.get('/users/:user_id/boats',
    authController.jwt,
    boatController.validate('getBoat'),
    boatController.listBoats
);

router.post('/boats',
    authController.jwt,
    jsonParser,
    boatController.validate('createBoat'),
    boatController.createBoat
);

router.delete('/boats/:id',
    authController.jwt,
    boatController.deleteBoat
);

router.get('/users/:user_id/boats/:boat_id',
    authController.jwt,
    boatController.getBoat
);
    


router.use((err, req, res, next) => {
    console.error(err);
    if(err.status < 500)
        res.status(err.status).json(err)
    else
        res.status(500).json({ 'status': 500, 'details': 'Internal Server Error' });
});

module.exports = router;