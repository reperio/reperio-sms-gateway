const request = require('request-promise-native');

class BandwidthHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async sendTextMessage(message) {
        const url = `${this.config.bandwidth.url}/v1/users/${this.config.bandwidth.userId}/messages`;
        const body = {
            from: message.to,
            to: message.from,
            text: message.responseText,
            callbackUrl: `${this.config.server.url}/api/bandwidth/outgoing/${message.requestId}`,
            receiptRequested: 'all'
        };

        const options = {
            uri: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                user: this.config.bandwidth.authUsername,
                password: this.config.bandwidth.authPassword
            },
            json: body
        };

        this.logger.debug(options);
        const result = await request(options);
        return result;
    }
}

module.exports = BandwidthHelper;
