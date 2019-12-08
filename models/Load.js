
var loadSchema = {
    weight: {
        in: ['body'],
        isInt: true,
        errorMessage: 'weight must be an int',
    },
    content: {
        in: ['body'],
        isString: true,
        errorMessage: 'content should be a string',
    }
    ,
    delivery_date: {
        in: ['body'],
        isString: true,
        errorMessage: 'delivery_date should be a string'
    }
}

module.exports.loadSchema = loadSchema;
module.exports.Load = 'Load';