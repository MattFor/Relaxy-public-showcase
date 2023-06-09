'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'relaxytime',
    args: false,
    slash: new Discord.SlashCommandBuilder(),
    usage: '=relaxytime',
    description: 'Shows Relaxy!\'s internal clock.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const date = new Date().toLocaleString().split(',')
        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            title: 'Relaxy\'s internal clock:',
            description: `\`${date[1].slice(1)}\`  **-  ${date[0]}**`
        }])
    }
}