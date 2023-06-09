'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle a message edit.
     * @param {Relaxy} client 
     * @param {Discord.PartialChannelData | Discord.PartialMessage | Discord.PartialUser} packet
     */
    run(client, packet) {
        if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) 
            return

        if (client.logs.raw)
            client.log(packet, 'DATA')

        const channel = client.channels.cache.get(packet.d.channel)

        if (!channel || channel.messages.cache.has(packet.d.message_id)) 
            return

        channel.messages.fetch(packet.d.message_id).then(async message => {
            const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name
            const reaction = message.reactions.cache.get(emoji)

            const user = await client.getUser(packet.d.user_id)

            if (reaction) 
                reaction.users.cache.set(packet.d.user_id, user)

            switch (packet.t) {
                case 'MESSAGE_REACTION_ADD':
                    return client.emit('messageReactionAdd', reaction, user)
                case 'MESSAGE_REACTION_REMOVE':
                    return client.emit('messageReactionRemove', reaction, user)
                case 'MESSAGE_DELETE':
                    return client.emit('messageDelete', message)
            }
        })
    }
}