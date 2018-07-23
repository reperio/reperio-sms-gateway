const sgMail = require('@sendgrid/mail');

class EmailHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;

        sgMail.setApiKey(this.config.sendgrid.apiKey);
    }

    async sendEmail(message, from, email) {
        const msg = {
            to: email,
            from: this.config.sendgrid.from,
            subject: `New message from ${from}`,
            text: message,
            html: message
        };

        this.logger.debug(msg);
        await sgMail.send(msg);
    }
}

module.exports = EmailHelper;
