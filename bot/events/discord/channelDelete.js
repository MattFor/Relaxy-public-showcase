'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle channel deletion.
     * @param {Relaxy} client 
     * @param {Discord.Channel} channel 
     * @returns {Discord.Message}
     */
    async run(client, channel) {
        const guild = await client.module.database.Guild(channel.guild.id)

        if (channel.type === client.imports.discord.ChannelType.DM || channel.type === client.imports.discord.ChannelType.GroupDM) 
            return

        if (guild.plugins.welcome_message.wmessage_channel == channel.id) 
            client.save(channel.guild.id, {
                to_change: 'plugins.welcome_message',
                value: {
                    enabled: false,
                    wmessage: '',
                    wmessage_id: '',
                    wmessage_channel: '',
                    status_message_id: '',
                    roles: false,
                    role_emojis: [],
                    role_roles: []
                }
            })

        if (guild.plugins.heart_board.channel_id == channel.id) client.save(channel.guild.id, {
            to_change: 'plugins.heart_board',
            value: {
                enabled: false,
                channel_id: '',
                type: 3,
                postIDs: []
            }
        })

        if ((await client.utils.modlogChannels(guild)).includes(channel.id) && guild.plugins.modlog.events.guildMemberAdd.channel !== channel.id) client.save(channel.guild.id, {
            to_change: 'plugins.modlog',
            value: {
                enabled: false,
                events: client.data.modlogEvents
            }
        })

        guild.privates = guild.privates.filter((id) => id !== channel.id)
        client.save(guild.id, { to_change: 'privates', value: guild.privates })
        
        guild.plugins.restricted_channels = guild.plugins.restricted_channels.filter((id) => id !== channel.id)
        client.save(guild.id, { to_change: 'plugins.restricted_channels', value: guild.plugins.restricted_channels })

        try {
            let forums = guild.forum.channels
            if (forums.includes(channel.id)) {
                await client.module.database.deleteForumChannel(channel.id, guild.id)
                forums.splice(forums.indexOf(channel.id), 1)
                client.save(guild.id, { to_change: 'forum.channels', value: forums })

                if (forums.length === 0) {
                    client.save(guild.id, { to_change: 'forum.enabled', value: false })
                }
            }
        } catch {
            client.save(guild.id, { to_change: 'forum', value: {
                enabled: false,
                channels: []
            }})
        }

        if (guild.plugins.modlog.events.channelDelete.enabled) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.channelDelete.channel)) return client.save(guild.id, { to_change: 'plugins.modlog.events.channelDelete.enabled', value: false })

            const audit = (await channel.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null

            return client.data.modlog_posts[channel.guild.id].push(['channelDelete', new client.class.modlog({
                color: 'bad',
                event: 'Channel deleted',
                thumbnail: channel.guild.iconURL({ dynamic: true, size: 4096 }),
                fields: [
                    { name: 'Channel:', value: `**${channel}** - **${channel.name}**` },
                    { name: 'ID:', value: `**${channel.id}**` },
                    { name: 'Type:', value: `**${channel.type}**` },
                    { name: 'Category:', value: `${channel.parent ? channel.parent : 'None'}` },
                    { name: 'NSFW:', value: `**${channel.nsfw ? 'YES' : 'NO'}**` },
                    audit?.targetType === 'Channel' && audit?.actionType === 'Delete' && audit.executor ? { name : 'Deleted by:', value: `${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\``} : null
                ].filter(i => i !== null)
            })])
        }
    }
}