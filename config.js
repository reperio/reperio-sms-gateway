module.exports = {
    server: {
        jsonSecret: process.env.SMS_SERVER_JSON_SECRET || 'secret-key',
        url: process.env.SMS_SERVER_URL || ''
    },
    cnam: {
        enabled: process.env.SMS_CNAM_ENABLED === 'true' ? true : false,
        telnyxApiToken: process.env.SMS_TELNYX_API_TOKEN || '',
        telnyxUrl: process.env.SMS_TELNYX_CNAM_URL || 'https://data.telnyx.com'
    },
    email: {
        smtpHost: process.env.SMS_SMTP_HOST || 'localhost',
        smtpPort: process.env.SMS_SMTP_PORT || 25,
        smtpUser: process.env.SMS_SMTP_USER || '',
        smtpPassword: process.env.SMS_SMTP_USER_PASSWORD || '',
        sender: process.env.SMS_EMAIL_SENDER || 'do-not-reply@reper.io',
        sendGridApiKey: process.env.SMS_SENDGRID_API_KEY || '',
        method: process.env.SMS_EMAIL_METHOD || 'smtp', // must be either 'smtp' or 'sendgrid',
        rejectUnauthorizedTLS: process.env.SMS_SMTP_REJECT_UNAUTHORIZED_TLS || true
    },
    kazoo: {
        url: process.env.SMS_KAZOO_URL || '',
        credentials: process.env.SMS_KAZOO_CREDENTIALS || '',
        accountName: process.env.SMS_KAZOO_ACCOUNT || ''
    },
    bandwidth: {
        url: process.env.SMS_BANDWIDTH_URL || 'https://api.catapult.inetwork.com',
        userId: process.env.SMS_BANDWIDTH_USER_ID || '',
        authUsername: process.env.SMS_BANDWIDTH_AUTH_USERNAME || '',
        authPassword: process.env.SMS_BANDWIDTH_AUTH_PASSWORD || ''
    },
    telnyx: {
        url: process.env.SMS_TELNYX_URL || 'https://sms.telnyx.com',
        profileSecret: process.env.SMS_TELNYX_PROFILE_SECRET || ''
    },
    phoneNumberRegex: process.env.SMS_PHONE_NUMBER_REGEX || '^\\+1\\d{10}'
};
