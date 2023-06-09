'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle message deletion.
     * @param {Relaxy} client 
     * @param {Discord.Collection<Discord.Message>} messages
     * @param {Discord.GuildTextBasedChannel} channel
     */
    async run(client, messages, channel) {
        const guild = await client.module.database.Guild(channel.guild.id)

        if (guild.plugins.modlog.events.messageDeleteBulk.enabled) {
            let Channel = await client.channels.fetch(guild.plugins.modlog.events.messageDeleteBulk.channel).catch(() => {})

            if (!Channel)
                return

            let audit = (await channel.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null

            return client.data.modlog_posts[channel.guild.id].push(['messageDeleteBulk',  new client.class.modlog({
                    color: 'bad',
                    event: 'Mass message deletion',
                    description: `Deleted **\`${messages.size}\`** messages!`,
                    fields: [
                        { name: 'Channel:', value: `${channel}`, inline: true },
                        audit.targetType === 'Message' && audit.actionType === 'Delete' ? { name: 'Deleted by:', value: `${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\``} : null
                    ].filter(i => i !== null)
                })
            ])
        }
    }   
}