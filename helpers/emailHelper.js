const nodemailer = require('nodemailer');

class EmailHelper {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;

        // create transporter object
        this.transporter = nodemailer.createTransport({
            host: this.config.smtp.host,
            port: this.config.smtp.port,
            secure: this.config.smtp.port === 465 ? true : false, // true for 465, false for other ports
            auth: {
                user: this.config.smtp.user,
                pass: this.config.smtp.password
            }
        });
    }

    async sendEmail(message, from, email) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: `${this.config.smtp.senderName} <${this.config.smtp.senderAddress}>`,
            to: email,
            subject: `New message from ${from}`,
            text: message,
            html: message
        };
    
        // send mail with defined transport object
        this.transporter.sendMail(mailOptions, (error) => {
            if (error) {
                this.logger.error(error);
            }
        });
    }
}

module.exports = EmailHelper;
