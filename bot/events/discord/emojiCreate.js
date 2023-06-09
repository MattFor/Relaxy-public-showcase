'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.Emoji} emoji 
     */
    async run(client, emoji) {
        client.config.emojiCache.push(`${emoji.id}`)
        client.cluster.send({ type: 'REQ_updateConfig', config: client.config })

        const guild = await client.module.database.Guild(emoji.guild.id)

        if (guild.plugins.modlog.events.emojiCreate.enabled) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.emojiCreate.channel)) return client.save(guild.id, { to_change: 'plugins.modlog.events.emojiCreate.enabled', value: false })

            return client.data.modlog_posts[emoji.guild.id].push(['emojiCreate', new client.class.modlog({
                color: 'good',
                event: 'Emoji created',
                thumbnail: emoji.url,
                fields: [
                    { name: 'Tag:', value: `**\`${emoji.name}\`**` },
                    { name: 'ID:', value: `**${emoji.id}**` }
                ]
            })])
        }
    }
}