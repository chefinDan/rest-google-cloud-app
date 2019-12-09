const { Datastore } = require('@google-cloud/datastore');
const { Load } = require('../models/Load');
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
    let transaction = datastore.transaction();
    let loadKey = createKey(Load);    
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
                'boat': null
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

exports.getLoad = async loadId => {
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