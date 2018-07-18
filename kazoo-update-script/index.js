/*
    Kazoo update script

    For setting custom properties on kazoo account and user records

    Usage: [environment_variables] node index.js -a <accountId> [-u <userId>] -r <accountText> -e <userText>
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
    let responseText = '';
    let contactEmail = '';

    // slice off the initial two command line arguments
    const args = process.argv.slice(2);
    // parse command line arguments
    console.log(`Script called with ${args.length} arguments`);
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-a' && i + 1 < args.length) {
            accountId = args[i + 1];
        }

        if (args[i] === '-u' && i + 1 < args.length) {
            userId = args[i + 1];
        }

        if (args[i] === '-r' && i + 1 < args.length) {
            responseText = args[i + 1];
        }

        if (args[i] === '-e' && i + 1 < args.length) {
            contactEmail = args[i + 1];
        }
    }

    // ensure that enough information was given that we can continue
    if (userId !== '' && accountId === '') {
        console.log('Account id is required when updating a user, exiting script.');
        return 1;
    } else if (accountId === '') {
        console.log('Account id not given, exiting script.');
        return 1;
    } else if (responseText === '' && contactEmail === '') {
        console.log('Response text or contact email not provided, exiting script.');
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
                sms_response_text: responseText,
                sms_contact_email: contactEmail
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
        const users = await kazooHelper.getUsersByAccountId(accountId);
        for (let i = 0; i < users.length; i++) {
            const user = await kazooHelper.getUserByAccountAndId(accountId, users[i].id);
            const userUpdates = {
                data: {}
            };

            if (user.sms_response_text) {
                console.log(`Skipping user: ${user.username} (${user.id}) because response text has already been defined (${user.sms_response_text})`);
                continue;
            }

            console.log(`Adding response text "${responseText}" to user: ${user.username} (${user.id})`);
            userUpdates.data.sms_response_text = responseText;

            try {
                await kazooHelper.updateUserByAccountAndId(accountId, user.id, userUpdates);
                console.log('User updated successfully');
            } catch (err) {
                console.error('Failed to update user record');
                console.error(err);
            }
        }
    } else {
        const user = await kazooHelper.getUserByAccountAndId(accountId, userId);
        console.log(`Processing user: ${user.username} (${user.id})`);
        console.log(`Adding response text: "${responseText}"`);
        const userUpdates = {
            data: {
                sms_response_text: responseText
            }
        };

        if (contactEmail !== '') {
            console.log(`Adding contact email: "${contactEmail}"`);
            userUpdates.data.sms_contact_email = contactEmail;
        }

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
