const axios = require('axios');
const config = require('./config');

async function sendServerCommand(command) {
    if (config.rcon.provider === 'webhook') {
        const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
        if (config.rcon.webhook.auth) {
            headers.Authorization = config.rcon.webhook.auth.startsWith('Bearer ')
                ? config.rcon.webhook.auth
                : `Bearer ${config.rcon.webhook.auth}`;
        }

        await axios.post(config.rcon.webhook.url, { command }, { headers });
        return;
    }

    const { serverId, apiToken } = config.rcon.pinehost;
    await axios.post(
        `https://panel.pinehosting.com/api/client/servers/${serverId}/command`,
        { command },
        {
            headers: {
                Authorization: `Bearer ${apiToken}`,
                Accept: 'application/json',
            },
        }
    );
}

module.exports = { sendServerCommand };
