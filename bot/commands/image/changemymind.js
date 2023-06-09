'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'changemymind',
    aliases: ['cmm'],
    args: true,
    usage: '=changemymind text',
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('text').setDescription('Text displayed on the meme.').setRequired(true)),
    description: 'Adds the specified text to the \'change my mind\' meme template.',
    permissionsBOT: ['ATTACH_FILES'],
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
            new Discord.AttachmentBuilder(await client.imports.canvacord.Canvas.changemymind(args.join(' ').slice(0, 100)), { name :'changemymind.png' })
        ])
    }
}