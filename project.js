const yaml = require('js-yaml')
const fs = require('fs')

try {
    var env = yaml.safeLoad(fs.readFileSync('project.yaml', 'utf8'));
} catch (e) {
    console.log(e);
}

module.exports.project = env