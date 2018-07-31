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

    async downloadMedia(url, auth) {
        return new Promise((resolve, reject) => {
            // open file
            const fileExtension = url.substr(url.lastIndexOf('.') + 1);
            const fileName = uuid() + '.' + fileExtension;
            const file = fs.createWriteStream(path.join(this.config.mediaStoragePath, fileName));

            this.logger.info(`downloading media: ${url} -> ${this.config.mediaStoragePath}/${fileName}`);

            // configure request options
            const options = {
                uri: url
            };

            // add auth if provided
            if (auth) {
                this.logger.debug('adding auth to media request');
                options.auth = auth;
            }

            // open media stream
            const req = request.get(options);
    
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

    async deleteMediaFile(file) {
        return new Promise((resolve, reject) => {
            this.logger.info(`deleting media file: ${this.config.mediaStoragePath}/${file}`);
            fs.unlink(path.join(this.config.mediaStoragePath, file), (err) => {
                if (err) {
                    this.logger.error(`failed to delete media file: ${file}`);
                    this.logger.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = UtilityHelper;
