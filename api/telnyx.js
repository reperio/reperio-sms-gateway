const Joi = require('joi');

const handlers = {
    telnyxIncoming: async (request, h) => {
        const logger = request.server.app.logger;
        try {
            const kazooHelper = await request.app.getNewKazooHelper();
            const emailHelper = await request.app.getNewEmailHelper();
            const bandwidthHelper = await request.app.getNewBandwidthHelper();
            const utilityHelper = await request.app.getNewUtilityHelper();

            const messageDetails = request.payload;

            logger.info(`${request.info.id} - recieved Telnyx incoming SMS`);
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
            await emailHelper.sendEmail(messageDetails.body, messageDetails.from, user.email);
            logger.info(`${request.info.id} - email sent`);

            if (utilityHelper.shouldReplyToNumber(messageDetails.from)) {
                // send reply message to originating number with response text from the kazoo user record
                logger.info(`${request.info.id} - sending reply sms to ${messageDetails.from} with text "${user.sms_response_text}"`);
                await bandwidthHelper.sendTextMessage(messageDetails.from, messageDetails.to, user.sms_response_text, request.info.id);
                logger.info(`${request.info.id} - sms reply sent`);
            } else {
                logger.info(`${request.info.id} - originating number failed regex match, skipping reply SMS`);
            }
            return '';
        } catch (err) {
            logger.error(`${request.info.id} - failed to process telnyx SMS event`);
            logger.error(`${request.info.id} - ${err}`);
            return '';
        }
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
