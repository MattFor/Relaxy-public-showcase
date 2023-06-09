'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'levelout',
    aliases: ['lvlout', 'lout'],
    usage: '=levelout',
    slash: new Discord.SlashCommandBuilder(),
    description: 'Opt out of being shown on =leaderboard. People also won\'t be able to =level @you.',
    cooldown: 60,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const user = await client.module.database.User(message.author.id)

        if (user.levelout) {
            user.levelout = false
            user.markModified('levelout')
            await user.save()
            return new client.class.error('You\'re back into leveling!', interaction ?? message)
        }

        user.levelout = true
        user.markModified('levelout')
        await user.save()

        return new client.class.error('You opted out of leveling!', interaction ?? message)

    }
}