const moment = require('moment');

class Cache {
    constructor(config) {
        this._cache = {};
        this.config = config;

        setInterval(() => this.cleanKeys(), this.config.automatedResponseTimeLimit);
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

    cleanKeys() {
        const keys = Object.keys(this._cache);
        keys.forEach(key => {
            const duration = moment.duration(moment.utc().diff(this._cache[key]));
            if (duration.asMilliseconds() > this.config.automatedResponseTimeLimit) {
                this.deleteKey(key);
            }
        });
    }
}

module.exports = Cache;
