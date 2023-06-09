'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import DIG from 'discord-image-generation'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'delete',
    permissionsBOT: ['ATTACH_FILES'],
    usage: '=delete user',
    slash: new Discord.SlashCommandBuilder().addUserOption(option => option.setName('user').setDescription('User whose profile picture will be displayed.').setRequired(false)),
    description: 'Adds yours or the specified user\'s profile picture to the \'delete this trash\' meme template.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let member = await client.utils.member(message, args, 0)??message.member

        return client.send(interaction ? 1 : message.channel, null, null, [
            new Discord.AttachmentBuilder(await new DIG.Delete().getImage(member.displayAvatarURL({ dynamic: true, size: 4096, extension: 'png' })), 'delete.png')
        ])
    }
}