'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.GuildTextBasedChannel} channel 
     */
    async run(client, channel) {
        const guild = await client.module.database.Guild(channel.guild.id)

        if (guild.plugins.modlog.events.channelPinsUpdate.enabled) {
            let Channel = await channel.guild.channels.fetch(guild.plugins.modlog.events.channelPinsUpdate.channel).catch(() => {})

            if (!Channel) 
                return

            return client.data.modlog_posts[Channel.guild.id].push(['channelPinsUpdate', new client.class.modlog({
                event: 'Channel pins updated',
                description: `In the channel: ${channel} - **${channel.name}** - **\`${channel.id}\`**`
            })])
        }
    }
}