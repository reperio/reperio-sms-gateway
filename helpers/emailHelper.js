const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const phoneFormatter = require('phone-formatter');
const sgMail = require('@sendgrid/mail');

class EmailHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;

        const transporterOptions = {
            host: this.config.email.smtpHost,
            port: parseInt(this.config.email.smtpPort),
            secure: parseInt(this.config.email.smtpPort) === 465 ? true : false, // true for 465, false for other ports
            tls: {
                rejectUnauthorized: this.config.email.rejectUnauthorizedTLS
            }
        };

        // add auth to smtp transporter if it was configured
        if (this.config.email.smtpUser && this.config.email.smtpPassword) {
            transporterOptions.auth = {
                user: this.config.email.smtpUser,
                password: this.config.email.smtpPassword
            };
        }

        // create smtp transporter object
        this.transporter = nodemailer.createTransport(transporterOptions);

        // configure sendgrid package
        sgMail.setApiKey(this.config.email.sendGridApiKey);
    }

    async sendEmail(message, toEmailAddress) {
        if (this.config.email.method === 'smtp') {
            await this.sendSMTPEmail(message, toEmailAddress);
        } else if (this.config.email.method === 'sendgrid') {
            await this.sendSendGridEmail(message, toEmailAddress);
        } else {
            this.logger.error(`invalid email method "${this.config.email.method}", must be either "smtp" or "sendgrid"`);
            this.logger.error('unable to send email');
        }
    }

    async sendSendGridEmail(message, toEmailAddress) {
        const template = await this.loadTemplate();
        const formattedTemplate = await this.formatHtml(template, message);

        const msg = {
            to: toEmailAddress,
            from: this.config.email.sender,
            subject: `New message from ${phoneFormatter.format(message.from, this.config.phoneNumberFormat)}`,
            text: message.contents,
            html: formattedTemplate
        };

        if (message.cnam) {
            msg.subject += ' - ' + message.cnam;
        }

        if (message.media && message.media.length > 0) {
            msg.attachments = [];
            for (let i = 0; i < message.media.length; i++) {
                 
                msg.attachments.push({
                    filename: message.media[i].fileName,
                    contentType: `image/${message.media[i].mimeType}`,
                    cid: message.media[i].fileName,
                    content: message.media[i].data,
                    disposition: message.media[i].isImage ? 'inline' : 'attachment',
                    content_id: message.media[i].fileName
                });
            }
        }

        this.logger.debug(msg);

        await sgMail.send(msg);
    }

    async sendSMTPEmail(message, toEmailAddress) {
        return new Promise(async (resolve, reject) => {
            const template = await this.loadTemplate();
            const formattedTemplate = await this.formatHtml(template, message);

            let mailOptions = {
                from: this.config.email.sender,
                to: toEmailAddress,
                subject: `New message from ${phoneFormatter.format(message.from, this.config.phoneNumberFormat)}`,
                text: message.contents,
                html: formattedTemplate
            };
        
            if (message.cnam) {
                mailOptions.subject += ' - ' + message.cnam;
            }

            if (message.media && message.media.length > 0) {
                mailOptions.attachments = [];
                for (let i = 0; i < message.media.length; i++) {
                    mailOptions.attachments.push({
                        filename: message.media[i].fileName,
                        path: path.join(this.config.mediaStoragePath, message.media[i].fileName),
                        cid: message.media[i].fileName
                    });
                }
            }

            this.logger.debug(mailOptions);
    
            // send mail with defined transport object
            this.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    this.logger.error(error);
                    this.logger.error(info);
                    reject(error);
                } else {
                    this.logger.debug(info);
                    resolve();
                }
            });
        });
    }

    // read the email template from the file
    async loadTemplate() {
        return new Promise((resolve, reject) => {
            fs.readFile(path.join('templates', 'email.html'), (err, data) => {
                if (err) {
                    reject(err);
                }

                resolve('' + data);
            });
        });
    }

    async formatHtml(template, message) {
        try {
            this.logger.info('formatting email template html');
            let from = phoneFormatter.format(message.from, this.config.phoneNumberFormat);
            if (message.cnam) {
                from += ' - ' + message.cnam;
            }
        
            let newTemplate = template.replace('{{host}}', this.config.server.url);
            newTemplate = newTemplate.replace('{{from}}', from);
            newTemplate = newTemplate.replace('{{contents}}', message.contents);
            newTemplate = newTemplate.replace('{{date}}', message.receivedAt.format('MM/DD/YYYY hh:mm a z'));

            if (message.media && message.media.length > 0) {
                this.logger.info('adding media entries to email');
                let mediaHtml = '';
                for (let i = 0; i < message.media.length; i++) {
                    mediaHtml += await this.getImageText(message.media[i]);
                    this.logger.info(`processed ${message.media[i].fileName}`);
                }
                
                newTemplate = newTemplate.replace('{{media}}', mediaHtml);
            } else {
                newTemplate = newTemplate.replace('{{media}}', '');
            }

            this.logger.info('email formatted');
            return newTemplate;
        } catch (err) {
            this.logger.error('failed to format template');
            this.logger.error(err);
            throw err;
        }
    }

    async getImageText(media) {
        return media.isImage ? `<img style="max-width: 100%; margin-left: auto; margin-right: auto;" src="cid:${media.fileName}" alt="${media.fileName}" />\n` : '';
    }

    async sendJsonErrorEmail(payload) {
        if (this.config.email.method === 'smtp') {
            await this.sendJsonErrorSMTPEmail(payload);
        } else if (this.config.email.method === 'sendgrid') {
            await this.sendJsonErrorSendGridEmail(payload);
        } else {
            this.logger.error(`invalid email method "${this.config.email.method}", must be either "smtp" or "sendgrid"`);
            this.logger.error('unable to send email');
        }
    }

    async sendJsonErrorSendGridEmail(payload) {
        const template = await this.loadJsonErrorTemplate();
        const formattedTemplate = await this.formatJsonErrorHtml(template, payload);

        const msg = {
            to: this.config.email.errorEmailRecipient,
            from: this.config.email.sender,
            subject: `Message Failed from Bandwidth API`,
            text: JSON.stringify(payload, null, '&nbsp;'),
            html: formattedTemplate
        };

        this.logger.debug(msg);

        await sgMail.send(msg);
    }

    async sendJsonErrorSMTPEmail(payload) {
        return new Promise(async (resolve, reject) => {
            const template = await this.loadJsonErrorTemplate();
            const formattedTemplate = await this.formatJsonErrorHtml(template, payload);

            let mailOptions = {
                from: this.config.email.sender,
                to: this.config.email.errorEmailRecipient,
                subject: `Message Failed from Bandwidth API`,
                text: JSON.stringify(payload, null, '&nbsp;'),
                html: formattedTemplate
            };
        
            this.logger.debug(mailOptions);
    
            // send mail with defined transport object
            this.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    this.logger.error(error);
                    this.logger.error(info);
                    reject(error);
                } else {
                    this.logger.debug(info);
                    resolve();
                }
            });
        });
    }

    // read the email template from the file
    async loadJsonErrorTemplate() {
        return new Promise((resolve, reject) => {
            fs.readFile(path.join('templates', 'jsonErrorEmail.html'), (err, data) => {
                if (err) {
                    reject(err);
                }

                resolve('' + data);
            });
        });
    }

    async formatJsonErrorHtml(template, payload) {
        try {
            this.logger.info('formatting json error email template html');
        
            let newTemplate = template.replace('{{host}}', this.config.server.url);
            newTemplate = newTemplate.replace('{{payload}}', JSON.stringify(payload, null, 2));

            this.logger.info('email formatted');
            return newTemplate;
        } catch (err) {
            this.logger.error('failed to format template');
            this.logger.error(err);
            throw err;
        }
    }
}

module.exports = EmailHelper;
