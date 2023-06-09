'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'

const options = [ 'Heads', 'Tails' ]

export default {
    name: 'coinflip',
    usage: '=coinflip heads/tails bet',
    description: 'Bet on a coinflip side, **bet** being how much money you want to bet. **(max 200)**',
    aliases: ['cf'],
    args: true,
    cooldown: 20,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const user = await client.module.database.User(message.author.id)

        let bet = Number(args[1])

        if (!bet || isNaN(bet))
            return new client.class.error('Bet not present/NaN!', interaction ?? message)
        if (bet > 400)
            return new client.class.error('Bet too high!', interaction ?? message)
        if (bet < 0)
            return new client.class.error('Bet cannot be lower than 0!', interaction ?? message)
        if (bet > user.money) 
            return new client.class.error('Bet higher than the amount of money you have!', interaction ?? message)

        let bet_option

        try {
            bet_option = client.utils.firstLetterUp(args[0])
        } catch {}

        if (!options.includes(bet_option))
            return new client.class.error('No option specified! [heads/tails]', interaction ?? message)

        let chance = Math.random() > 0.5 ? 0 : 1
        let result = options[chance]

        let l = result === bet_option
        let z = l ? Math.floor(bet * 1.5) : Math.floor(bet * 2)

        if (l) {
            user.money += z
            new client.class.error(`description **${result}**, you won **\`${z} money\`**!`, message)
        } else {
            user.money -= z
            new client.class.error(`description **${result}**, you lost **\`${z} money\`**!`, message)
        }

        user.markModified('money')

        return  user.save()
    }
}