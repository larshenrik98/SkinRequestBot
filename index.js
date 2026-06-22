require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, Partials } = require('discord.js');
const config = require('./src/config');
const skinrequest = require('./src/skinrequest');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
});

client.once('ready', async () => {
    console.log(`[SkinRequestBot] Logged in as ${client.user.tag}`);

    await skinrequest.init({ client });

    const rest = new REST({ version: '10' }).setToken(config.discord.token);
    await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: skinrequest.commands.map(c => c.toJSON()) }
    );

    console.log('[SkinRequestBot] Slash commands registered.');
});

client.on('interactionCreate', async interaction => {
    try {
        await skinrequest.handleInteraction(interaction);
    } catch (e) {
        console.error('[SkinRequestBot] Interaction error:', e.message);
    }
});

client.login(config.discord.token);
