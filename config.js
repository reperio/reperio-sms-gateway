module.exports = {
    server: {
        jsonSecret: process.env.SMS_SERVER_JSON_SECRET || 'secret-key',
        url: process.env.SMS_SERVER_URL || ''
    },
    kazoo: {
        url: process.env.SMS_KAZOO_URL || '',
        credentials: process.env.SMS_KAZOO_CREDENTIALS || '',
        accountName: process.env.SMS_KAZOO_ACCOUNT || ''
    },
    sendgrid: {
        from: process.env.SMS_SENDGRID_FROM_ADDRESS || '',
        apiKey: process.env.SMS_SENDGRID_API_KEY || ''
    },
    bandwidth: {
        url: process.env.SMS_BANDWIDTH_URL || 'https://api.catapult.inetwork.com',
        userId: process.env.SMS_BANDWIDTH_USER_ID || '',
        authUsername: process.env.SMS_BANDWIDTH_AUTH_USERNAME || '',
        authPassword: process.env.SMS_BANDWIDTH_AUTH_PASSWORD || ''
    }
};
