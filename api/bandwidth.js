const Joi = require('joi');

const handlers = {
    bandwidthIncoming: async (request, h) => {
        const logger = request.server.app.logger;
        try {
            const kazooHelper = await request.app.getNewKazooHelper();
            const emailHelper = await request.app.getNewEmailHelper();
            const bandwidthHelper = await request.app.getNewBandwidthHelper();
            const utilityHelper = await request.app.getNewUtilityHelper();

            const messageDetails = request.payload;

            // ignore outgoing messages
            if (messageDetails.direction === 'out') {
                return '';
            }

            logger.info(`${request.info.id} - recieved Bandwidth incoming SMS`);
            logger.debug(`${request.info.id} - ${JSON.stringify(request.payload)}`);

            // get user attached to phone number
            logger.info(`${request.info.id} - searching for user with phone number: ${messageDetails.to}`);
            const user = await kazooHelper.getUserByPhoneNumber(request.info.id, messageDetails.to);
            logger.debug(`${request.info.id} - ${JSON.stringify(user)}`);

            if (user === null) {
                logger.warn(`${request.info.id} - couldn't find user for number: ${messageDetails.to}`);
                return '';
            }

            // send email to user with message contents
            logger.info(`${request.info.id} - sending email to ${user.email}`);
            await emailHelper.sendEmail(messageDetails.text, messageDetails.from, user.email);
            logger.info(`${request.info.id} - email sent`);

            // check to make sure the originating number is one we want to reply to
            if (utilityHelper.shouldReplyToNumber(messageDetails.from)) {
                // send reply message to originating number with response text from the kazoo user record
                logger.info(`${request.info.id} - sending reply sms to ${messageDetails.from} with text "${user.sms_response_text}"`);
                await bandwidthHelper.sendTextMessage(messageDetails.from, messageDetails.to, user.sms_response_text, request.info.id);
                logger.info(`${request.info.id} - sms reply sent`);
            }
            return '';
        } catch (err) {
            logger.error(`${request.info.id} - failed to process bandwith SMS event`);
            logger.error(`${request.info.id} - ${err}`);
            return '';
        }
    },
    bandwidthOutgoing: async (request, h) => {
        const logger = request.server.app.logger;
        const messageDetails = request.payload;
        const requestId = request.params.requestId || request.info.id;

        logger.info(`${requestId} - Recieved Bandwidth outgoing SMS receipt: ${JSON.stringify(messageDetails)}`);

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
