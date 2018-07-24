const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;

        // create smtp transporter object
        this.transporter = nodemailer.createTransport({
            host: this.config.email.smtpHost,
            port: parseInt(this.config.email.smtpPort),
            secure: parseInt(this.config.email.smtpPort) === 465 ? true : false, // true for 465, false for other ports
            auth: {
                user: this.config.email.smtpUser,
                pass: this.config.email.smtpPassword
            }
        });

        // configure sendgrid package
        sgMail.setApiKey(this.config.email.sendGridApiKey);
    }

    async sendEmail(message, from, email) {
        if (this.config.email.method === 'smtp') {
            await this.sendSMTPEmail(message, from, email);
        } else if (this.config.email.method === 'sendgrid') {
            await this.sendSendGridEmail(message, from, email);
        } else {
            this.logger.error(`invalid email method "${this.config.email.method}", must be either "smtp" or "sendgrid"`);
            this.logger.error('unable to send email');
        }
    }

    async sendSendGridEmail(message, from, email) {
        const msg = {
            to: email,
            from: this.config.email.sender,
            subject: `New message from ${from}`,
            text: message,
            html: message
        };

        this.logger.debug(msg);

        await sgMail.send(msg);
    }

    async sendSMTPEmail(message, from, email) {
        return new Promise((resolve, reject) => {
            let mailOptions = {
                from: this.config.email.sender,
                to: email,
                subject: `New message from ${from}`,
                text: message,
                html: message
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
