'use strict'

import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle channel creation.
     * @param {Relaxy} client 
     */
    async run(client, channel) {
        if (!channel || !channel.guild || channel.type === client.imports.discord.ChannelType.DM) 
            return

        const guild = await client.module.database.Guild(channel.guild.id)

        if (guild.plugins.modlog.events.channelCreate.enabled) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.channelCreate.channel)) return client.save(guild.id, { to_change: 'plugins.modlog.events.channelCreate.enabled', value: false })

            let audit = (await channel.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null

            return client.data.modlog_posts[channel.guild.id].push(['channelCreate', new client.class.modlog({
                color: 'good',
                event: 'Channel created',
                thumbnail: channel.guild.iconURL({ dynamic: true, size: 4096 }),
                fields: [
                    { name: 'Channel:', value: `**${channel}** - **${channel.name}**` },
                    { name: 'ID:', value: `**${channel.id}**` },
                    { name: 'Type:', value: `**${channel.type}**` },
                    { name: 'Category:', value: `${channel.parent ? channel.parent : 'None'}` },
                    { name: 'NSFW:', value: `**${channel.nsfw ? 'YES' : 'NO'}**` },
                    audit?.targetType === 'Channel' && audit?.actionType === 'Create' && audit.executor ? { name : 'Created by:', value: `${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\``} : null
                ].filter(i => i !== null)
            })])
        }
    }
}