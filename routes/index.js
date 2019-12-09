'use strict'

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const boatController = require('../controller/boat');
const authController = require('../controller/auth');
const userController = require('../controller/user');
const loadController = require('../controller/load');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});

/***************************************/
/***          Public Routes          ***/
/***************************************/

/* Browser login screen */
router.get('/',
    authController.loginScreen
);

/* Request a oauth url */
router.get('/oauth-uri',
    authController.uri
);

/* Create a new user */
router.post('/tokensignin',
    urlencodedParser,
    authController.verifyLogin,
    userController.login,
    authController.checkAuth
);

/* Oauth Redirect Endpoint */
router.get('/auth/redirect',
    authController.redirect
);

/* List all boats */
router.get('/boats',
    boatController.validate('listBoats'),
    boatController.listBoatsPublic
);

/* List all loads */
router.get('/loads',
    loadController.validate('listLoads'),
    loadController.listLoadsPublic,
    (req, res) => {
        res.status(200).json(res.loads);
    }
);

/*********************************************/
/***            Private Routes             ***/
/*********************************************/

/* get user info */
router.get('/users/me',
    authController.verifyCreds,
    userController.getUser,
    (req, res) => {
        res.status(200).json(req.user); 
    }
);

/* List boats for user */
router.get('/users/:user_id/boats',
    authController.verifyCreds,
    userController.getUser,
    boatController.validate('getBoat'),
    boatController.listBoats,
    (req, res) => {
        res.status(200).json(req.boats);
    }
);

/* Get boat by boat_id for user */
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

/* Create boat */
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

/* Update properties of a boat */
router.patch('/boats/:id',
    authController.verifyCreds,
    userController.getUser,
    jsonParser,
    boatController.updateBoat,
    (req, res) => {
        res.status(200).json(res.boat);
    }
)

/* Delete boat by boat_id */
router.delete('/boats/:id',
    authController.verifyCreds,
    userController.getUser,
    boatController.deleteBoat,
    (req, res) => {
        res.status(204).send();
    }
);

/* Create load */
router.post('/loads',
    authController.verifyCreds,
    userController.getUser,
    jsonParser,
    loadController.validate('createLoad'),
    loadController.createLoad,
    (req, res) => {
        res.status(201).json(req.load);
    }
);

/* Get load by load_id */
router.get('/loads/:load_id',
    authController.verifyCreds,
    userController.getUser,
    loadController.validate('getLoad'),
    loadController.getLoad,
    (req, res) => {
        res.status(200).json(req.load);
    }
);

/* List loads for user */
router.get('/users/:user_id/loads',
    authController.verifyCreds,
    userController.getUser,
    loadController.validate('listLoads'),
    loadController.listLoads,
    (req, res) => {
        res.status(200).json(res.loads);
    }
)

/* Delete load by load_id */
router.delete('/loads/:id',
    authController.verifyCreds,
    userController.getUser,
    loadController.deleteLoad,
    (req, res) => {
        res.status(204).send();
    }
);








router.use((err, req, res, next) => {
    console.error(err);
    if(err.status < 500)
        res.status(err.status).json(err)
    else
        res.status(500).json({ 'status': 500, 'details': 'Internal Server Error' });
});

module.exports = router;