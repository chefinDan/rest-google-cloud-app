
var schema = {
    name: {
        in: ['body'],
        errorMessage: 'Boat name must be a string',
        isString: true,
        isLength: {
            errorMessage: 'Boat name should be at least 1 char long',
            options: { min: 1 }
        }        
    },
    type: {
        in: ['body'],
        isString: true,
        errorMessage: 'Boat type must be a string',
        isLength: {
            errorMessage: 'Boat type should be at least 1 char long',
            options: { min: 1 }
        }
    },
    length: {
        in: ['body'],
        errorMessage: 'Boat length should be integer',
        isInt: true
    },

}

module.exports.boatSchema = schema
module.exports.Boat = 'Boat'
