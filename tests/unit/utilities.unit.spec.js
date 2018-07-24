/* eslint-env  jest */

const config = require('../../config');
const Logger = require('../shared/logger');
const UtilityHelper = require('../../helpers/utilityHelper');

describe('Utility helper tests', function () {
    beforeAll(() => {
        const logger = new Logger();
        this.utilityHelper = new UtilityHelper(logger, config);
    });

    it('shouldReplyToNumber() should match +15136336533', async () => {
        const result = await this.utilityHelper.shouldReplyToNumber('+15136336533');
        expect(result).toBe(true);
    });

    it('shouldReplyToNumber() should not match 55544', async () => {
        const result = await this.utilityHelper.shouldReplyToNumber('55544');
        expect(result).toBe(false);
    });

    it('shouldReplyToNumber() should not match 011444832719', async () => {
        const result = await this.utilityHelper.shouldReplyToNumber('011444832719');
        expect(result).toBe(false);
    });
});
