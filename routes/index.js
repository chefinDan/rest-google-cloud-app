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
router.post('/', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.delete('/', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.put('/', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.patch('/', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.head('/', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});

/* Request a oauth url */
router.get('/oauth-uri',
    authController.uri
);
router.post('/oauth-uri', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.delete('/oauth-uri', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.put('/oauth-uri', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.patch('/oauth-uri', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.head('/oauth-uri', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});


/* Create a new user */
router.post('/tokensignin',
    urlencodedParser,
    authController.verifyLogin,
    userController.login,
    authController.checkAuth
);
router.get('/tokensignin', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.delete('/tokensignin', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.put('/tokensignin', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.patch('/tokensignin', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.head('/tokensignin', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});

/* Oauth Redirect Endpoint */
router.get('/auth/redirect',
    authController.redirect
);
router.post('/auth/redirect', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.delete('/auth/redirect', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.put('/auth/redirect', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.patch('/auth/redirect', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.head('/auth/redirect', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});

/* List all boats */
router.get('/boats',
    boatController.validate('listBoats'),
    boatController.listBoatsPublic,
    (req, res) => {
        res.status(200).json(res.boats);
    }
);
router.delete('/boats', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.put('/boats', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.patch('/boats', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.head('/boats', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});

/* List all loads */
router.get('/loads',
    loadController.validate('listLoads'),
    loadController.listLoadsPublic,
    (req, res) => {
        res.status(200).json(res.loads);
    }
);
router.delete('/loads', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.put('/loads', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.patch('/loads', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.head('/loads', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});

/*********************************************/
/***            Private Routes             ***/
/*********************************************/

/*------------User------------*/
/* get user info */
router.get('/users/me',
    authController.verifyCreds,
    userController.getUser,
    (req, res) => {
        res.status(200).json(req.user); 
    }
);
router.post('/users/me', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.delete('/users/me', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.put('/users/me', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.patch('/users/me', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.head('/users/me', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
/*----------------------------*/

/*-----------Boats------------*/
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
router.get('/boats', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.delete('/boats', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.put('/boats', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.patch('/boats', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.head('/boats', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});

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

/* Get boat by boat_id */
router.get('/boats/:boat_id',
    authController.verifyCreds,
    userController.getUser,
    boatController.getBoat,
    (req, res) => {
        if(req.accepts('application/json') === 'application/json')
            res.status(200).json(res.boat);
        else
            res.status(200).send(json2html.transform(res.boat, template));
    }
);

/* Update properties of a boat */
router.patch('/boats/:id',
    authController.verifyCreds,
    userController.getUser,
    jsonParser,
    boatController.validate('updateBoat'),
    boatController.updateBoat,
    (req, res) => {
        res.status(200).json(res.boat);
    }
);

/* Replace an existing boat */
router.put('/boats/:id',
    authController.verifyCreds,
    userController.getUser,
    jsonParser,
    boatController.validate('replaceBoat'),
    boatController.replaceBoat,
    (req, res) => {
        res.set('Location', `${req.protocol}://${req.get('host')}/boats/${res.boat.id}`).status(303).send();
    }
);

/* Delete boat by boat_id */
router.delete('/boats/:id',
    authController.verifyCreds,
    userController.getUser,
    boatController.deleteBoat,
    (req, res) => {
        res.status(204).send();
    }
);
router.head('/boats/:id', (req, res, next) => {res.set('Allow', `GET, PATCH, PUT, DELETE`).status(405).send();});


/*-------------Loads------------*/
/* Create load */
router.post('/loads',
    authController.verifyCreds,
    userController.getUser,
    jsonParser,
    loadController.validate('createLoad'),
    loadController.createLoad,
    (req, res) => {
        res.status(201).json(res.load);
    }
);
router.get('/loads', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.delete('/loads', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.put('/loads', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.patch('/loads', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});
router.head('/loads', (req, res, next) => {res.set('Allow', `POST`).status(405).send();});

/* List loads for user */
router.get('/users/:user_id/loads',
    authController.verifyCreds,
    userController.getUser,
    loadController.validate('listLoads'),
    loadController.listLoads,
    (req, res) => {
        res.status(200).json(res.loads);
    }
);
router.post('/users/:user_id/loads', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.delete('/users/:user_id/loads', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.put('/users/:user_id/loads', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.patch('/users/:user_id/loads', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});
router.head('/users/:user_id/loads', (req, res, next) => {res.set('Allow', `GET`).status(405).send();});


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

/** Update properties of a load */
router.patch('/loads/:load_id',
    authController.verifyCreds,
    userController.getUser,
    jsonParser,
    loadController.validate('updateLoad'),
    loadController.updateLoad,
    (req, res) => {
        res.status(200).json(res.load);
    }
);

/** replace an existing load */
router.put('/loads/:load_id',
    authController.verifyCreds,
    userController.getUser,
    jsonParser,
    loadController.validate('replaceLoad'),
    loadController.replaceLoad,
    (req, res) => {
        res.set('Location', `${req.protocol}://${req.get('host')}/loads/${res.load.id}`).status(303).send();
    }
);

/* Delete load by load_id */
router.delete('/loads/:id',
    authController.verifyCreds,
    userController.getUser,
    loadController.deleteLoad,
    (req, res) => {
        res.status(204).send();
    }
);
router.head('/loads/:id', (req, res, next) => {res.set('Allow', `GET, PATCH, PUT, DELETE`).status(405).send();});








router.use((err, req, res, next) => {
    console.error(err);
    if(err.status < 500)
        res.status(err.status).json(err)
    else
        res.status(500).json({ 'status': 500, 'details': 'Internal Server Error' });
});

module.exports = router;