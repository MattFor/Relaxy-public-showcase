'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: '8ball',
    aliases: ['8b'],
    usage: '=8ball',
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('text').setDescription('What do you wish for?').setRequired(true)),
    description: 'Gives back a randomized answer for your question.',
    cooldown: 2,
    args: true,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const pregenerated = client.imports.fs.readFileSync('./bot/configuration/8b.ini').toString().split('\r\n')

        return new client.class.error(`description **${pregenerated[Math.floor(Math.random() * pregenerated.length)]}, ${message.member}**`, message)
    }
}