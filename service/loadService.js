const { Datastore } = require('@google-cloud/datastore');
const { Load } = require('../models/Load');
const { Boat } = require('../models/Boat');
const { project } = require('../project')

const limit = project.response.limit;
const projectId = project.id;   
var datastore = new Datastore({projectId:projectId});

const parent = project['root-entity'];
const ancestorKey = datastore.key([parent.kind, parseInt(parent.id)]);

module.exports.removeLoadFromBoat = async (load_id) => {

}

module.exports.listLoads = async (cursor, id) => {
	const entities = [];
	let query;
    if(id)
        query = datastore.createQuery(Load).hasAncestor(ancestorKey).filter('owner_id', id).limit(limit);
    else
        query = datastore.createQuery(Load).hasAncestor(ancestorKey).limit(limit);
    if(cursor){
        query = query.start(cursor);
	}
	
    const queryResult = await datastore.runQuery(query);
    
    console.log("query result: ", queryResult);
    
    for(entity of queryResult[0]){
        entities.push({
            'id': parseInt(entity[datastore.KEY].id),
			'delivery_date': entity.delivery_date,
			'contents': entity.content,
			'weight': entity.weight,
			'boat': entity.boat,
			'owner': entity.owner,
			'owner_id': entity.owner_id
        });
    }
    
    console.log(entities);
    let res = {'entities': entities}
    
    if(queryResult[1].moreResults === "MORE_RESULTS_AFTER_LIMIT")
        res.next = queryResult[1].endCursor;

    return res;
}

module.exports.createLoad = async load => {
    const transaction = datastore.transaction();
	const loadKey = createKey(Load);
    try{
		await transaction.run();
        let createdLoad = {
            'key': loadKey,
            'data': {
				'owner': load.owner,
				'owner_id': load.owner_id,
                'weight': parseInt(load.weight),
                'content': load.content,
                'delivery_date': load.delivery_date,
                'boat': (load.boat) ? load.boat : null
            }
        }
		await transaction.save(createdLoad);
        await transaction.commit()
        createdLoad = createdLoad.data
        createdLoad.id = loadKey.id
        return createdLoad;
    }
    catch(err){
        transaction.rollback()
        throw err
    }
}

module.exports.getLoad = async loadId => {
    const loadKey = createKey(Load, loadId)
    const transaction = datastore.transaction();
    try {
        await transaction.run();
        let [load] = await transaction.get(loadKey);
        
        if (!load) { throw {'status': 404, 'msg': `Entity id: ${loadId} not found`} }
        await transaction.commit();
        load.id = load[datastore.KEY].id
        return load
    }
    catch (err) {
        transaction.rollback();
        throw err
    }
}

module.exports.updateLoad = async (new_load, id) => {
    const transaction = datastore.transaction();
    let loadKey = createKey(Load, id);
    
    try {
        await transaction.run();
        const [load] = await transaction.get(loadKey);
        if (!load) { throw { 'status': 404, 'details': `Load id: ${id} not found` } }
        load.weight = (new_load.weight) ? new_load.weight : load.weight;
        load.content = (new_load.content) ? new_load.content : load.content;
		load.delivery_date = (new_load.delivery_date) ? new_load.delivery_date : load.delivery_date;
		await updateBoatsInDatabase(new_load, loadKey, transaction);
		if(new_load.boat === null)
			 load.boat = null
		else if(new_load.boat !== undefined)
			load.boat = new_load.boat;
        
        await transaction.save({
            'key': loadKey,
            'data': load
        });
        await transaction.commit();
        
        load.id = loadKey.id
        return load
    }
    catch (err) {
        transaction.rollback()
        throw err
    }
}

module.exports.deleteLoad = async (loadId, owner_id) => {
    const loadKey = createKey(Load, loadId)
    const transaction = datastore.transaction();
    try {
        await transaction.run();
        const [load] = await transaction.get(loadKey);
        if (!load) { throw { 'status': 403, 'msg': `Entity id: ${loadId} not found` } }
        if(load.owner_id !== owner_id) { throw { 'status': 403, 'msg': `You do not own the requested load` }}
        await transaction.delete(loadKey);
        await transaction.commit();
    }
    catch (err) {
        transaction.rollback();
        throw err
    }
}

function createKey(type, id = null){
    if(id){
        return datastore.key([parent.kind, parseInt(parent.id), type, parseInt(id)]);
    }
    return datastore.key([parent.kind, parseInt(parent.id), type]);
}

// This function updates the boats in the database that might be carrying
// The load that is being updated. 
async function updateBoatsInDatabase (new_load, loadKey, transaction){
    let toSave = [];
    const [load] = await transaction.get(loadKey);
    // If new load has a boat, and the old load does not,
        // Then simply add the new boat to the load. Nothing to remove. 
        if(new_load.boat && !load.boat){
			let boatKey = createKey(Boat, new_load.boat);
			let [boat] = await transaction.get(boatKey);
			if (!boat) { throw { 'status': 404, 'details': `Boat id: ${new_load.boat} not found` } }
			boat.loads.push(loadKey.id);
			toSave.push({
				'key': boatKey,
				'data': boat 
			});
        }
        // If new load has a boat, and the old load also has a boat
        // Then remove the old boat, and add the new boat 
        else if(new_load.boat && load.boat){
			let boatKey = createKey(Boat, load.boat); // make key for boat with load to remove
			let [boat] = await transaction.get(boatKey) // get boat with load to remove
			if (!boat) { throw { 'status': 404, 'details': `Boat id: ${load.boat} not found` } }
			let loadIdx = boat.loads.indexOf(loadKey.id);    // find index in loads array of load to remove
			if(loadIdx > -1) {boat.loads.splice(loadIdx, 1)} // remove load from loads array
			toSave.push({
				'key': boatKey,
				'data': boat 
			})
			boatKey = createKey(Boat, new_load.boat); // make key for boat that load is being added to 
			[boat] = await transaction.get(boatKey); // get boat for which load is being added
			if (!boat) { throw { 'status': 404, 'details': `Boat id: ${new_load.boat} not found` } }
			boat.loads.push(loadKey.id); 
			toSave.push({
				'key': boatKey,
				'data': boat 
			});
        }
        // else if the new load does not have a boat, and the old load has a boat
        // then remove old load's boat. 
        else if(!new_load.boat && load.boat){
            let boatKey = createKey(Boat, load.boat); // make key for boat with load to remove
			let [boat] = await transaction.get(boatKey) // get boat with load to remove
			if (!boat) { throw { 'status': 404, 'details': `Boat id: ${load.boat} not found` } }
			let loadIdx = boat.loads.indexOf(loadKey.id);    // find index in loads array of load to remove
			if(loadIdx > -1) {boat.loads.splice(loadIdx, 1)} // remove load from loads array
			toSave.push({
				'key': boatKey,
				'data': boat 
			})
        }
        // else if the new load has no boat, and the old load has no boat
        // Then do nothing. 
        else if(!new_load.boat && !load.boat){
            //do nothing
        }

        await transaction.save(toSave);

}