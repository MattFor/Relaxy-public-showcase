'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'devlog',
    aliases: ['dev'],
    cooldown: 5,
    usage: '=devlog',
    slash: new Discord.SlashCommandBuilder(),
    description: 'Shows what features MattFor#9884 has been working on recently.',
    permissionsBOT: ['EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return client.send(interaction ? 1 : message.channel, null, [{
            title: 'Here are the features I\'m working on & other stuff!',
            description: client.imports.fs.readFileSync('./bot/configuration/devlog.ini').toString(),
            color: client.data.embedColor,
            timestamp: new Date(),
            footer: client.data.footer,
            author: {
                name: 'Relaxy\'s dev log!',
                icon_url: 'https://cdn.discordapp.com/attachments/775450442989568061/786180226967142480/9826172.gif'
            },
        }])
    }
}