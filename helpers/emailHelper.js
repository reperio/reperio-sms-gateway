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

    async sendEmail(message) {
        if (this.config.email.method === 'smtp') {
            await this.sendSMTPEmail(message);
        } else if (this.config.email.method === 'sendgrid') {
            await this.sendSendGridEmail(message);
        } else {
            this.logger.error(`invalid email method "${this.config.email.method}", must be either "smtp" or "sendgrid"`);
            this.logger.error('unable to send email');
        }
    }

    async sendSendGridEmail(message) {
        const template = await this.loadTemplate();
        const formattedTemplate = await this.formatHtml(template, message);

        const msg = {
            to: message.notificationEmail,
            from: this.config.email.sender,
            subject: `New message from ${phoneFormatter.format(message.from, this.config.phoneNumberFormat)}`,
            text: message.contents,
            html: formattedTemplate
        };

        if (message.cnam) {
            msg.subject += ' - ' + message.cnam;
        }

        this.logger.debug(msg);

        await sgMail.send(msg);
    }

    async sendSMTPEmail(message) {
        return new Promise(async (resolve, reject) => {
            const template = await this.loadTemplate();
            const formattedTemplate = await this.formatHtml(template, message);

            let mailOptions = {
                from: this.config.email.sender,
                to: message.notificationEmail,
                subject: `New message from ${phoneFormatter.format(message.from, this.config.phoneNumberFormat)}`,
                text: message.contents,
                html: formattedTemplate
            };
        
            if (message.cnam) {
                mailOptions.subject += ' - ' + message.cnam;
            }

            this.logger.debug(mailOptions);
    
            // send mail with defined transport object
            this.transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    this.logger.error(error);
                    reject();
                }

                resolve();
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
            newTemplate = newTemplate.replace('{{date}}', message.receivedAt.format('MM/DD/YYYY hh:mm a'));

            if (message.media && message.media.length > 0) {
                this.logger.info('adding media entries to email');
                let mediaHtml = '';
                for (let i = 0; i < message.media.length; i++) {
                    mediaHtml += `<img class="image" src="${this.config.server.url}/${message.media[i]}" alt="${message.media[i]}" />\n`;
                }
                
                newTemplate = newTemplate.replace('{{media}}', mediaHtml);
            } else {
                newTemplate = newTemplate.replace('{{media}}', '');
            }

            this.logger.debug(newTemplate);
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
