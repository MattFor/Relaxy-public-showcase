'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'phub',
    args: true,
    usage: '=phub text',
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('text').setDescription('Text displayed on the meme.').setRequired(true)),
    description: 'Falsifies a pornhub comment.',
    permissionsBOT: ['ATTACH_FILES'],
    cooldown: 5,
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
            new Discord.AttachmentBuilder(await client.imports.canvacord.Canvas.phub({
                username: message.author.username,
                message: args.join(' ').slice(0, 300),
                image: message.author.displayAvatarURL({ dynamic: false, extension: 'png', size: 4096 }),
        }), 'pornhub_comment.png')])
    }
}