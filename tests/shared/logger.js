
class MockLogger {
    constructor (loggingEnabled) {
        this.enabled = loggingEnabled || false;
    }

    info(message) {
        if (this.enabled) {
            console.log(message);
        }
    }

    error(message) {
        if (this.enabled) {
            console.log(message);
        }
    }

    warn(message) {
        if (this.enabled) {
            console.log(message);
        }
    }

    debug(message) {
        if (this.enabled) {
            console.log(message);
        }
    }
}

module.exports = MockLogger;
