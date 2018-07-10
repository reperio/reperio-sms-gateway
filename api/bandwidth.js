const Joi = require('joi');

const handlers = {
    bandwidthIncoming: async (request, h) => {
        request.server.app.logger.info(`${request.info.id} - recieved Bandwidth incoming SMS`);
        request.server.app.logger.debug(`${request.info.id} - ${JSON.stringify(request.payload)}`);

        return '';
    }
};

const routes = [
    {
        method: 'POST',
        path: '/bandwidth/incoming',
        config: {
            auth: false,
            validate: {
                payload: {
                    eventType: Joi.string(),
                    direction: Joi.string(),
                    from: Joi.string(),
                    to: Joi.string(),
                    messageId: Joi.string(),
                    messageUri: Joi.string(),
                    text: Joi.string(),
                    applicationId: Joi.string(),
                    time: Joi.date(),
                    state: Joi.string(),
                    deliveryState: Joi.string(),
                    deliveryCode: Joi.string(),
                    deliveryDescription: Joi.string(),
                    media: Joi.array().items(Joi.string()).optional()
                }
            }
        },
        handler: handlers.bandwidthIncoming
    }
];

module.exports = {routes: routes, handlers: handlers};
