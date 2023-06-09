'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'thanks',
    aliases: ['thanksto'],
    permissionsBOT: ['EMBED_LINKS'],
    slash: new Discord.SlashCommandBuilder(),
    usage: '=thanks',
    description: 'Shows the page with the names of people who helped me make the bot along with what they contributed!',
    cooldown: 2,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return client.send(interaction ? 1 :message.channel, null, [{
            title: 'Here\'s a list of people who I couldn\'t have been made without!',
            description: client.imports.fs.readFileSync('./bot/configuration/credits.ini').toString(),
            color: client.data.embedColor,
            timestamp: new Date(),
            footer: {
                icon_url: client.config.text.links.relaxyImage,
                text: `Relaxy! version ${client.config.keys.version} made by MattFor#9884 and many others ;)`
            },
            author: {
                name: 'Relaxy\'s \'thanks to\' page!',
                icon_url: 'https://cdn.discordapp.com/attachments/775450442989568061/786180226967142480/9826172.gif'
            },
        }])
    }
}