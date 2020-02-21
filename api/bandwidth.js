const Joi = require('joi');
const EmailHelper = require('../helpers/emailHelper');
const config = require('../config');

const bandwidthHandler = async (request, h) => {
    const type = request.payload[0].type;
    if (type === 'message-received') {
        return await handlers.bandwidthIncoming(request, h);
    } else if (type === 'message-failed') {
        return await handlers.bandwidthOutgoingError(request, h);
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
    },
    bandwidthOutgoingError: async (request, h) => {
        const logger = request.app.logger;
        const payload = request.payload;
        const requestId = request.params.requestId || request.info.id;

        logger.setRequestId(requestId);
        logger.info(`Recieved Bandwidth outgoing SMS receipt error: ${JSON.stringify(payload)}`);

        const emailHelper = new EmailHelper(logger, config);
        await emailHelper.sendJsonErrorEmail(payload);

        return '';
    },
    v1BandwidthIncoming: async (request, h) => {
        const logger = request.app.logger;
        logger.info('recieved Bandwidth incoming request');
        try {
            if (Array.isArray(request.payload)) {
                logger.debug('bandwidth incoming request in v2 format');
                return await bandwidthHandler(request, h);
            }
        } catch (err) {
            logger.error('Failed to process v2 request from bandwidth')
            logger.error(err);
            return ''; // always return 200
        }
        
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

            await messageHelper.processMessageV1(message);

            return '';
        } catch (err) {
            logger.error('failed to process bandwith SMS event');
            logger.error(err);
            return '';
        }
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
                        tag: Joi.string().optional().allow(''),
                        applicationId: Joi.string().required(),
                        media: Joi.array().items(Joi.string()).optional(),
                        owner: Joi.string().required(),
                        direction: Joi.string().required(),
                        segmentCount: Joi.number().required(),
                    }).required(),
                })).required(),
            }
        },
        handler: bandwidthHandler
    },
    {
        method: 'POST',
        path: '/bandwidth/incoming',
        config: {
            auth: false,
            validate: {
                payload: [
                    // v1 payload
                    Joi.object({
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
                    }),
                    // v2 payload (for bandwidth sending to incorrect endpoint)
                    Joi.array().items(Joi.object({
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
                            tag: Joi.string().optional().allow(''),
                            applicationId: Joi.string().required(),
                            media: Joi.array().items(Joi.string()).optional(),
                            owner: Joi.string().required(),
                            direction: Joi.string().required(),
                            segmentCount: Joi.number().required(),
                        }).required(),
                    })).required()
                ]
            }
        },
        handler: handlers.v1BandwidthIncoming
    },
    {
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
