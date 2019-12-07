'use strict';

/*
* NPM Module Dependies
*/
const express = require('express');
const exphbs = require('express-handlebars');

/*
*  Express declarations
*/
const routes = require('./routes/index');
const app = express();
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.enable('trust proxy');
app.use('/', routes);
app.use(express.static('public'))

module.exports = app
