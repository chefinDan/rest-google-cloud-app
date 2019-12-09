'use-strict'

const { Datastore } = require('@google-cloud/datastore');
const { Boat } = require('../models/Boat');
const { Load } = require('../models/Load');
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
                'loads': [],
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
            'loads': entity.loads,
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
exports.updateBoat = async (new_boat, id) => {
    const transaction = datastore.transaction();
    let boatKey = createKey(Boat, id);
    let toSave = [];
    
    try {
        await transaction.run();
        const [boat] = await transaction.get(boatKey);
        if (!boat) { throw { 'status': 404, 'details': `Boat id: ${id} not found` } }
        boat.name = (new_boat.name) ? new_boat.name : boat.name
        boat.type = (new_boat.type) ? new_boat.type : boat.type
        boat['length'] = (new_boat['length']) ? new_boat['length'] : boat['length']
        
        // If new boat has loads, and the old boat does not,
        // Then simply add the new loads to the boat. Nothing to remove. 
        if(hasLoads(new_boat) && hasEmptyLoad(boat)){
            for(const load_id of new_boat.loads){
                let loadKey = createKey(Load, load_id);
                let [load] = await transaction.get(loadKey)
                if (!load) { throw { 'status': 404, 'details': `Load id: ${load_id} not found` } }
                load.boat = boatKey.id;
                toSave.push({
                    'key': loadKey,
                    'data': load 
                });
            }
        }
        // If new boat has a loads array, and the old boat also has a loads array
        // Then remove all loads on old boat, and then add all loads from new boat 
        else if(hasLoads(new_boat) && hasLoads(boat)){
            for(const load_id of boat.loads){
                let loadKey = createKey(Load, load_id);
                let [load] = await transaction.get(loadKey)
                if (!load) { throw { 'status': 404, 'details': `Load id: ${load_id} not found` } }
                load.boat = null
                toSave.push({
                    'key': loadKey,
                    'data': load 
                })
            }
            for(const load_id of new_boat.loads){
                let loadKey = createKey(Load, load_id);
                let [load] = await transaction.get(loadKey)
                if (!load) { throw { 'status': 404, 'details': `Load id: ${load_id} not found` } }
                load.boat = boatKey.id
                toSave.push({
                    'key': loadKey,
                    'data': load 
                });
            }
        }
        // else if the new boat has an empty loads array and the old has loads
        // then remove old loads and add nothing.
        else if(hasEmptyLoad(new_boat) && hasLoads(boat)){
            for(const load_id of boat.loads){
                let loadKey = createKey(Load, load_id);
                let [load] = await transaction.get(loadKey)
                if (!load) { throw { 'status': 404, 'details': `Load id: ${load_id} not found` } }
                load.boat = null
                toSave.push({
                    'key': loadKey,
                    'data': load 
                })
            }
        }
        // else if the new boat has empty load, and the old boat has empty load
        // Then do nothing. 
        else if(hasEmptyLoad(new_boat) && hasEmptyLoad(boat)){
            //do nothing
        }

        if(!new_boat.loads)
            boat.loads = []
        else
            boat.loads = new_boat.loads
            
        toSave.push({
            'key': boatKey,
            'data': boat
        });
        await transaction.save(toSave);
        await transaction.commit();
        
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

function hasLoads(boatProps){
    if(Array.isArray(boatProps.loads) && boatProps.loads.length > 0){
        return true
    }
    return false
}

function hasEmptyLoad(boatProps){
    if(Array.isArray(boatProps.loads) && boatProps.loads.length === 0){
        return true
    }
    return false
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