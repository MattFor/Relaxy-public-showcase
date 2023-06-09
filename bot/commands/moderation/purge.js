'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'

const clear_channel_right = async (channel, cache_size) => {
    let flag = true

    channel.bulkDelete(100).catch(() => {
        return flag = false
    }).then((e) => {
        if (!(flag || e.size === 0))
            return setTimeout(() => {
                return clear_channel_right(channel, (cache_size - 100))
            }, 1000)
    })
}


export default {
    name: 'purge',
    usage: '=purge amount channel(optional)',
    description: 'Delete a number of messages. Second argument can be a channel id/mention/name. `(max 10000)`\n**The bigger the number the more you have to wait for the messages to be deleted**',
    args: true,
    permissions: ['MANAGE_MESSAGES'],
    permissionsBOT: ['MANAGE_MESSAGES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let number = Number(client.utils.nums(args[0]))

        message.delete().catch(() => {})

        if (isNaN(number))
            return new client.class.error('No number specified!', interaction ?? message)

        if (number < 1 || number > 5000)
            return new client.class.error('Invalid number specified, please use 1-5000!', interaction ?? message)

        let flag = null
        let channel = client.utils.channel(message, args, 1) ?? message.channel

        if (!channel && isNaN(number))
            return  new client.class.error('Channel doesn\'t exist!', interaction ?? message)

        if (number < 100) {
            await channel.bulkDelete(number).catch((e) => { flag = e.message.toLowerCase().includes('day') })
            return flag ? new client.class.error('Cannot delete messages that are 14+ days old.', interaction ?? message).then(m => {
                setTimeout(() => {
                    m.delete().catch(() => {})
                }, 5000)
            }) : null
        }

        clear_channel_right(channel, number)
    }
}