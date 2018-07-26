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

        this.logger.debug(options);
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

        this.logger.debug(options);
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

        this.logger.debug(options);
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
        
        this.logger.debug(options);
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

        this.logger.debug(options);
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

        this.logger.debug(options);
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

        this.logger.debug(options);
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

        this.logger.debug(options);
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

    // finds account associated with phone number
    async getAccountByPhoneNumber(phoneNumber) {
        try {
            await this.getAuthToken();

            // get the account id on the phone number
            this.logger.info(`fetching account id for phone number: ${phoneNumber}`);
            const accountId = await this.getAccountIdByPhoneNumber(phoneNumber);

            // get the account using the account id
            this.logger.info(`fetching account with id: ${accountId}`);
            const account = await this.getAccountById(accountId);

            return account;
        } catch (err) {
            this.logger.error(`failed to find an account for the phone number: ${phoneNumber}`);
            this.logger.error(err);
            throw err;
        }
    }

    // finds user associated with phone number
    async getUserByPhoneNumber(phoneNumber) {
        try {
            // get the account record associated with the phone number
            const account = await this.getAccountByPhoneNumber(phoneNumber);

            // fetch the callflows for that account
            this.logger.info(`fetching call flows for account: ${account.id}`);
            const callflows = await this.getCallFlowsByAccountId(account.id);
        
            // find the callflow with that phone number
            this.logger.info(`checking callflows for phone number: ${phoneNumber}`);
            const callflow = await this.findCallflowForNumber(callflows, phoneNumber);

            // verify that we found a callflow with the given phone number
            if (callflow === null || callflow.owner_id === null || typeof callflow.owner_id === 'undefined') {
                this.logger.warn(`no callflows contained phone number: ${phoneNumber} or an owner_id in account: ${account.id}`);
                this.logger.debug(`callflows: ${JSON.stringify(callflows)}`);
                return {
                    account: account,
                    user: {}
                };
            }

            // fetch user with account and owner ids
            this.logger.info(`fetching user with account id: ${account.id} and id: ${callflow.owner_id}`);
            const user = await this.getUserByAccountAndId(account.id, callflow.owner_id);

            return {
                account: account,
                user: user
            };
        } catch (err) {
            this.logger.error(`failed to find a user with the phone number: ${phoneNumber}`);
            this.logger.error(err);
            return null;
        }
    }
}

module.exports = KazooHelper;
