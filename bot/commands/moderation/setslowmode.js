'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'setslowmode',
    aliases: ['slowmode', 'cooldown', 'setcooldown'],
    permissions: ['MANAGE_CHANNELS'],
    permissionsBOT: ['MANAGE_CHANNELS'],
    cooldown: 5,
    args: true,
    usage: '=setslowmode channel number (seconds)',
    description: 'Set a slowmode for a channel.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let channel = client.utils.channel(message, args)

        if (!channel && args[0])
            return new client.class.error('Channel doesn\'t exist/invalid id/mention!', interaction ?? message)

        let Time = channel ? args[1] ? args[1] : !isNaN(args[0]) ? args[0] : null : null

        if (!client.utils.nums(Time))
            return new client.class.error('No time number specified!', interaction ?? message)

        const time = client.utils.get_time(Time)

        if (!time)
            return new client.class.error('Invalid time format!', interaction ? interaction : mesage)

        try {
            if (channel)
                channel.setRateLimitPerUser(time)
            else 
                message.channel.setRateLimitPerUser(time)
        } catch (e) {
            return new client.class.error('Time in seconds should be under 21600! (6 hours)', message)
        }

        return new client.class.error(`description ${channel ? channel : message.channel} slowmode set to ${client.imports.time(time)}`, message)
    }
}