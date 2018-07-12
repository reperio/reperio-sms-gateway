const Joi = require('joi');

const handlers = {
    telnyxIncoming: async (request, h) => {
        try {
            const logger = request.server.app.logger;
            const kazooHelper = await request.app.getNewKazooHelper();
            const emailHelper = await request.app.getNewEmailHelper();

            const messageDetails = request.payload;

            logger.info(`${request.info.id} - recieved Telnyx incoming SMS`);
            logger.debug(`${request.info.id} - ${JSON.stringify(request.payload)}`);

            logger.info(`${request.info.id} - searching for user with phone number: ${messageDetails.to}`);
            const user = await kazooHelper.getUserByPhoneNumber(request.info.id, messageDetails.to);
            logger.debug(`${request.info.id} - ${JSON.stringify(user)}`);

            logger.info(`${request.info.id} - sending email to user: ${user.id}`);
            await emailHelper.sendEmail(messageDetails.body, messageDetails.from, user.email);
            logger.info(`${request.info.id} - email sent`);
            return '';
        } catch (err) {
            this.logger.error(`${request.info.id} - failed to process telnyx SMS event`);
            this.logger.error(`${request.info.id} - ${err}`);
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
