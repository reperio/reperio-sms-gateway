/* eslint-env  jest */

const config = require('../../config');
const Logger = require('../shared/logger');
const KazooHelper = require('../../helpers/kazooHelper');

describe('Kazoo integration tests', function() {
    beforeAll(() => {
        const logger = new Logger();
        this.kazooHelper = new KazooHelper(logger, config);
    });

    it('Can get auth token', async () => {
        expect(this.kazooHelper.authToken).toBe(null);
        await this.kazooHelper.getAuthToken();
        expect(this.kazooHelper.authToken).not.toBe(null);
    });

    it('Can get account id with phone number', async () => {
        const result = await this.kazooHelper.getAccountByPhoneNumber('5138184651');
        expect(result).toBe('d38abe802090d3216dff4993fd5ee186');
    });

    it('Fetches correct user from kazoo', async () => {
        const result = await this.kazooHelper.getUserByPhoneNumber('+15138184652');
        expect(result.id).toBe('7ca11798c555ffb329b0e16827a733e2');
    });
});
