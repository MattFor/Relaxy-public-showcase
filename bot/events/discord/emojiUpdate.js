'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle channel creation.
     * @param {Relaxy} client 
     * @param {Discord.Channel} channel 
     * @returns {Discord.Message}
     */
    async run(client, oldEmoji, newEmoji) {

        const guild = await client.module.database.Guild(newEmoji.guild.id)

        if (guild.plugins.modlog.events.emojiUpdate.enabled) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.emojiUpdate.channel)) return client.save(guild.id, { to_change: 'plugins.modlog.events.emojiUpdate.enabled', value: false })

            return client.data.modlog_posts[newEmoji.guild.id].push(['emojiUpdate', new client.class.modlog({
                color: 'good',
                event: 'Emoji updated',
                thumbnail: newEmoji.url,
                fields: [
                    { name: 'OLD:', value: `**${oldEmoji ? oldEmoji.name : 'unavailable'}**` },
                    { name: 'NEW:', value: `**${newEmoji.name}**` },
                    { name: 'ID:', value: `**${newEmoji.id}**` }
                ]
            })])
        }
    }
}