module.exports = {
    server: {
        jsonSecret: process.env.SMS_SERVER_JSON_SECRET || 'secret-key',
        url: process.env.SMS_SERVER_URL || 'https://sms-gateway-test.reper.io'
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
        errorEmailRecipient: process.env.SMS_ERROR_EMAIL_RECIPIENT || '',
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
        url: process.env.SMS_BANDWIDTH_URL || 'https://messaging.bandwidth.com/api',
        urlv1: process.env.SMS_BANDWIDTH_URL_V1 || 'https://api.catapult.inetwork.com',
        applicationId: process.env.SMS_BANDWIDTH_APPLICATION_ID || '',
        accountId: process.env.SMS_BANDWIDTH_ACCOUNT_ID || '',
        userId: process.env.SMS_BANDWIDTH_USER_ID || '',
        authUsername: process.env.SMS_BANDWIDTH_AUTH_USERNAME || '',
        authPassword: process.env.SMS_BANDWIDTH_AUTH_PASSWORD || ''
    },
    telnyx: {
        url: process.env.SMS_TELNYX_URL || 'https://sms.telnyx.com',
        profileSecret: process.env.SMS_TELNYX_PROFILE_SECRET || ''
    },
    phoneNumberRegex: process.env.SMS_PHONE_NUMBER_REGEX || '^\\+1\\d{10}',
    phoneNumberFormat: process.env.SMS_PHONE_NUMBER_FORMAT || '(NNN) NNN-NNNN', // used for formatting originating numbers in email notifications
    mediaStoragePath: process.env.SMS_MEDIA_STORAGE_PATH || '/tmp',
    localTimezone: process.env.SMS_LOCAL_TIMEZONE || 'America/New_York',
    imageFormats: process.env.SMS_IMAGE_FORMATS || ['gif', 'bmp', 'jpg', 'png', 'tiff'],
    automatedResponseTimeLimit: process.env.SMS_AUTOMATED_RESPONSE_TIME_LIMIT || 1000 * 60 * 15 // 15 minutes
};
