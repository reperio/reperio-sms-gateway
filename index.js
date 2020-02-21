const path = require('path');
const ReperioServer = require('hapijs-starter');

const API = require('./api');
const Cache = require('./cache');
const config = require('./config');
const LoggingHelper = require('./helpers/loggingHelper');
const MessageHelper = require('./helpers/messageHelper');

const start = async () => {
    try {
        // initialize the cache
        const recentNumbersCache = new Cache(config);

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

        await reperio_server.registerAdditionalPlugin(require('inert'));
        reperio_server.server.route({
            method: 'GET',
            path: '/{file}',
            config: { auth: false },
            handler: async (request, h) => {
                const file = request.params.file;
                request.app.logger.debug('received media request');
                const filePath = path.join('media', file);
                return h.file(filePath, { confine: false });
            }
        });

        await reperio_server.registerAdditionalPlugin(apiPluginPackage);

        reperio_server.app.config = config;

        // add a logger to the request that automagically prepends the request id to the message
        await reperio_server.registerExtension({
            type: 'onPostAuth',
            method: async (request, h) => {
                request.app.logger = new LoggingHelper(reperio_server.app.logger, request.info.id);
                const requestLogObject = {
                    auth: request.auth,
                    headers: request.headers,
                    payload: request.payload,
                    route: {
                        method: request.route.method,
                        path: request.route.path
                    }
                };

                request.app.logger.debug(`new request: ${JSON.stringify(requestLogObject)}`);

                return h.continue;
            }
        });

        await reperio_server.registerExtension({
            type: 'onRequest',
            method: async (request, h) => {
                request.app.getNewMessageHelper = async () => {
                    return new MessageHelper(request.app.logger, reperio_server.app.config, recentNumbersCache);
                };
                
                return h.continue;
            }
        });

        await reperio_server.registerExtension({
            type: 'onPreResponse',
            method: async (request, h) => {
                const { response } = request;
                if (response.isBoom && response.output.statusCode !== 200) {
                    request.app.logger.error('Unhandled Error');
                    request.app.logger.error(response);
                } else {
                    request.app.logger.debug(`${response.statusCode} response`);
                    request.app.logger.debug({...response, request: 'circular'});
                }
                return h.continue;
            }
        });

        await reperio_server.startServer();
    } catch (err) {
        console.error(err);
    }
};

start();
