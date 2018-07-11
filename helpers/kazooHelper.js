const _ = require('lodash');
const request = require('request-promise-native');

class KazooHelper {
    constructor(logger, config) {
        this.authToken = null;
        this.logger = logger;
        this.config = config;
    }

    // fetches an auth token from kazoo
    async getAuthToken() {
        const url = `${this.config.kazoo.url}/v2/user_auth`;
        const payload = {
            data: {
                credentials: this.config.kazoo.credentials,
                account_name: this.config.kazoo.accountName
            }
        };
        const options = {
            uri: url,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            json: payload
        };

        const result = await request(options);
        this.logger.debug(JSON.stringify(result));
        this.authToken = result.auth_token;
    }

    // get account details for phone number from kazoo
    async getAccountByPhoneNumber(phoneNumber) {
        const formattedNumber = phoneNumber.replace('+', '');
        const url = `${this.config.kazoo.url}/v2/phone_numbers/${formattedNumber}/identify`;
        const options = {
            uri: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.authToken
            }
        };

        const result = JSON.parse(await request(options));
        this.logger.debug(JSON.stringify(result));
        return result.data.account_id;
    }

    // get callflows for an account from kazoo
    async getCallFlowsByAccountId(accountId) {
        const url = `${this.config.kazoo.url}/v2/accounts/${accountId}/callflows`;
        const options = {
            uri: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.authToken
            }
        };

        const result = JSON.parse(await request(options));
        this.logger.debug(JSON.stringify(result));
        return result.data;
    }

    // fetches user by account and id from kazoo
    async getUserByAccountAndId(accountId, userId) {
        const url = `${this.config.kazoo.url}/v2/accounts/${accountId}/users/${userId}`;
        const options = {
            uri: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.authToken
            }
        };

        const result = JSON.parse(await request(options));
        this.logger.debug(JSON.stringify(result));
        return result.data;
    }

    // searches callflows for the given phone number
    async findCallflowForNumber(callflows, phoneNumber) {
        return _.find(callflows, callflow => {
            return _.find(callflow.numbers, number => {
                return number.includes(phoneNumber);
            });
        }) || null;
    }

    // finds user associated with phone number
    async getUserByPhoneNumber(phoneNumber) {
        await this.getAuthToken();

        // get the account on the phone number
        this.logger.info(`fetching account for phone number: ${phoneNumber}`);
        const accountId = await this.getAccountByPhoneNumber(phoneNumber);

        // fetch the callflows for that account
        this.logger.info(`fetching call flows for account: ${accountId}`);
        const callflows = await this.getCallFlowsByAccountId(accountId);
    
        // find the callflow with that phone number
        this.logger.info(`checking callflows for phone number: ${phoneNumber}`);
        const callflow = await this.findCallflowForNumber(callflows, phoneNumber);

        // verify that we found a callflow with the given phone number
        if (callflow === null) {
            this.logger.warn(`failed to find a callflow with phone number: ${phoneNumber} and account: ${accountId}`);
            this.logger.debug(`callflows: ${JSON.stringify(callflows)}`);
            return null;
        }

        // fetch user with account and owner ids
        this.logger.info(`fetching user with account id: ${accountId} and id: ${callflow.owner_id}`);
        const user = await this.getUserByAccountAndId(accountId, callflow.owner_id);

        return user;
    }
}

module.exports = KazooHelper;
