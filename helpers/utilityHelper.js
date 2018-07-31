const fs = require('fs');
const path = require('path');
const request = require('request-promise-native');
const uuid = require('uuid/v4');

class UtilityHelper {
    constructor (logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async shouldReplyToNumber(number) {
        return number.match(this.config.phoneNumberRegex) !== null;
    }

    async downloadMedia(url) {
        return new Promise((resolve, reject) => {
            this.logger.info(`downloading media: ${url}`);

            // open file
            const fileExtension = url.substr(url.lastIndexOf('.') + 1);
            const fileName = uuid() + '.' + fileExtension;
            const file = fs.createWriteStream(path.join(this.config.mediaStoragePath, fileName));

            // open media stream
            const req = request.get(url);
    
            // pipe the response to the file
            req.on('response', (response) => {
                response.pipe(file);
                req.end();
            });

            // close the file and resolve the promise when the request is finished
            req.on('end', async () => {
                file.close();
                resolve({
                    fileName: fileName,
                    data: await this.getEncodedMedia(fileName),
                    fileExtension: fileExtension
                });
            });

            // handle errors
            req.on('error', (err) => {
                this.logger.error(`failed to download media: ${url}`);
                this.logger.error(err);
                fs.unlink(fileName);
                reject(null);
            });
        });
    }

    async getEncodedMedia(file, directory) {
        return new Promise((resolve, reject) => {
            // read and convert file to base64 encoding
            fs.readFile(path.join(directory || this.config.mediaStoragePath, file), 'base64', (err, data) => {
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
