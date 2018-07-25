const BandwidthHelper = require('./bandwidthHelper');
const EmailHelper = require('./emailHelper');
const KazooHelper = require('./kazooHelper');
const TelnyxHelper = require('./telnyxHelper');
const UtilityHelper = require('./utilityHelper');

class MessageHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    /*
        message:
            to: destination phone number
            from: originating phone number
            contents: contents of message
            endpoint: either 'telnyx' or 'bandwidth'
    */
    async processMessage(message) {
        // initialize helpers
        const bandwidthHelper = new BandwidthHelper(this.logger, this.config);
        const emailHelper = new EmailHelper(this.logger, this.config);
        const kazooHelper = new KazooHelper(this.logger, this.config);
        const telnyxHelper = new TelnyxHelper(this.logger, this.config);
        const utilityHelper = new UtilityHelper(this.logger, this.config);

        // get user associated with destination phone number
        const userAndAccount = await kazooHelper.getUserByPhoneNumber(message.to);
        this.logger.debug(userAndAccount);

        // set notification email and response text on message object
        message.notificationEmail = userAndAccount.user.email || userAndAccount.account.sms_contact_email || null;
        message.responseText = userAndAccount.user.sms_response_text || userAndAccount.account.sms_response_text || null;

        // look up cnam record (if enabled)
        if (this.config.cnam.enabled) {
            this.logger.info(`cnam lookup enabled, fetching record for ${message.from}`);
            message.cnam = await telnyxHelper.getCNAMRecord(message.from);
        } else {
            this.logger.info('cnam lookup disabled, skipping');
        }

        // send notification email
        if (message.notificationEmail === null) {
            this.logger.warn('could not find an email address, skipping notification email');
        } else {
            this.logger.info('sending notification email');
            await emailHelper.sendEmail(message);
        }

        // send response text
        message.shouldReply = true;
        if (!utilityHelper.shouldReplyToNumber(message.from)) {
            this.logger.warn('originating number failed regex check, skipping reply message');
            message.shouldReply = false;
        } else if (message.responseText === null) {
            this.logger.warn('could not find response text, skipping reply message');
        } else {
            this.logger.info('originating number passed regex check');

            if (message.endpoint === 'telnyx') {
                this.logger.info('sending rely message through telnyx');
                await telnyxHelper.sendTextMessage(message);
            } else if (message.endpoint === 'bandwidth') {
                this.logger.info('sending reply message through bandwidth');
                await bandwidthHelper.sendTextMessage(message);
            }
        }

        return message;
    }
}

module.exports = MessageHelper;
