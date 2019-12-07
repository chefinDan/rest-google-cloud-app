'use-strict'

const { Datastore } = require('@google-cloud/datastore');
const { Boat } = require('../models/Boat');
const { project } = require('../project')

const limit = project.response.limit;
const projectId = project.id;   
var datastore = new Datastore({projectId:projectId});

const parent = project['root-entity'];
const ancestorKey = datastore.key([parent.kind, parseInt(parent.id)]);

exports.createBoat = async boat => {
    let transaction = datastore.transaction();
    let boatKey = createKey(Boat);    
    let nameQuery = datastore.createQuery(Boat).hasAncestor(ancestorKey).filter('name', boat.name);
    
    try{
        await transaction.run();
        let [matchingBoat] = await transaction.runQuery(nameQuery);
    
        if(matchingBoat[0] && matchingBoat[0].name === boat.name){
            transaction.rollback()
            throw {'status': 403, 'msg': 'No matchy matchy!!'}
        }
        let createdBoat = {
            'key': boatKey,
            'data': {
                'name': boat.name,
                'type': boat.type,
                'length': parseInt(boat['length']),
                'owner_id': boat.owner_id,
                'owner': boat.owner
            }
        }
        await transaction.save(createdBoat);
        await transaction.commit()
        createdBoat = createdBoat.data
        createdBoat.id = boatKey.id
        return createdBoat;
    }
    catch(err){
        transaction.rollback()
        throw err
    }

}

exports.listBoats = async (cursor, sub) => {
    const entities = [];
    let query;
    if(sub)
        query = datastore.createQuery(Boat).hasAncestor(ancestorKey).filter('owner_id', sub).limit(limit);
    else
        query = datastore.createQuery(Boat).hasAncestor(ancestorKey).limit(limit);
    if(cursor){
        query = query.start(cursor);
    }
    const queryResult = await datastore.runQuery(query);
    
    console.log("query result: ", queryResult);
    
    for(entity of queryResult[0]){
        entities.push({
            'id': parseInt(entity[datastore.KEY].id),
            'name': entity.name,
            'type': entity.type,
            'length': entity['length'],
            'owner': entity.owner
        });
    }
    
    console.log(entities);
    let res = {'entities': entities}
    
    if(queryResult[1].moreResults === "MORE_RESULTS_AFTER_LIMIT")
        res.next = queryResult[1].endCursor;

    return res;
}

exports.getBoat = async boatId => {
    const boatKey = createKey(Boat, boatId)
    const transaction = datastore.transaction();
    try {
        await transaction.run();
        let [boat] = await transaction.get(boatKey);
        
        if (!boat) { throw {'status': 404, 'msg': `Entity id: ${boatId} not found`} }
        await transaction.commit();
        boat.id = boat[datastore.KEY].id
        return boat
    }
    catch (err) {
        transaction.rollback();
        throw err
    }

}

exports.deleteBoat = async (boatId, owner_id) => {
    const boatKey = createKey(Boat, boatId)
    const transaction = datastore.transaction();
    try {
        await transaction.run();
        const [boat] = await transaction.get(boatKey);
        if (!boat) { throw { 'status': 403, 'msg': `Entity id: ${boatId} not found` } }
        if(boat.owner_id !== owner_id) { throw { 'status': 403, 'msg': `You do not own the requested boat` }}
        await transaction.delete(boatKey);
        await transaction.commit();
    }
    catch (err) {
        transaction.rollback();
        throw err
    }
}
exports.updateBoat = async (properties, id) => {
    let transaction = datastore.transaction();
    let boatKey = createKey(Boat, id);
    
    try {
        await transaction.run();
        const [boat] = await transaction.get(boatKey);
        if (!boat) { throw { 'status': 404, 'details': `Boat id: ${id} not found` } }
        boat.name = (properties.name) ? properties.name : boat.name
        boat.type = (properties.type) ? properties.type : boat.type
        boat['length'] = (properties['length']) ? properties['length'] : boat['length']
        await transaction.save({
            'key': boatKey,
            'data': boat
        })
        await transaction.commit()
        boat.id = boatKey.id
        return boat
    }
    catch (err) {
        transaction.rollback()
        throw err
    }
}

exports.replaceBoat = async (newData, id) => {
    let transaction = datastore.transaction();
    let boatKey = createKey(Boat, id);

    try {
        await transaction.run();
        const [boat] = await transaction.get(boatKey);
        if (!boat) { throw { 'status': 404, 'details': `Boat id: ${id} not found` } }
        await transaction.save({
            'key': boatKey,
            'data': newData
        })
        await transaction.commit()
        newData.id = boatKey.id
        console.log(newData);
        
        return newData
    }
    catch (err) {
        transaction.rollback()
        throw err
    }
}

function createQuery(type, prop, keys){
    return keys.map((key) => { return datastore.createQuery(type).hasAncestor(ancestorKey).filter(prop, key); });
}

function createKey(type, id = null){
    if(id){
        return datastore.key([parent.kind, parseInt(parent.id), type, parseInt(id)]);
    }
    return datastore.key([parent.kind, parseInt(parent.id), type]);
}

async function runQuery(query){
    let promises = query.map(async query => { return await query.run(); });
    return await Promise.all(promises);
    
}

function getParentId() {
    const query = datastore.createQuery('parent').select('__key__');
    query.run()
        .then(([[queryResult]]) => {
            parentId = queryResult[datastore.KEY].id; 
        });
}


// const service = {
//     'createBoat': createBoat,
//     'listBoats': listBoats,
//     'getBoat': getBoat,
//     'deleteBoat': deleteBoat,
//     'updateBoat': updateBoat,
//     'replaceBoat': replaceBoat
// }

// module.exports.boatService = service