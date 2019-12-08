'use strict'

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const boatController = require('../controller/boat')
const authController = require('../controller/auth')
const userController = require('../controller/user')
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});

/*** Public Routes ***/
router.get('/',
    authController.loginScreen
);

router.get('/oauth-uri',
    authController.uri
);

router.get('/boats',
    boatController.validate('listBoats'),
    boatController.listBoatsPublic
);

router.post('/tokensignin',
    urlencodedParser,
    authController.verifyLogin,
    userController.login,
    authController.checkAuth
);

router.get('/auth/redirect',
    authController.redirect
);


/*** Private Routes ***/
router.get('/users/me',
    authController.verifyCreds,
    userController.getUser,
    (req, res) => {
        res.status(200).json(req.user); 
    }
);

router.get('/users/:user_id/boats',
    authController.verifyCreds,
    userController.getUser,
    boatController.validate('getBoat'),
    boatController.listBoats,
    (req, res) => {
        res.status(200).json(req.boats);
    }
);

router.get('/users/:user_id/boats/:boat_id',
    authController.verifyCreds,
    userController.getUser,
    boatController.getBoat,
    (req, res) => {
        if(req.accepts('application/json') === 'application/json')
            res.status(200).json(req.boat);
        else
            res.status(200).send(json2html.transform(req.boat, template));
    }
);

router.post('/boats',
    authController.verifyCreds,
    userController.getUser,
    jsonParser,
    boatController.validate('createBoat'),
    boatController.createBoat,
    (req, res) => {
        res.status(201).json(req.boat);
    }
);




router.delete('/boats/:id',
    authController.verifyCreds,
    boatController.deleteBoat
);




router.use((err, req, res, next) => {
    console.error(err);
    if(err.status < 500)
        res.status(err.status).json(err)
    else
        res.status(500).json({ 'status': 500, 'details': 'Internal Server Error' });
});

module.exports = router;