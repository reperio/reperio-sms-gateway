const request = require('request-promise-native');

class TelnyxHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async sendTextMessage(message) {
        const url = `${this.config.telnyx.url}/messages`;
        const body = {
            from: message.to,
            to: message.from,
            body: message.responseText,
            delivery_status_webhook_url: `${this.config.server.url}/api/telnyx/outgoing/${message.requestId}`
        };

        const options = {
            uri: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-profile-secret': this.config.telnyx.profileSecret
            },
            json: body
        };

        this.logger.debug(options);
        const result = await request(options);
        return result;
    }

    async getCNAMRecord(phoneNumber) {
        try {
            this.logger.info(`fetching CNAM record for ${phoneNumber}`);
            const url = `${this.config.cnam.telnyxUrl}/v2/number_lookup/${phoneNumber}?type=caller-name`;
            const options = {
                uri: url,
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${this.config.cnam.telnyxApiToken}`,
                    "Content-Type": 'application/json',
                    "Accept": 'application/json'
                }
            };

            this.logger.debug(options);
            const result = JSON.parse(await request(options));
            return result.data.caller_name.caller_name;
        } catch (err) {
            this.logger.warn(`failed to fetch CNAM record for ${phoneNumber}`);
            this.logger.warn(err);
            return '';
        }
    }
}

module.exports = TelnyxHelper;
