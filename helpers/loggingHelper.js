class LoggingHelper {
    constructor(logger, requestId) {
        this.logger = logger;
        this.requestId = requestId;
    }

    info(message) {
        this.logger.info(`${this.requestId} - ${this.translateMessage(message)}`);
    }

    error(message) {
        this.logger.error(`${this.requestId} - ${this.translateMessage(message)}`);
    }

    debug(message) {
        this.logger.debug(`${this.requestId} - ${this.translateMessage(message)}`);
    }

    warn(message) {
        this.logger.warn(`${this.requestId} - ${this.translateMessage(message)}`);
    }

    // allows for explicitly setting requestIds
    setRequestId(requestId) {
        this.requestId = requestId;
    }

    // stringifies objects for logging purposes
    translateMessage(message) {
        if (typeof message === 'object') {
            return JSON.stringify(message);
        }

        return message;
    }
}

module.exports = LoggingHelper;
