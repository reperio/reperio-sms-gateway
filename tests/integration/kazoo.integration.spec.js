/* eslint-env  jest */

const config = require('../../config');
const Logger = require('../shared/logger');
const KazooHelper = require('../../helpers/kazooHelper');

describe('Kazoo integration tests', function() {
    beforeAll(() => {
        const logger = new Logger(true);
        this.kazooHelper = new KazooHelper(logger, config);
    });

    it('Can get auth token', async () => {
        expect(this.kazooHelper.authToken).toBe(null);
        await this.kazooHelper.getAuthToken();
        expect(this.kazooHelper.authToken).not.toBe(null);
    });

    it('Can get account id with phone number', async () => {
        const result = await this.kazooHelper.getAccountIdByPhoneNumber('+5138184651');
        expect(result).toBe('d38abe802090d3216dff4993fd5ee186');
    });

    it('Fetches correct account from kazoo', async () => {
        const result = await this.kazooHelper.getAccountByPhoneNumber('fakeId', '+15138184658');
        expect(result.id).toBe('d38abe802090d3216dff4993fd5ee186');
    });

    it('Fetches correct user from kazoo', async () => {
        const result = await this.kazooHelper.getUserByPhoneNumber('fakeId', '+15138184658');
        expect(result.user.id).toBe('9449e0a2eae911458e10ebf5bdca37c7');
    });

    it('getUserByPhoneNumber returns null if owner_id doesn\'t exist in callflow', async () => {
        const result = await this.kazooHelper.getUserByPhoneNumber('fakeId', '+15138184650');
        expect(typeof result.user).toBe('undefined');
    });
});
