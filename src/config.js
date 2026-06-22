require('dotenv').config();

function required(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env var: ${name}`);
    return value;
}

function optional(name, fallback = '') {
    return process.env[name] || fallback;
}

const config = {
    discord: {
        token: required('DISCORD_BOT_TOKEN'),
        clientId: required('DISCORD_CLIENT_ID'),
        guildId: required('DISCORD_GUILD_ID'),
        skinChannelId: required('SKIN_REQUEST_CHANNEL_ID'),
        staffRoleId: required('SKIN_STAFF_ROLE_ID'),
    },
    rcon: {
        provider: optional('RCON_PROVIDER', 'pinehost').toLowerCase(),
        pinehost: {
            serverId: optional('PINEHOST_SERVER_ID'),
            apiToken: optional('PINEHOST_API_TOKEN'),
        },
        webhook: {
            url: optional('RCON_WEBHOOK_URL'),
            auth: optional('RCON_WEBHOOK_AUTH'),
        },
    },
};

if (config.rcon.provider === 'pinehost') {
    if (!config.rcon.pinehost.serverId || !config.rcon.pinehost.apiToken) {
        throw new Error('PINEHOST_SERVER_ID and PINEHOST_API_TOKEN are required when RCON_PROVIDER=pinehost');
    }
}

if (config.rcon.provider === 'webhook' && !config.rcon.webhook.url) {
    throw new Error('RCON_WEBHOOK_URL is required when RCON_PROVIDER=webhook');
}

module.exports = config;
