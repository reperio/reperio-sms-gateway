const Joi = require('joi');

const handlers = {
    bandwidthIncoming: async (request, h) => {
        try {
            const logger = request.server.app.logger;
            const kazooHelper = await request.app.getNewKazooHelper();
            const emailHelper = await request.app.getNewEmailHelper();

            const messageDetails = request.payload;

            logger.info(`${request.info.id} - recieved Bandwidth incoming SMS`);
            logger.debug(`${request.info.id} - ${JSON.stringify(request.payload)}`);

            logger.info(`${request.info.id} - searching for user with phone number: ${messageDetails.to}`);
            const user = await kazooHelper.getUserByPhoneNumber(request.info.id, messageDetails.to);
            logger.debug(`${request.info.id} - ${JSON.stringify(user)}`);

            logger.info(`${request.info.id} - sending email to user: ${user.id}`);
            await emailHelper.sendEmail(messageDetails.text, messageDetails.from, user.email);
            return '';
        } catch (err) {
            this.logger.error(`${request.info.id} - failed to process bandwith SMS event`);
            this.logger.error(`${request.info.id} - ${err}`);
            return '';
        }
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
    }
];

module.exports = {routes: routes, handlers: handlers};
