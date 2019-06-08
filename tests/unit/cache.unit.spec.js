/* eslint-env  jest */

const Cache = require('../../cache');

describe('Cache unit tests', function () {
    let cache = null;
    
    beforeEach(() => {
        cache = new Cache();
    });

    it('can build composite key', async () => {
        expect(await cache.buildCompositeKey('test1', 'test2')).toEqual('test1-test2');
    });

    it('should have 0 items in new cache', async () => {
        expect(await cache.getNumberOfItemsInCache()).toEqual(0);
    });

    it('can add value to cache by key', async () => {
        await cache.saveValueByKey('key', 'value');
        expect(await cache.getNumberOfItemsInCache()).toEqual(1);
    });

    it('can fetch value from cache by key', async () => {
        cache._cache.key = 'value';
        expect(await cache.getValueByKey('key')).toEqual('value');
    });

    it('returns null if key does not exist in cache', async () => {
        expect(await cache.getValueByKey('key')).toBeNull();
    });

    it('can delete value from cache', async () => {
        cache._cache.key = 'value';
        expect(await cache.getNumberOfItemsInCache()).toEqual(1);
        await cache.deleteKey('key');
        expect(await cache.getNumberOfItemsInCache()).toEqual(0);
    });
});
