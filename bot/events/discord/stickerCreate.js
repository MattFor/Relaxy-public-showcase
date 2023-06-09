'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.Sticker} sticker
     */
    async run(client, sticker) {
        const guild = await client.module.database.Guild(sticker.guild.id)

        if (guild.plugins.modlog.events.stickerCreate.enabled) {
            let channel = await sticker.guild.channels.fetch(guild.plugins.modlog.events.stickerCreate.channel).catch(() => {})
            if (!channel) 
                return

            let user = await sticker.fetchUser().catch(() => {})
            if (!user)
                user = 'Unavaliable.'

            client.data.modlog_posts[sticker.guild.id].push(['stickerCreate', new client.class.modlog({
                color: 'good',
                event: 'Sticker created',
                image: { url: sticker.url },
                description: `Info: **${sticker.name}** - **\`${sticker.id}\`**\nDescription:\n${sticker.description}\nAdded by: ${user}`
            })])
        }
    }
}