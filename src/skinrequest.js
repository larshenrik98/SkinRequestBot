const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('./config');
const { sendServerCommand } = require('./rcon');

const STICKY_TEXT = [
    '# 💡 How to request a skin',
    '### 1. Find a skin: https://steamcommunity.com/app/252490/workshop/',
    '### 2. Use `/skinrequest` and paste the Workshop link or ID',
    '',
    '*Example:* `/skinrequest https://steamcommunity.com/sharedfiles/filedetails/?id=12345678`',
    '',
    '_Automated sticky — staff approve requests to add skins in-game (SkinBox)._',
].join('\n');

let stickyTimeout = null;
let stickyMessageId = null;

function parseWorkshopId(input) {
    const urlMatch = input.match(/id=(\d+)/);
    if (urlMatch) return urlMatch[1];
    return /^\d+$/.test(input.trim()) ? input.trim() : null;
}

async function isCollection(workshopId) {
    const res = await axios.post(
        'https://api.steampowered.com/ISteamRemoteStorage/GetCollectionDetails/v1/',
        `collectioncount=1&publishedfileids[0]=${workshopId}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return res.data?.response?.collectiondetails?.[0]?.result === 1;
}

async function fetchWorkshopItem(workshopId) {
    const res = await axios.post(
        'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
        `itemcount=1&publishedfileids[0]=${workshopId}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const item = res.data?.response?.publishedfiledetails?.[0];
    return item?.result === 1 ? item : null;
}

function skinBoxCommand(workshopId, collection) {
    return collection ? `skinbox.addcollection ${workshopId}` : `skinbox.addskin ${workshopId}`;
}

function approveCustomId(workshopId, collection) {
    return collection ? `approve_collection_${workshopId}` : `approve_skin_${workshopId}`;
}

function isStaff(member) {
    return member.roles.cache.has(config.discord.staffRoleId);
}

async function refreshSticky(channel, client) {
    if (stickyTimeout) clearTimeout(stickyTimeout);

    stickyTimeout = setTimeout(async () => {
        if (stickyMessageId) {
            try {
                const old = await channel.messages.fetch(stickyMessageId);
                if (old) await old.delete();
            } catch (_) {}
        }

        try {
            const fetched = await channel.messages.fetch({ limit: 15 });
            for (const [, msg] of fetched) {
                if (msg.author.id === client.user.id && msg.content === STICKY_TEXT) {
                    await msg.delete().catch(() => {});
                }
            }
        } catch (_) {}

        try {
            const sticky = await channel.send(STICKY_TEXT);
            stickyMessageId = sticky.id;
        } catch (e) {
            console.error('[SkinRequest] Failed to post sticky:', e.message);
        }
    }, 1000);
}

const commands = [
    new SlashCommandBuilder()
        .setName('skinrequest')
        .setDescription('Suggest a Steam Workshop skin or collection for the server')
        .addStringOption(opt =>
            opt.setName('skin')
                .setDescription('Workshop link or numeric ID')
                .setRequired(true)
        ),
];

async function init({ client }) {
    console.log('[SkinRequest] Loaded (Discord → SkinBox in-game).');

    client.on('messageCreate', async message => {
        if (message.channel.id !== config.discord.skinChannelId) return;

        if (!message.author.bot) {
            await message.delete().catch(() => {});
        }

        if (message.author.id === client.user.id && message.content === STICKY_TEXT) {
            return;
        }

        await refreshSticky(message.channel, client);
    });
}

async function handleInteraction(interaction) {
    if (interaction.isChatInputCommand() && interaction.commandName === 'skinrequest') {
        if (interaction.channelId !== config.discord.skinChannelId) {
            return interaction.reply({
                content: `❌ Use this command in <#${config.discord.skinChannelId}>.`,
                ephemeral: true,
            });
        }

        const workshopId = parseWorkshopId(interaction.options.getString('skin', true));
        if (!workshopId) {
            return interaction.reply({
                content: '❌ Provide a valid Steam Workshop link or numeric ID.',
                ephemeral: true,
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const collection = await isCollection(workshopId);
            const item = await fetchWorkshopItem(workshopId);
            if (!item) {
                return interaction.editReply('❌ Could not find that skin/collection on Steam Workshop.');
            }

            const commandStr = skinBoxCommand(workshopId, collection);
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(item.title || 'Workshop item')
                .setURL(`https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId}`)
                .setAuthor({
                    name: `Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setDescription(`In-game command:\n\`${commandStr}\``)
                .setFooter({ text: `Workshop ID: ${workshopId}` })
                .setTimestamp();

            if (item.preview_url) embed.setImage(item.preview_url);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(approveCustomId(workshopId, collection))
                    .setLabel(collection ? 'Approve collection' : 'Approve skin')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            );

            const posted = await interaction.channel.send({ embeds: [embed], components: [row] });
            await posted.react('👍').catch(() => {});
            await posted.react('👎').catch(() => {});

            return interaction.editReply('✅ Request posted. Staff can approve to add it in SkinBox.');
        } catch (e) {
            console.error('[SkinRequest] Steam lookup failed:', e.message);
            return interaction.editReply('❌ Could not contact Steam Workshop.');
        }
    }

    if (
        interaction.isButton() &&
        (interaction.customId.startsWith('approve_skin_') || interaction.customId.startsWith('approve_collection_'))
    ) {
        if (!isStaff(interaction.member)) {
            return interaction.reply({ content: '❌ Only staff can approve skins.', ephemeral: true });
        }

        const collection = interaction.customId.startsWith('approve_collection_');
        const workshopId = interaction.customId.replace(collection ? 'approve_collection_' : 'approve_skin_', '');
        const commandStr = skinBoxCommand(workshopId, collection);

        await interaction.deferUpdate();

        try {
            await sendServerCommand(commandStr);

            const components = interaction.message.components.map(row =>
                new ActionRowBuilder().addComponents(
                    row.components.map(btn => {
                        if (btn.customId !== interaction.customId) return ButtonBuilder.from(btn);
                        return ButtonBuilder.from(btn)
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel(`Approved by ${interaction.user.username}`);
                    })
                )
            );

            await interaction.editReply({ components });
        } catch (e) {
            console.error('[SkinRequest] Server command failed:', e.message);
            await interaction.followUp({
                content: '❌ Could not send command to the Rust server. Check RCON env vars and that SkinBox is loaded.',
                ephemeral: true,
            });
        }
    }
}

module.exports = {
    commands,
    init,
    handleInteraction,
};
