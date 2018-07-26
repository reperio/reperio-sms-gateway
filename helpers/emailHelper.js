const nodemailer = require('nodemailer');
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
        const msg = {
            to: message.notificationEmail,
            from: this.config.email.sender,
            subject: `New message from ${message.from} ${message.cnam || ''}`,
            text: message.contents,
            html: message.contents
        };

        this.logger.debug(msg);

        await sgMail.send(msg);
    }

    async sendSMTPEmail(message) {
        return new Promise((resolve, reject) => {
            let mailOptions = {
                from: this.config.email.sender,
                to: message.notificationEmail,
                subject: `New message from ${message.from} ${message.cnam || ''}`,
                text: message.contents,
                html: message.contents
            };
        
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
}

module.exports = EmailHelper;
