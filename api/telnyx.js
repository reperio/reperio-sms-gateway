const Joi = require('joi');

const handlers = {
    telnyxIncoming: async (request, h) => {
        const logger = request.app.logger;
        try {
            const kazooHelper = await request.app.getNewKazooHelper();
            const emailHelper = await request.app.getNewEmailHelper();
            const telnyxHelper = await request.app.getNewTelnyxHelper();
            const utilityHelper = await request.app.getNewUtilityHelper();

            const messageDetails = request.payload;

            logger.info('recieved Telnyx incoming SMS');
            logger.debug(request.payload);

            // get user attached to phone number
            logger.info(`searching for user with phone number: ${messageDetails.to}`);
            const accountAndUser = await kazooHelper.getUserByPhoneNumber(messageDetails.to);
            logger.debug(accountAndUser);

            let notificationEmailAddress = '';
            let replyText = '';

            if (accountAndUser === null) {
                logger.warn(`couldn't find account or user for number: ${messageDetails.to}`);
                return '';
            }

            if (accountAndUser.user && accountAndUser.user.email) {
                notificationEmailAddress = accountAndUser.user.email;
            } else if (accountAndUser.account && accountAndUser.account.sms_contact_email) {
                notificationEmailAddress = accountAndUser.account.sms_contact_email;
            } else {
                notificationEmailAddress = null;
            }

            let cnam = '';
            if (request.server.app.config.cnam.enabled) {
                cnam = await telnyxHelper.getCNAMRecord(messageDetails.from);
            }

            if (notificationEmailAddress) {
                // send email to user with message contents
                logger.info(`sending email to ${notificationEmailAddress}`);
                await emailHelper.sendEmail(messageDetails.body, messageDetails.from, notificationEmailAddress, cnam);
                logger.info('email sent');
            } else {
                logger.warn('could not find email address, notification email not sent');
            }

            if (accountAndUser.user && accountAndUser.user.sms_response_text) {
                replyText = accountAndUser.user.sms_response_text;
            } else if (accountAndUser.account && accountAndUser.account.sms_response_text) {
                replyText = accountAndUser.account.sms_response_text;
            } else {
                replyText = null;
            }

            if (!utilityHelper.shouldReplyToNumber(messageDetails.from)) {
                logger.warn('originating number failed regex check, skipping sms reply');
                return '';
            }
            logger.info('originating number passed regex check');

            if (replyText) {
                // send reply message to originating number with response text from the kazoo user record
                logger.info(`sending reply sms to ${messageDetails.from} with text "${replyText}"`);
                await telnyxHelper.sendTextMessage(messageDetails.from, messageDetails.to, replyText, request.info.id);
                logger.info('sms reply sent');
            } else {
                logger.warn('could not find response text, reply sms not sent');
            }

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
