'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import DIG from 'discord-image-generation'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'present',
    cooldown: 5,
    args: true,
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('text').setDescription('Text displayed on the meme.').setRequired(true)),
    permissionsBOT: ['ATTACH_FILES'],
    usage: '=present text',
    description: 'Adds the text to the meme template.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (client.utils.censorCheck(args, guild))
            return

        return client.send(interaction ? 1 : message.channel, null, null, [
            new Discord.AttachmentBuilder(await new DIG.LisaPresentation().getImage(args.join(' ').slice(0, 300)), 'presenting.png')
        ])
    }
}