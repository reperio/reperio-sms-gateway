const Joi = require('joi');

const handlers = {
    bandwidthIncoming: async (request, h) => {
        const logger = request.app.logger;
        try {
            logger.info('recieved Bandwidth incoming SMS');
            logger.debug(request.payload);

            const messageHelper = await request.app.getNewMessageHelper();
            
            const message = {
                to: request.payload.to,
                from: request.payload.from,
                contents: request.payload.text,
                endpoint: 'bandwidth',
                requestId: request.info.id
            };

            if (request.payload.eventType === 'mms') {
                message.media = request.payload.media;
            }

            await messageHelper.processMessage(message);

            return '';
        } catch (err) {
            logger.error('failed to process bandwith SMS event');
            logger.error(err);
            return '';
        }
    },
    bandwidthOutgoing: async (request, h) => {
        const logger = request.app.logger;
        const messageDetails = request.payload;
        const requestId = request.params.requestId || request.info.id;

        logger.setRequestId(requestId);
        logger.info(`Recieved Bandwidth outgoing SMS receipt: ${JSON.stringify(messageDetails)}`);

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
                    segmentCount: Joi.number().optional(),
                    deliveryState: Joi.string().optional().allow('').allow(null),
                    deliveryCode: Joi.string().optional().allow('').allow(null),
                    deliveryDescription: Joi.string().optional().allow('').allow(null),
                    media: Joi.array().items(Joi.string()).optional()
                }
            }
        },
        handler: handlers.bandwidthIncoming
    }, {
        method: 'POST',
        path: '/bandwidth/outgoing/{requestId}',
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
        handler: handlers.bandwidthOutgoing
    }
];

module.exports = {routes: routes, handlers: handlers};
