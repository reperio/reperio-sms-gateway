class Cache {
    constructor() {
        this._cache = {};
    }

    async buildCompositeKey(key1, key2) {
        return `${key1}-${key2}`;
    }

    async saveValueByKey(key, value) {
        this._cache[key] = value;
    }

    async getValueByKey(key) {
        return this._cache[key] || null;
    }

    async deleteKey(key) {
        delete this._cache[key];
    }

    async getNumberOfItemsInCache() {
        return Object.keys(this._cache).length;
    }
}

module.exports = Cache;
