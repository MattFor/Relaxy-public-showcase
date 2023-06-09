'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


const Invalids = [
    'client',
    'cd',
    'this',
    'guilds',
    'cache',
    'ban',
    'kick',
    'reason',
    'user',
    '\\',
    '{',
    '}'
]


export default {
    name: 'calc',
    cooldown: 5,
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('equation').setDescription('Equation which will be computed.').setMinLength(3).setRequired(true)),
    usage: '=calc equation',
    description: 'The equation accepts everything, add = +, subtract = -, multiply = *, divide = /, power = **.',
    args: true,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        const text = args.join('').replaceAll('x', '*').replaceAll('X', '*')

        if (!text.match(/\d+/g))
            return new client.class.error('No numbers provided!', interaction ?? message)

        for (let i = 0; i < 12; i++)
            if (text.includes(Invalids[i]))
                return new client.class.error('Invalid arguments!', interaction ?? message)

        let evaluated

        try {
            evaluated = eval(args.join(''))
        } catch (e) {
            return new client.class.error(`description ERROR:\n\`${e.message}\``, interaction ?? message)
        }

        if (!evaluated)
            return new client.class.error('The result is too big/small to display!', interaction ?? message)

        return client.send(message.channel, null, [{
            description: `\`${args.join(' ')}\` = **${evaluated}**`,
            color: client.data.embedColor
        }])
    }
}