/*
    Kazoo update script

    For setting custom properties on kazoo account and user records

    Usage: [environment_variables] node index.js -a <accountId> [-u <userId>] -r <accountText> -e <accountEmail> -t <userText>
*/

const config = require('../config');
const KazooHelper = require('../helpers/kazooHelper');

const logger = {
    info: function(message) {
        console.log('info: -', message);
    },
    error: function(message) {
        console.log('error: -', message);
    },
    warn: function(message) {
        console.log('warn: -', message);
    },
    debug: function(message) {
        console.log('debug: -', message);
    }
};

const run = async function() {
    let accountId = '';
    let userId = '';
    let accountText = '';
    let userText = '';
    let accountEmail = '';

    // parse command line arguments
    const args = process.argv.slice(2);
    console.log(`Script called with ${args.length} arguments`);
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-a' && i + 1 < args.length) {
            accountId = args[i + 1];
        }

        if (args[i] === '-u' && i + 1 < args.length) {
            userId = args[i + 1];
        }

        if (args[i] === '-r' && i + 1 < args.length) {
            accountText = args[i + 1];
        }

        if (args[i] === '-e' && i + 1 < args.length) {
            accountEmail = args[i + 1];
        }

        if (args[i] === '-t' && i + 1 < args.length) {
            userText = args[i + 1];
        }
    }

    // ensure that enough information was given that we can continue
    if (accountId === '') {
        console.log('Account id is required');
        return 1;
    } else if (userId === '' && (accountText === '' || accountEmail === '')) {
        console.log('Account text or email not provided, exiting script.');
        return 1;
    } else if (userId !== '' && userText === '') {
        console.log('User text required when specifying a user id');
        return 1;
    }

    // get auth token from kazoo
    const kazooHelper = new KazooHelper(logger, config);
    await kazooHelper.getAuthToken();
    
    if (userId === '') {
        const account = await kazooHelper.getAccountById(accountId);
        console.log(`Processing account: ${account.name}`);
        const accountUpdates = {
            data: {
                sms_response_text: accountText,
                sms_contact_email: accountEmail
            }
        };

        try {
            await kazooHelper.updateAccountById(accountId, accountUpdates);
            console.log('Account updated successfully');
        } catch (err) {
            console.error('Failed to update account record');
            console.error(err);
            return 1;
        }

        if (userText) {
            const users = await kazooHelper.getUsersByAccountId(accountId);
            for (let i = 0; i < users.length; i++) {
                const user = await kazooHelper.getUserByAccountAndId(accountId, users[i].id);
                
                if (user.sms_response_text) {
                    console.log(`Skipping user: ${user.username} (${user.id}) because response text has already been defined: ${user.sms_response_text}`);
                    continue;
                }

                console.log(`Adding response text "${userText}" to user: ${user.username} (${user.id})`);
                const userUpdates = {
                    data: {
                        sms_response_text: userText
                    }
                };

                try {
                    await kazooHelper.updateUserByAccountAndId(accountId, user.id, userUpdates);
                    console.log('User updated successfully');
                } catch (err) {
                    console.error('Failed to update user record');
                    console.error(err);
                }
            }
        }
    } else {
        const user = await kazooHelper.getUserByAccountAndId(accountId, userId);
        console.log(`Processing user: ${user.username} (${user.id})`);
        console.log(`Adding response text: "${userText}"`);
        const userUpdates = {
            data: {
                sms_response_text: userText
            }
        };

        try {
            await kazooHelper.updateUserByAccountAndId(accountId, userId, userUpdates);
            console.log('User updated successfully');
        } catch (err) {
            console.error('Failed to update user record');
            console.error(err);
        }
    }

    return 0;
};

run();
