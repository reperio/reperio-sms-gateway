const request = require('request-promise-native');

class TelnyxHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async sendTextMessage(to, from, message, requestId) {
        const url = `${this.config.telnyx.url}/messages`;
        const body = {
            from: from,
            to: to,
            body: message,
            delivery_status_webhook_url: `${this.config.server.url}/api/telnyx/outgoing/${requestId}`
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

        const result = await request(options);
        return result;
    }
}

module.exports = TelnyxHelper;
