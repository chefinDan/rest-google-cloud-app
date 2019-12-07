const boatService = require('../service/boatService');
const { check, header, validationResult } = require('express-validator')
const json2html = require('node-json2html')

const template = {
    '<>': 'div',
    'html': [
        {
            '<>': 'span',
            'id': 'entity-id',
            'html': '${id}'
        },
        {
            '<>': 'span',
            'id': 'entity-name',
            'html': '${name}'
        },
        {
            '<>': 'span',
            'id': 'entity-type',
            'html': '${type}'
        },
        {
            '<>': 'span',
            'id': 'entity-length',
            'html': '${length}'
        },
        {
            '<>': 'a',
            'href': '${self}',
            'id': 'entity-url',
            'html': 'self'
        }
    ]
};

exports.createBoat = (req, res, next) => {
    checkValidation(req)
        .then(async () => {
            console.log("=== Creating new boat\n", req.body);
            console.log(req.user)
            req.body.owner_id = req.user.sub;
            req.body.owner = req.user.family_name;
            let createdBoat = await boatService.createBoat(req.body)
            delete createdBoat.owner_id
            createdBoat.self = `${req.protocol}://${req.get('host')}${req.route.path}/${createdBoat.id}`
            res.status(201).json(createdBoat);
        })
        .catch(next)
}

exports.getBoat = (req, res, next) => {
    checkValidation(req)
    .then(async () => {
            console.log(`=== Getting boat: ${req.params.boat_id} for user ${req.user.family_name}\n`);
            let boat = await boatService.getBoat(req.params.boat_id)
            if(req.params.user_id !== req.user.family_name){
                next({status: 401, msg: "You do not have permission to access this resource"});
                return;
            }
            if(boat.owner_id !== req.user.sub){
                next({status: 401, msg: "You do not have permission to access this resource"});
                return;
            }
            boat.self = `${req.protocol}://${req.get('host')}${req.path}`
            delete boat.owner_id
            if(req.accepts('application/json') === 'application/json')
                res.status(200).json(boat);
            else
                res.status(200).send(json2html.transform(boat, template));
        })
        .catch(next)
}

exports.deleteBoat = (req, res, next) => {
    console.log(`=== Deleting boat: ${req.params.id}\n`);
    boatService.deleteBoat(req.params.id, req.user.sub)
        .then(() => {
            res.status(204).send();
        })
        .catch(next)
}

exports.listBoatsPublic = (req, res, next) => {
    checkValidation(req)
        .then(async () => {
            console.log("=== Getting all boats ");
            let data = await boatService.listBoats(req.query.next)
            for (let boat of data.entities) {
                boat.self = `${req.protocol}://${req.get('host')}/users/${boat.owner}/boats/${boat.id}`
                delete boat.owner_id
            }
            if (data.next)
                data.next = `${req.protocol}://${req.get('host')}${req.path}?next=` + encodeURIComponent(data.next);            
            res.status(200).json(data);
        })
        .catch(next)
}

exports.listBoats = (req, res, next) => {
    checkValidation(req)
        .then(async () => {
            console.log("=== Getting all boats for user ", req.user.family_name);
            if(req.params.user_id !== req.user.family_name){
                next({status: 401, msg: `Not permitted to view resources for ${req.params.user_id}`});
                return NULL;
            }
            let data = await boatService.listBoats(req.query.next, req.user.sub)
            for (let boat of data.entities) {
                boat.self = `${req.protocol}://${req.get('host')}${req.path}/${boat.id}`
            }
            if (data.next)
                data.next = `${req.protocol}://${req.get('host')}${req.path}?next=` + encodeURIComponent(data.next);            
            res.status(200).json(data);
        })
        .catch(next)
}

exports.updateBoat = (req, res, next) => {
    checkValidation(req)
        .then(async () => {
            console.log(`=== Updating boat ${req.params.id} with ${JSON.stringify(req.body)}\n`);
            let patchedBoat = await boatService.updateBoat(req.body, req.params.id)
            patchedBoat.self = `${req.protocol}://${req.get('host')}/boats/${patchedBoat.id}`
            res.status(200).json(patchedBoat);
        })
        .catch(next)
}

exports.replaceBoat = (req, res, next) => {
    checkValidation(req)
        .then(async () => {
            console.log(`=== Replacing boat ${req.params.id} with ${JSON.stringify(req.body)}\n`);
            let boat = await boatService.replaceBoat(req.body, req.params.id)
            res.set('Location', `${req.protocol}://${req.get('host')}/boats/${boat.id}`).status(303).send();
        })  
        .catch(next)
}

exports.validate = (method) => {
    switch (method) {
        case 'getBoat':
            return [
                header('accept', 'GET /boats/:id returns either application/json or text/html').isIn(['application/json', 'text/html', '*/*'])
            ]

        case 'createBoat': {
            return [
                header('content-type', 'server only accepts application/json').isIn(['application/json']),
                header('accept', 'POST /boats only returns application/json').isIn(['application/json', '*/*']),
                check('name', 'must be string with min length of 3').isString().isLength({ min: 3 }),
                check('type', 'must be string with min length of 3').isString().isLength({ min: 3 }),
                check('length', 'must be positive integer').isInt(),
            ]
        }
        case 'listBoats': {
            return [
                header('accept', 'GET /boats only returns application/json').isIn(['application/json', '*/*']),
            ]
        }
        case 'updateBoat': {
            return [
                header('content-type', 'server only accepts application/json').isIn(['application/json']),
                header('accept', 'PATCH /boats/:id returns only application/json').isIn(['application/json', '*/*']),
                check('name', 'must be string with min length of 3').isString().bail().isLength({ min: 3 }).optional({nullable: true}),
                check('type', 'must be string with min length of 3').isString().bail().isLength({ min: 3 }).optional({nullable: true}),
                check('length', 'must be positive integer').isInt().optional({nullable: true})
            ]
        }
        case 'replaceBoat': {
            return [
                header('content-type', 'server only accepts application/json').isIn(['application/json']),
                check('name', 'must be string with min length of 3').isString().bail().isLength({ min: 3 }),
                check('type', 'must be string with min length of 3').isString().bail().isLength({ min: 3 }),
                check('length', 'must be positive integer').isInt()
            ]
        }
    }
}

function checkValidation(req) {
    return new Promise((resolve, reject) => {
        try{
            validationResult(req).throw()
            resolve();
        }
        catch(error){
            error = error.mapped()
            if (error['content-type'])
                reject({ 'status': 406, error })
            if(error.accept)
                reject({ 'status': 406, error })

            reject({ 'status': 400, error })
        }
    });
}