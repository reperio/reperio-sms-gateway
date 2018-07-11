/* eslint-env  jest */

const config = require('../../config');
const Logger = require('../shared/logger');
const KazooHelper = require('../../helpers/kazooHelper');

describe('Kazoo unit tests', function () {
    const callflows = [
        {
            id: 'fd773a77a7b3a0c71b82e14d937495b5',
            name: 'Main Callflow',
            type: 'mainUserCallflow',
            numbers: [
                '4652',
                '+12345678901'
            ],
            patterns: [],
            featurecode: false,
            owner_id: '7ca11798c555ffb329b0e16827a733e2'
        },
        {
            id: 'fa3ff1497febd6bdbc9fe5d943ead807',
            numbers: [],
            patterns: [
                '^\\*3([0-9]*)$'
            ],
            featurecode: {
                name: 'park_and_retrieve',
                number: '3'
            }
        },
        {
            id: 'f1291d8ef4762bdd1bbe2f4cd906703e',
            numbers: [
                '1234'
            ],
            patterns: [],
            featurecode: false
        }
    ];

    beforeAll(() => {
        const logger = new Logger();
        this.kazooHelper = new KazooHelper(logger, config);
    });

    it('findCallflowForNumber() returns the correct callflow for existing phone number', async () => {
        const result = await this.kazooHelper.findCallflowForNumber(callflows, '+12345678901');
        expect(result.owner_id).toBe('7ca11798c555ffb329b0e16827a733e2');
    });

    it('findCallflowForNumber() returns null for non-existing phone number', async () => {
        const result = await this.kazooHelper.findCallflowForNumber(callflows, '+00000000000');
        expect(result).toBe(null);
    });
});
