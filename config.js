module.exports = {
    server: {
        jsonSecret: process.env.SMS_SERVER_JSON_SECRET || 'secret-key'
    },
    kazoo: {
        url: process.env.SMS_KAZOO_URL || '',
        credentials: process.env.SMS_KAZOO_CREDENTIALS || '',
        accountName: process.env.SMS_KAZOO_ACCOUNT || ''
    }
};
