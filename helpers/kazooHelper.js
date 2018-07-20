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
        this.authToken = result.auth_token;
    }

    // get account id for phone number from kazoo
    async getAccountIdByPhoneNumber(phoneNumber) {
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
        return result.data.account_id;
    }

    // get account details by account id from kazoo
    async getAccountById(accountId) {
        const url = `${this.config.kazoo.url}/v2/accounts/${accountId}`;
        const options = {
            uri: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.authToken
            }
        };

        const result = JSON.parse(await request(options));
        return result.data;
    }

    // updates account record with provided data
    async updateAccountById(accountId, body) {
        const url = `${this.config.kazoo.url}/v2/accounts/${accountId}`;
        const options = {
            uri: url,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.authToken
            },
            json: body
        };

        const result = await request(options);
        return result.data;
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
        return result.data;
    }

    // fetches all users by account id from kazoo
    async getUsersByAccountId(accountId) {
        const url = `${this.config.kazoo.url}/v2/accounts/${accountId}/users`;
        const options = {
            uri: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.authToken
            }
        };

        const result = JSON.parse(await request(options));
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
        return result.data;
    }

    // updates user record with provided data
    async updateUserByAccountAndId(accountId, userId, body) {
        const url = `${this.config.kazoo.url}/v2/accounts/${accountId}/users/${userId}`;
        const options = {
            uri: url,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.authToken
            },
            json: body
        };

        const result = await request(options);
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
    async getUserByPhoneNumber(requestId, phoneNumber) {
        try {
            await this.getAuthToken();

            // get the account id on the phone number
            this.logger.info(`${requestId} - fetching account id for phone number: ${phoneNumber}`);
            const accountId = await this.getAccountIdByPhoneNumber(phoneNumber);

            // fetch the callflows for that account
            this.logger.info(`${requestId} - fetching call flows for account: ${accountId}`);
            const callflows = await this.getCallFlowsByAccountId(accountId);
        
            // find the callflow with that phone number
            this.logger.info(`${requestId} - checking callflows for phone number: ${phoneNumber}`);
            const callflow = await this.findCallflowForNumber(callflows, phoneNumber);

            // verify that we found a callflow with the given phone number
            if (callflow === null || callflow.owner_id === null) {
                this.logger.warn(`${requestId} - no callflows contained phone number: ${phoneNumber} or an owner_id in account: ${accountId}`);
                this.logger.debug(`${requestId} - callflows: ${JSON.stringify(callflows)}`);
                return null;
            }

            // fetch user with account and owner ids
            this.logger.info(`${requestId} - fetching user with account id: ${accountId} and id: ${callflow.owner_id}`);
            const user = await this.getUserByAccountAndId(accountId, callflow.owner_id);

            return user;
        } catch (err) {
            this.logger.error(`${requestId} - failed to find a user with the phone number: ${phoneNumber}`);
            this.logger.error(`${requestId} - ${err}`);
            return null;
        }
    }
}

module.exports = KazooHelper;
