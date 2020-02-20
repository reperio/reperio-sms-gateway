const Joi = require('joi');

const bandwidthHandler = async (request, h) => {
    const type = request.payload[0].type;
    if (type === 'messsage-received') {
        return await handlers.bandwidthIncoming(request, h);
    } else {
        return await handlers.bandwidthOutgoing(request, h);
    }
}

const handlers = {
    bandwidthHandler,
    bandwidthIncoming: async (request, h) => {
        const logger = request.app.logger;
        try {
            logger.info('recieved Bandwidth incoming SMS');
            logger.debug(request.payload);

            const messageHelper = await request.app.getNewMessageHelper();
            const bandwidthMessage = request.payload[0];
            
            const message = {
                to: bandwidthMessage.message.to,
                from: bandwidthMessage.message.from,
                contents: bandwidthMessage.message.text,
                endpoint: 'bandwidth',
                requestId: request.info.id
            };

            if (request.payload.eventType === 'mms') {
                message.media = bandwidthMessage.message.media;
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
        path: '/bandwidth',
        config: {
            auth: false,
            validate: {
                payload: Joi.array().items(Joi.object({
                    type: Joi.string().required(),
                    time: Joi.date().required(),
                    description: Joi.string().required(),
                    to: Joi.string().required(),
                    errorCode: Joi.number().optional(),
                    message: Joi.object({
                        id: Joi.string().required(),
                        time: Joi.date().required(),
                        to: [Joi.string(), Joi.array().items(Joi.string())],
                        from: Joi.string().required(),
                        text: Joi.string().optional().allow(''),
                        applicationId: Joi.string().required(),
                        media: Joi.array().items(Joi.string()).optional(),
                        owner: Joi.string().required(),
                        direction: Joi.string().required(),
                        segmentCount: Joi.number().required(),
                    }).required(),
                })).required(),
            }
        },
        handler: handlers.bandwidthIncoming
    }
];

module.exports = {routes: routes, handlers: handlers};
