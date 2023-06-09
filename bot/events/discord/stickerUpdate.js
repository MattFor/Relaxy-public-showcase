'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.Sticker} old_sticker
     * @param {Discord.Sticker} new_sticker
     */
    async run(client, old_sticker, new_sticker) {
        const guild = await client.module.database.Guild(new_sticker.guild.id)

        if (guild.plugins.modlog.events.stickerUpdate.enabled) {
            let channel = await new_sticker.guild.channels.fetch(guild.plugins.modlog.events.stickerUpdate.channel).catch(() => {})
            if (!channel) 
                return

            let user = await new_sticker.fetchUser().catch(() => {})
            if (!user)
                user = 'Unavaliable.'

            client.data.modlog_posts[invite.guild.id].push(['stickerUpdate', new client.class.modlog({
                event: 'Sticker updated',
                thumbnail: old_sticker.url !== new_sticker.url ? { url: old_sticker.url } : null,
                image: { url: new_sticker.url },
                description: `${old_sticker.name !== new_sticker.name ? `Name changed **${old_sticker.name}** -> **${new_sticker.name}**` : `Name: **${new_sticker.name}**`}\nSticker ID: **\`${new_sticker.id}\`**\nDescription${old_sticker.description !== new_sticker.description ? ` changed:\nOld:\n${old_sticker.description}\n**New:**\n${new_sticker.description}` : `:\n${new_sticker.description}`}\nAdded by: ${user}`
            })])
        }
    }
}