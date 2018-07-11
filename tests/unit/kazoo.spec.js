/* eslint-env  jest */

const config = require('../../config');
const Logger = require('../shared/logger');
const KazooHelper = require('../../helpers/kazooHelper');

describe('Kazoo unit tests', function () {
    beforeAll(() => {
        const logger = new Logger();
        this.kazooHelper = new KazooHelper(logger, config);
    });
});
