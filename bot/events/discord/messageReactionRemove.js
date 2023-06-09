'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle removing a reaction
     * @param {Relaxy} client 
     * @param {Discord.MessageReaction} reaction 
     * @param {Discord.User} user 
     */
    async run(client, reaction, user) {
        try {
            reaction.message = await client.channels.cache.get(reaction.channelId).messages.fetch(reaction.id).catch(() => {})
        } catch {}

        if (reaction.message.channel.type === client.imports.discord.ChannelType.DM || reaction.message.channel.type === client.imports.discord.ChannelType.GroupDM) 
            return

        const guild = await client.module.database.Guild(reaction.message.guild.id)

        client.core.ReactionRemove(reaction, user, guild, reaction.message.id === guild.plugins.welcome_message.wmessage_id ? 2 : 1)

        return client.core.HeartBoard(reaction, user, 'messageReactionRemove', guild)
    }
}