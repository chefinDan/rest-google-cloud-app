const loadService = require('../service/loadService');
const boatService = require('../service/boatService');
const { check, header, validationResult } = require('express-validator')


module.exports.listLoadsPublic = (req, res, next) => {
    checkValidation(req)
        .then(async () => {
            console.log("=== Getting all loads ");
            let data = await loadService.listLoads(req.query.next)
            for (let load of data.entities) {
                load.self = `${req.protocol}://${req.get('host')}/loads/${load.id}`
            }
            if (data.next)
				data.next = `${req.protocol}://${req.get('host')}${req.path}?next=` + encodeURIComponent(data.next);
			res.loads = data;            
            next();
        })
        .catch(next)
}

module.exports.listLoads = (req, res, next) => {
    checkValidation(req)
        .then(async () => {
            console.log("=== Getting all loads for user ", req.user.name.last);
            if(req.params.user_id !== req.user.id){
                next({status: 401, msg: `Not permitted to view resources for ${req.params.user_id}`});
                return null;
            }
            let data = await loadService.listLoads(req.query.next, req.user.id)
            for (let load of data.entities) {
                load.self = `${req.protocol}://${req.get('host')}${req.path}/${load.id}`
            }
            if (data.next)
                data.next = `${req.protocol}://${req.get('host')}${req.path}?next=` + encodeURIComponent(data.next);
            res.loads = data;
            next();            
        })
        .catch(next)
}

/** Create a load and update boat with load if boat id specified */
module.exports.createLoad = (req, res, next) => {
    checkValidation(req)
        .then(async () => {
            console.log("=== Creating new load\n", req.body);
			console.log("=== for user: ", req.user);
			let boat;
			req.body.owner = req.user.name.last;
			req.body.owner_id = req.user.id
			if(req.body.boat){
				boat = await boatService.getBoat(req.body.boat);
				if(boat.owner_id !== req.user.id) { throw { 'status': 403, 'msg': `You do not own the requested boat` }}
			}
			let load = await loadService.createLoad(req.body)
			if(load.boat){
				boat.loads.push(load.id);
				await boatService.updateBoat(boat, boat.id) 
			}
            load.self = `${req.protocol}://${req.get('host')}${req.route.path}/${load.id}`
            res.load = load
            next();
        })
        .catch(next)
}

/** Get a load */
exports.getLoad = (req, res, next) => {
    checkValidation(req)
    .then(async () => {
            console.log(`=== Getting Load: ${req.params.load_id} for user ${req.user.name.last}\n`);
            let load = await loadService.getLoad(req.params.load_id)
            if(load.owner_id !== req.user.id){
                next({status: 401, msg: "You do not have permission to access this resource"});
                return;
            }
            load.self = `${req.protocol}://${req.get('host')}${req.path}`
            req.load = load;
            next();
        })
        .catch(next)
}

module.exports.updateLoad = async (req, res, next) => {
	checkValidation(req)
        .then(async () => {
            console.log(`=== Updating load ${req.params.load_id} with ${JSON.stringify(req.body)}\n`);
            let load = await loadService.getLoad(req.params.load_id);
            if(load.owner_id !== req.user.id)
                throw {status: 401, msg: `Not permitted to modify this resource`};
            load = await loadService.updateLoad(req.body, req.params.load_id)
            load.self = `${req.protocol}://${req.get('host')}/loads/${load.id}`;
            res.load = load;
            next();
        })
        .catch(next)	
}

module.exports.deleteLoad = async (req, res, next) => {
	console.log(`=== Deleting load: ${req.params.id}\n`);
	try{
		const load = await loadService.getLoad(req.params.id);
		if(load.boat){
			let boat = await boatService.getBoat(load.boat)
			let loadIdx = boat.loads.indexOf(load.id);
			if(loadIdx > -1) {boat.loads.splice(loadIdx, 1)}
			await boatService.updateBoat(boat, boat.id);
		}
	}
	catch(err) {
		next(err);
		return;
	}

    loadService.deleteLoad(req.params.id, req.user.id)
        .then(() => {
            next();
        })
        .catch(next)
}



module.exports.validate = (method) => {
    switch (method) {
        case 'getLoad':
            return [
                header('accept', 'GET /loads/:id returns either application/json or text/html').isIn(['application/json', 'text/html', '*/*'])
            ]

        case 'createLoad': {
            return [
                header('content-type', 'server only accepts application/json').isIn(['application/json']),
                header('accept', 'POST /loads only returns application/json').isIn(['application/json', '*/*']),
                check('weight', 'must be a positive integer').isInt(),
                check('content', 'must be string with min length of 3').isString().isLength({ min: 3 }),
				check('delivery_date', 'must be a string with min length 5').isString().isLength({min: 5}),
				check('boat', `must be a string boat id length 16`).isString().isLength({min: 16, max: 16}).optional({nullable:true})
            ]
        }
        case 'listLoads': {
            return [
                header('accept', 'GET /loads only returns application/json').isIn(['application/json', '*/*']),
            ]
        }
        case 'updateLoad': {
            return [
                header('content-type', 'server only accepts application/json').isIn(['application/json']),
                header('accept', 'PATCH /loads/:load_id returns only application/json').isIn(['application/json', '*/*']),
                check('weight', 'must be a positive integer').isInt().bail().optional({nullable: true}),
                check('content', 'must be string with min length of 3').isString().bail().isLength({ min: 3 }).optional({nullable: true}),
				check('delivery_date', 'must be string min length 5').isString().bail().isLength({min: 5}).optional({nullable: true}),
				check('boat', `must be a string boat id length 16`).isString().bail().isLength({min: 16, max: 16}).optional({nullable:true})
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