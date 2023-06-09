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

        if (guild.plugins.modlog.events.stickerDelete.enabled) {
            let channel = await sticker.guild.channels.fetch(guild.plugins.modlog.events.stickerDelete.channel).catch(() => {})
            if (!channel) 
                return

            let user = await sticker.fetchUser().catch(() => {})
            if (!user)
                user = 'Unavaliable.'

            client.data.modlog_posts[invite.guild.id].push(['stickerDelete', new client.class.modlog({
                color: 'bad',
                event: 'Sticker deleted',
                image: { url: sticker.url },
                description: `Info: **${sticker.name}** - **\`${sticker.id}\`**\nDescription:\n${sticker.description}\nAdded by: ${user}`
            })])
        }
    }
}