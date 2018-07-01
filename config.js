const env = process.env.NODE_ENV || 'development';

const config_name = `config-${env}`;

const config = require(`./${config_name}`);

module.exports = config;
