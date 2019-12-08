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