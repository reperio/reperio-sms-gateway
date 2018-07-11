const ReperioServer = require('hapijs-starter');
const API = require('./api');
const config = require('./config');

const start = async () => {
    try {
        //status monitor is turned off due to dependency issue with the pidusage dependency on the master branch of hapijs-status-monitor
        const reperio_server = new ReperioServer({
            statusMonitor: true,
            cors: true,
            corsOrigins: ['*'],
            authEnabled: true,
            authSecret: config.server.jsonSecret});

        const apiPluginPackage = {
            plugin: API,
            options: {},
            routes: {
                prefix: '/api'
            }
        };

        await reperio_server.registerAdditionalPlugin(apiPluginPackage);

        reperio_server.app.config = config;

        await reperio_server.startServer();
    } catch (err) {
        console.error(err);
    }
};

start();
