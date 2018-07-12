const request = require('request-promis-native');

class BandwidthHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async sendTextMessage(to, from, message) {
        
    }
}

module.exports = BandwidthHelper;
