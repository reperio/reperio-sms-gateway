const ReperioServer = require('hapijs-starter');
const API = require('./api');
const config = require('./config');
const BandwidthHelper = require('./helpers/bandwidthHelper');
const EmailHelper = require('./helpers/emailHelper');
const KazooHelper = require('./helpers/kazooHelper');
const LoggingHelper = require('./helpers/loggingHelper');
const TelnyxHelper = require('./helpers/telnyxHelper');
const UtilityHelper = require('./helpers/utilityHelper');

const start = async () => {
    try {
        //status monitor is turned off due to dependency issue with the pidusage dependency on the master branch of hapijs-status-monitor
        const reperio_server = new ReperioServer({
            statusMonitor: false,
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

        // add a logger to the request that automagically prepends the request id to the message
        await reperio_server.registerExtension({
            type: 'onPostAuth',
            method: async (request, h) => {
                request.app.logger = new LoggingHelper(reperio_server.app.logger, request.info.id);

                return h.continue;
            }
        });

        await reperio_server.registerExtension({
            type: 'onRequest',
            method: async (request, h) => {
                request.app.getNewBandwidthHelper = async () => {
                    return new BandwidthHelper(request.app.logger, reperio_server.app.config);
                };
                
                request.app.getNewEmailHelper = async () => {
                    return new EmailHelper(request.app.logger, reperio_server.app.config);
                };

                request.app.getNewKazooHelper = async () => {
                    return new KazooHelper(request.app.logger, reperio_server.app.config);
                };

                request.app.getNewTelnyxHelper = async () => {
                    return new TelnyxHelper(request.app.logger, reperio_server.app.config);
                };

                request.app.getNewUtilityHelper = async () => {
                    return new UtilityHelper(request.app.logger, reperio_server.app.config);
                };
                
                return h.continue;
            }
        });

        await reperio_server.startServer();
    } catch (err) {
        console.error(err);
    }
};

start();
