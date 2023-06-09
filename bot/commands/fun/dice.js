'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'dice',
    usage: '=dice number',
    description: 'Returns a random number from 1 to the number specified. (max 1000000)',
    aliases: ['d'],
    cooldown: 5,
    args: true,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (args[0] === '0' || args[0].includes('-')) return new client.class.error('NaN or above 1000000!', interaction ?? message)
        return new client.class.error(`${(Math.floor(Math.random() * parseInt(client.utils.nums(args[0]))) + 1)}`, message)
    }
}