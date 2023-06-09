'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'length',
    aliases: ['len'],
    usage: '=len message',
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('message').setDescription('Message of which you want the length of.').setRequired(true)),
    description: 'Shows how long the message you\'ve sent is.',
    cooldown: 5,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return new client.class.error(`The length of that message is ${args.join(' ').length}`, interaction ?? message)
    }
}