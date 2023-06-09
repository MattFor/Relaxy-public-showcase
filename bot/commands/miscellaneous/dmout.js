'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'dmout',
    usage: '=dmout',
    slash: new Discord.SlashCommandBuilder(),
    args: false,
    description: 'Opt out of receiving a message when joining a server with dm welcomes/leaves enabled.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const user = await client.module.database.User(message.author.id)

        if (user.dmout) {
            user.dmout = false
            user.markModified('dmout')
            await user.save()

            return new client.class.error('You\'ve successfully opted into DM welcome/leave server messages.', interaction ?? message)
        }

        user.dmout = true
        user.markModified('dmout')
        await user.save()

        return new client.class.error('You\'ve successfully opted out of DM welcome/leave server messages.', interaction ?? message)
    }
}