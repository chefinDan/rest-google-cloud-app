const loadService = require('../service/loadService');
const { check, header, validationResult } = require('express-validator')

module.exports.removeLoadFromBoat = async (id) => {
	try{
		loadService.removeLoadFromBoat(id);

	}
	catch(err){
		throw err
	}
}