const Joi = require('joi');

const handlers = {
    telnyxIncoming: async (request, h) => {
        request.server.app.logger.info(`${request.info.id} - recieved Telnyx incoming SMS`);
        request.server.app.logger.debug(`${request.info.id} - ${JSON.stringify(request.payload)}`);

        return '';
    }
};

const routes = [
    {
        method: 'POST',
        path: '/telnyx/incoming',
        config: {
            auth: false,
            validate: {
                payload: {
                    sms_id: Joi.string(),
                    from: Joi.string(),
                    to: Joi.string(),
                    body: Joi.string(),
                    media: Joi.array().items(Joi.object({
                        url: Joi.string(),
                        content_type: Joi.string(),
                        hash_sha256: Joi.string(),
                        size: Joi.number()
                    })).optional()
                }
            }
        },
        handler: handlers.telnyxIncoming
    }
];

module.exports = {routes: routes, handlers: handlers};
