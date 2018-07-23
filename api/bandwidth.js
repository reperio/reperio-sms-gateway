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
            const accountAndUser = await kazooHelper.getUserByPhoneNumber(request.info.id, messageDetails.to);
            logger.debug(`${request.info.id} - ${JSON.stringify(accountAndUser)}`);

            let notificationEmailAddress = '';
            let replyText = '';

            if (accountAndUser === null) {
                logger.warn(`${request.info.id} - couldn't find account or user for number: ${messageDetails.to}`);
                return '';
            }

            if (accountAndUser.user && accountAndUser.user.email) {
                notificationEmailAddress = accountAndUser.user.email;
            } else if (accountAndUser.account && accountAndUser.account.sms_contact_email) {
                notificationEmailAddress = accountAndUser.account.sms_contact_email;
            } else {
                notificationEmailAddress = null;
            }

            if (notificationEmailAddress) {
                // send email to user with message contents
                logger.info(`${request.info.id} - sending email to ${notificationEmailAddress}`);
                await emailHelper.sendEmail(messageDetails.text, messageDetails.from, notificationEmailAddress);
                logger.info(`${request.info.id} - email sent`);
            } else {
                logger.warn(`${request.info.id} - could not find email address, notification email not sent`);
            }

            if (accountAndUser.user && accountAndUser.user.sms_response_text) {
                replyText = accountAndUser.user.sms_response_text;
            } else if (accountAndUser.account && accountAndUser.account.sms_response_text) {
                replyText = accountAndUser.account.sms_response_text;
            } else {
                replyText = null;
            }

            if (!utilityHelper.shouldReplyToNumber(messageDetails.from)) {
                logger.warn(`${request.info.id} - originating number failed regex check, skipping sms reply`);
                return '';
            }
            logger.info(`${request.info.id} - originating number passed regex check`);

            if (replyText) {
                // send reply message to originating number with response text from the kazoo user record
                logger.info(`${request.info.id} - sending reply sms to ${messageDetails.from} with text "${replyText}"`);
                await bandwidthHelper.sendTextMessage(messageDetails.from, messageDetails.to, replyText, request.info.id);
                logger.info(`${request.info.id} - sms reply sent`);
            } else {
                logger.warn(`${request.info.id} - could not find response text, reply sms not sent`);
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
