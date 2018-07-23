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
                await emailHelper.sendEmail(messageDetails.body, messageDetails.from, notificationEmailAddress);
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
