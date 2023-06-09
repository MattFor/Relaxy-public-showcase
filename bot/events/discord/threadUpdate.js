'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.ThreadChannel} old_thread 
     * @param {Discord.ThreadChannel} new_thread 
     */
    async run(client, old_thread, new_thread) {  
        const guild = await client.module.database.Guild(new_thread.guild.id)

        if (guild.plugins.modlog.events.threadUpdate.enabled && !guild.plugins.modlog.lowspam) {
            let channel = await client.channels.fetch(guild.plugins.modlog.events.threadUpdate.channel).catch(() => {})

            if (!channel)
                return 

            let tag_flag = false
            if (old_thread.appliedTags.length !== new_thread.appliedTags.length)
                tag_flag = true

            if (!tag_flag)
                for (let i = 0; i < old_thread.appliedTags.length; i++)
                    if (old_thread.appliedTags[i].id !== new_thread.appliedTags[i].id) {
                        tag_flag = true
                        break
                    }

            const audit = (await new_thread.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null
            const thread_member = await new_thread.fetchOwner().catch(() => {})
            const member = thread_member ? await new_thread.guild.members.fetch(thread_member.id).catch(() => {}) : null
                
            let embed = new client.class.modlog({
                event: 'Thread updated',
                thumbnail: new_thread.guild.iconURL({ dynamic: true, size: 4096 }),
                fields: [
                    old_thread.autoArchiveDuration !== new_thread.autoArchiveDuration ? { name: 'Archive duration change:', value: `**\`${old_thread.autoArchiveDuration}\`** -> **\`${new_thread.autoArchiveDuration}\`**` } : null,
                    old_thread.name !== new_thread.name ? { name: 'Name change:', value: `**${old_thread.name}** -> **${new_thread.name}**` } : null,
                    tag_flag ? { name: 'Old tags:', value: `${old_thread.appliedTags.map(tag => { return new_thread.parent.availableTags.find(t => t.id === tag)?.name }).join(', ')??'None'}.` } : null,
                    tag_flag ? { name: 'New tags:', value: `${new_thread.appliedTags.map(tag => { return new_thread.parent.availableTags.find(t => t.id === tag)?.name }).join(', ')??'None'}.` } : null,
                    old_thread.rateLimitPerUser !== new_thread.rateLimitPerUser ? { name: 'Slowmode change:', value: `**\`${old_thread.rateLimitPerUser}\`** -> **\`${new_thread.rateLimitPerUser}\`**` } : null,
                    { name : 'Changed by:', value: audit?.targetType === 'Thread' && audit?.actionType === 'Update' && audit.executor ? `${audit.executor} - ${audit.executor.tag} - \`${audit.executor.id}\`` : 'The original poster.' }
                ].filter(i => i !== null),
                description: `Channel: **${new_thread} - \`${new_thread.id}\`**\nCreated by: ${member??'None.'}`
            })

            if (embed.fields.length > 0)
                return client.data.modlog_posts[new_thread.guild.id].push(['threadUpdate', embed])
        }
    }
}