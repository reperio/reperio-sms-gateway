class UtilityHelper {
    constructor (logger, config) {
        this.logger = logger;
        this.config = config;
    }

    async shouldReplyToNumber(number) {
        return number.match(this.config.phoneNumberRegex) !== null;
    }
}

module.exports = UtilityHelper;
