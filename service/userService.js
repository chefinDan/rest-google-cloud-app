const axios = require('axios');
const { Datastore } = require('@google-cloud/datastore');

const peopleURI = 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses'
const { project } = require('../project');
const parent = project['root-entity'];
const projectId = project.id;  

var datastore = new Datastore({projectId:projectId});
const ancestorKey = datastore.key([parent.kind, parseInt(parent.id)]);

module.exports.getBySub = async (sub) => {
    query = datastore.createQuery('User').hasAncestor(ancestorKey).filter('sub', sub);
    const transaction = datastore.transaction();
    try {
        await transaction.run();
        const queryResult = await datastore.runQuery(query);
        if(!queryResult[0])
            return null
        let user = queryResult[0][0];
        user.id = user[datastore.KEY].id
        return user;
    }
    catch (err) {
        transaction.rollback();
        throw err
    }
}

module.exports.update = async (user) => {
    let userKey = datastore.key([parent.kind, parseInt(parent.id), 'User', parseInt(user[datastore.KEY].id)]);
    const updatedUser = {
        key: userKey,
        data: {
            email: user.email,
            name: user.name,
            sub: user.sub,
            access_token: user.access_token
        }
    }
    try {
        await datastore.save(updatedUser) 
    }
    catch (err) {
        throw err
    }
} 

module.exports.createUser = async (user_payload) => {
    let transaction = datastore.transaction();
    let userKey = datastore.key([parent.kind, parseInt(parent.id), 'User']);
    
    try{
        await transaction.run();
        let createdUser = {
            'key': userKey,
            'data': {
                'name': {
                    'first': user_payload.given_name,
                    'last': user_payload.family_name
                },
                'email': user_payload.email,
                'sub': user_payload.sub
            }
        }
        await transaction.save(createdUser);
        await transaction.commit();
        createdUser = createdUser.data
        createdUser.id = userKey.id
        return createdUser;
    }
    catch(err){
        transaction.rollback()
        throw err
    } 
}