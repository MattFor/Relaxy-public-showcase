'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.ThreadChannel} thread 
     * @param {Boolean} newlyCreated 
     */
    async run(client, thread, newlyCreated) {  
        if (newlyCreated) 
            return

        const guild = await client.module.database.Guild(thread.guild.id)

        if (guild.plugins.modlog.events.threadDelete.enabled) {
            let channel = await client.channels.fetch(guild.plugins.modlog.events.threadDelete.channel).catch(() => {})

            if (!channel)
                return 

            let member = (await thread.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()?.executor??null

            if (guild.forum.channels.includes(thread?.parentId) && guild.plugins.modlog?.events?.other?.enabled)
                return client.data.modlog_posts[thread.guild.id].push(['other', new client.class.modlog({
                    color: 'bad',
                    event: 'Forum post HARD denied',
                    description: `${thread} (${thread.name})\nHas been denied by ${!!member ? `${member} ${member?.tag}` : 'Unavailable.'}`,
                    thumbnail: thread.guild.iconURL({ dynamic: true, size: 4096 })
                })])

            return client.data.modlog_posts[thread.guild.id].push(['threadDelete', new client.class.modlog({
                color: 'bad',
                event: 'Thread deleted',
                thumbnail: member?.displayAvatarURL({ dynamic: true, size: 4096 })??thread.guild.iconURL({ dynamic: true, size: 4096 }),
                description: `Channel: **${thread.name} - \`${thread.id}\`**\nDeleted by: ${member??'None.'} ${member?.tag??''}`
            })])
        }
    }
}