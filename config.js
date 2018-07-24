module.exports = {
    server: {
        jsonSecret: process.env.SMS_SERVER_JSON_SECRET || 'secret-key',
        url: process.env.SMS_SERVER_URL || ''
    },
    smtp: {
        host: process.env.SMS_SMTP_HOST || 'localhost',
        port: process.env.SMS_SMTP_PORT || 25,
        user: process.env.SMS_SMTP_USER || '',
        password: process.env.SMS_SMTP_USER_PASSWORD || '',
        senderAddress: process.env.SMS_SMTP_SENDER_ADDRESS || '',
        senderName: process.env.SMS_SMTP_SENDER_NAME || ''
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