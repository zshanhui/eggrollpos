const environment = process.env.NODE_ENV || 'development';
const knexfile = require('./knexfile.js');
const config = knexfile[environment] || knexfile.development;

module.exports = require('knex')(config);