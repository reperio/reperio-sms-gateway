const request = require('request-promise-native');

class BandwidthHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async sendTextMessage(message) {
        if (Array.isArray(message.to)) {
            const resultList = [];
            for (const to of message.to) {
                const singleMessage = {
                    ...message,
                    to,
                    responseText: message.responseTexts[to]
                }
                const result = await this._sendMessage(singleMessage);
                resultList.push(result);
            }
            return resultList;
        } else {
            return await this._sendMessage(message);
        }
    }
    
    async _sendMessage(message) {
        const url = `${this.config.bandwidth.url}/v2/users/${this.config.bandwidth.accountId}/messages`;

        const body = {
            from: message.to,
            to: message.from,
            text: message.responseText,
            applicationId: this.config.bandwidth.applicationId,
        };

        const options = {
            uri: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            auth: {
                user: this.config.bandwidth.authUsername,
                pass: this.config.bandwidth.authPassword
            },
            json: body
        };

        this.logger.debug(options);
        const result = await request(options);
        return result;
    }

    async deleteMedia(url) {
        const options = {
            uri: url,
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                user: this.config.bandwidth.authUsername,
                password: this.config.bandwidth.authPassword
            }
        };

        this.logger.debug(options);
        const result = await request(options);
        return result;
    }
}

module.exports = BandwidthHelper;
