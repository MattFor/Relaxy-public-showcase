'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'lovemeter',
    args: true,
    usage: '=lovemeter user user',
    description: 'Gives back a percentage of \'love\' you have to that user.\nFirst user is required while the second one isn\'t.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let user1, user2

        user1 = await client.utils.member(message, args, 0)

        if (args.length > 1)
            user2 = await client.utils.member(message, args, 1)

        if (!user1 && !args[1])
            user1 = await client.utils.member(message, args,)

        if (!user1 || (user2 && user1.id === user2.id))
            return new client.class.error('You provided no lover!', interaction ?? message)

        if (message.author.id === user1.id && !user2)
            return new client.class.error('Cannot love yourself! (loser)', interaction ?? message)

        const love_percent = Math.floor(Math.random() * 101)

        if (user1 && !user2)
            return new client.class.error(`description ${message.member}, your love for ${user1} is **${love_percent}%** ${
                love_percent == 69 ? '💗.... Ready for it...' :
                love_percent >= 90 ? '💗' :
                love_percent > 76 && love_percent < 90 ? '💖' :
                love_percent >= 50 && love_percent <= 76 ? '💓' :
                love_percent >= 30 && love_percent < 50 ? '💔' :
                love_percent >= 15 && love_percent < 30 ? '🤍' :
                love_percent >= 0 && love_percent < 15 ? '🖤 Sadge ;(' : null
            }`, message)

        return new client.class.error(`description ${user1}'s love for ${user2} is **${love_percent}%** ${
            love_percent == 69 ? '💗.... Ready for it...' :
            love_percent >= 90 ? '💗' :
            love_percent > 76 && love_percent < 90 ? '💖' :
            love_percent >= 50 && love_percent <= 76 ? '💓' :
            love_percent >= 30 && love_percent < 50 ? '💔' :
            love_percent >= 15 && love_percent < 30 ? '🤍' :
            love_percent >= 0 && love_percent < 15 ? '🖤 Sadge ;(' : null
        }`, message)
    }
}