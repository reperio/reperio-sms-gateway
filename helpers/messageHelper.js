const moment = require('moment-timezone');

const BandwidthHelper = require('./bandwidthHelper');
const EmailHelper = require('./emailHelper');
const KazooHelper = require('./kazooHelper');
const TelnyxHelper = require('./telnyxHelper');
const UtilityHelper = require('./utilityHelper');

class MessageHelper {
    constructor(logger, config, recentNumbersCache) {
        this.logger = logger;
        this.config = config;
        this.recentNumbersCache = recentNumbersCache;
    }

    /*
        message:
            to: destination phone number
            from: originating phone number
            contents: contents of message
            endpoint: either 'telnyx' or 'bandwidth',
            media: list of media urls,
            requestId: id of the original hapi request
    */
    async processMessage(message) {
        this.logger.info(`processing message: ${JSON.stringify(message)}`);

        // set the time we received the message
        message.receivedAt = moment().tz(this.config.localTimezone);

        // initialize helpers
        const bandwidthHelper = new BandwidthHelper(this.logger, this.config);
        const emailHelper = new EmailHelper(this.logger, this.config);
        const kazooHelper = new KazooHelper(this.logger, this.config);
        const telnyxHelper = new TelnyxHelper(this.logger, this.config);
        const utilityHelper = new UtilityHelper(this.logger, this.config);

        // get user associated with destination phone number
        this.logger.info(`fetching user and account associated with number: ${message.to}`);
        if (Array.isArray(message.to)) {
            message.notificationEmails = [];
            message.responseTexts = {};
            for (const to of message.to) {
                const userAndAccount = await kazooHelper.getUserByPhoneNumber(to);
                this.logger.debug(userAndAccount);

                if (userAndAccount === null) {
                    this.logger.warn(`could not find user or account for number: ${to}, exiting script`);
                    return null;
                }

                // set notification email and response text on message object
                try {
                    message.notificationEmails.push(userAndAccount.user.email || userAndAccount.account.sms_contact_email || null);
                    message.responseTexts[to] = userAndAccount.user.sms_response_text || userAndAccount.account.sms_response_text || null;
                } catch (err) {
                    this.logger.warn('issue with setting notification email and response text');
                }
            }
        } else {
            const userAndAccount = await kazooHelper.getUserByPhoneNumber(message.to[0]);
            this.logger.debug(userAndAccount);

            if (userAndAccount === null) {
                this.logger.warn(`could not find user or account for number: ${message.to}, exiting script`);
                return null;
            }

            // set notification email and response text on message object
            try {
                message.notificationEmail = userAndAccount.user.email || userAndAccount.account.sms_contact_email || null;
                message.responseText = userAndAccount.user.sms_response_text || userAndAccount.account.sms_response_text || null;
            } catch (err) {
                this.logger.warn('issue with setting notification email and response text');
            }
        }

        // download any media in the message
        if (message.media && message.media.length > 0) {
            let auth = null;
            if (message.endpoint === 'bandwidth') {
                this.logger.info('configuring basic auth for bandwidth media requests');
                auth = {
                    user: this.config.bandwidth.authUsername,
                    password: this.config.bandwidth.authPassword
                };
            }

            this.logger.info(`media array has ${message.media.length} entries`);
            const media = [];
            for (let i = 0; i < message.media.length; i++) {
                const mediaFile = await utilityHelper.downloadMedia(message.media[i], auth);
                media.push(mediaFile);
            }

            message.media = media;
        } else {
            this.logger.info('message contained no media');
            message.media = null;
        }

        // look up cnam record (if enabled)
        if (this.config.cnam.enabled) {
            this.logger.info(`cnam lookup enabled, fetching record for ${message.from}`);
            message.cnam = await telnyxHelper.getCNAMRecord(message.from);
            this.logger.debug(`cnam reponse: ${message.cnam}`);
        } else {
            this.logger.info('cnam lookup disabled, skipping');
        }

        // send notification email
        if (message.notificationEmail === null && !message.notificationEmails.length) {
            this.logger.warn('could not find an email address, skipping notification email');
        } else {
            if (message.notificationEmails.length) {
                for (const email of message.notificationEmails) {
                    this.logger.info('sending notification email');
                    await emailHelper.sendEmail(message, email);
                    this.logger.info('email sent');
                }
            } else {
                this.logger.info('sending notification email');
                await emailHelper.sendEmail(message, message.notificationEmail);
                this.logger.info('email sent');
            }
        }

        // send response text
        this.logger.info('checking if message should be replied to');
        const cacheKey = await this.recentNumbersCache.buildCompositeKey(message.from, message.to);
        message.timeOflastResponseToConversation = await this.recentNumbersCache.getValueByKey(cacheKey);
        message.shouldReply = await utilityHelper.shouldReplyToNumber(message.from);

        if (!message.shouldReply) {
            this.logger.warn('originating number failed regex check, skipping reply message');
            message.shouldReply = false;
        } else if (message.timeOflastResponseToConversation !== null && moment.duration(moment.utc().diff(message.timeOflastResponseToConversation)).asMilliseconds() <= this.config.automatedResponseTimeLimit) {
            this.logger.warn('already replied to conversation, skipping reply message');
        } else if (message.responseText === null) {
            this.logger.warn('could not find response text, skipping reply message');
        } else {
            this.logger.info('reply message checks have passed');

            if (message.endpoint === 'telnyx') {
                this.logger.info('sending reply message through telnyx');
                await telnyxHelper.sendTextMessage(message);
                await this.recentNumbersCache.saveValueByKey(cacheKey, moment.utc());
                this.logger.info('reply message sent');
            } else if (message.endpoint === 'bandwidth') {
                this.logger.info('sending reply message through bandwidth');
                await bandwidthHelper.sendTextMessage(message);
                await this.recentNumbersCache.saveValueByKey(cacheKey, moment.utc());
                this.logger.info('reply message sent');
            } else {
                this.logger.warn(`invalid endpoint: ${message.endpoint}, reply message not sent`);
            }
        }

        // delete leftover media files
        if (message.media && message.media.length > 0) {
            for (let i = 0; i < message.media.length; i++) {
                this.logger.info(`deleting ${message.media[i].fileName} from local file system`);
                await utilityHelper.deleteMediaFile(message.media[i].fileName);

                // also delete media that was downloaded from bandwidth
                if (message.endpoint === 'bandwidth') {
                    this.logger.info(`deleting "${message.media[i].url}" (${message.media[i].fileName}) from bandwidth`);
                    await this.bandwidthHelper.deleteMediaFile(message.media[i].url);
                }
            }
        }

        return message;
    }
}

module.exports = MessageHelper;
