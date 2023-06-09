'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'rep+',
    aliases: ['rep'],
    usage: '=rep+ user',
    description: 'Give someone an arbitrary reputation point **(some money and xp too)**!',
    args: true,
    cooldown: 7,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let user_mention_id

        try {
            user_mention_id = (await client.utils.member(message, args, 0))?.user
        } catch {
            return new client.class.error('No... you cannot do that!', interaction ?? message)
        }

        if (user_mention_id.id === message.author.id)
            return new client.class.error('Cannot rep+ yourself!', interaction ?? message)

        if (!user_mention_id || (user_mention_id.bot && user_mention_id.id != '775358898088968202'))
            return new client.class.error('Invalid user!', interaction ?? message)

        let user = await client.module.database.User(user_mention_id.id)

        let rep_length = user.reputation.length

        for (let i = 0; i < rep_length; i++)
            if (user.reputation[i].includes(message.author.id))
                return new client.class.error('You already rep+ this user!', interaction ?? message)

        user.reputation.push(message.author.id)
        let r = Math.floor(Math.random() * 20) + 5
        user.experience += r
        user.money += r
        user.markModified('exp')
        user.markModified('money')
        user.markModified('reputation')
        await user.save()

        return new client.class.error(`description You have rep+ ${user_mention_id}!`, message)
    }
}