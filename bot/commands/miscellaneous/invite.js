
'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'invite',
    slash: new Discord.SlashCommandBuilder(),
    usage: '=invite',
    description: 'Get a link for a support server along with the link to invite relaxy to your server.',
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
            color: client.data.embedColor,
            title: '**Hope you like Relaxy!**',
            description: '**1. [Support server invite link](https://discord.gg/xRAGVePxk6)**\n**2. [Relaxy! invite link](https://discord.com/api/oauth2/authorize?client_id=775358898088968202&permissions=0&scope=applications.commands%20bot)**',
            thumbnail: { url: 'https://media.tenor.com/images/822fb670841c6f6582fefbb82e338a50/tenor.gif' }
        }])
    }
}