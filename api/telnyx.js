const Joi = require('joi');

const handlers = {
    telnyxIncoming: async (request, h) => {
        const logger = request.app.logger;
        try {
            logger.info('recieved Telnyx incoming SMS');
            logger.debug(request.payload);

            const messageHelper = await request.app.getNewMessageHelper();

            const message = {
                to: request.payload.to,
                from: request.payload.from,
                contents: request.payload.body,
                endpoint: 'telnyx',
                requestId: request.info.id
            };

            if (request.payload.media && request.payload.media.length > 0) {
                message.media = [];
                for (let i = 0; i < request.payload.media.length; i++) {
                    message.media.push(request.payload.media[i].url);
                }
            }

            await messageHelper.processMessage(message);

            return '';
        } catch (err) {
            logger.error('failed to process telnyx SMS event');
            logger.error(err);
            return '';
        }
    },
    telnyxOutgoing: async (request, h) => {
        const logger = request.app.logger;
        const messageDetails = request.payload;
        const requestId = request.params.requestId;

        logger.setRequestId(requestId);
        logger.info(`recieved Telnyx outgoing SMS receipt: ${JSON.stringify(messageDetails)}`);

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
    }, {
        method: 'POST',
        path: '/telnyx/outgoing/{requestId}',
        config: {
            auth: false,
            validate: {
                payload: {
                    sms_id: Joi.string().guid(),
                    gw_sms_id: Joi.string(),
                    user_id: Joi.string(),
                    profile_id: Joi.string().guid(),
                    status: Joi.string(),
                    delivery_status: Joi.string(),
                    msg: Joi.object({
                        src: Joi.string(),
                        dst: Joi.string(),
                        body: Joi.string()
                    }),
                    coding: Joi.number(),
                    parts: Joi.number(),
                    created: Joi.number(),
                    updated: Joi.number(),
                    date_created: Joi.date(),
                    date_updated: Joi.date(),
                    delivery_status_webhook_url: Joi.string(),
                    delivery_status_failover_url: Joi.string()
                }
            }
        },
        handler: handlers.telnyxOutgoing
    }
];

module.exports = {routes: routes, handlers: handlers};
