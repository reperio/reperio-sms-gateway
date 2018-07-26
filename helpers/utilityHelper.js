const fs = require('fs');
const path = require('path');
class UtilityHelper {
    constructor (logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async shouldReplyToNumber(number) {
        return number.match(this.config.phoneNumberRegex) !== null;
    }

    async getEncodedMedia(file, directory) {
        return new Promise((resolve, reject) => {
            // read and convert file to base64 encoding
            fs.readFile(path.join(directory || 'media', file), 'base64', (err, data) => {
                if (err) {
                    this.logger.error('failed to get base64 encoded media');
                    this.logger.error(err);
                    reject(null);
                }

                resolve(data);
            });
        });
    }
}

module.exports = UtilityHelper;
