'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import DIG from 'discord-image-generation'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'putin',
    cooldown: 5,
    aliases: ['meeting'],
    usage: '=putin user',
    slash: new Discord.SlashCommandBuilder().addUserOption(option => option.setName('user').setDescription('User whose profile picture will be displayed.').setRequired(false)),
    description: 'Adds yours or the specified user\'s profile picture to the framed picture in putin\'s meeting room.',
    permissionsBOT: ['ATTACH_FILES'],
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
            new Discord.AttachmentBuilder(await new DIG.Poutine().getImage(member.displayAvatarURL({ dynamic: true, size: 4096, extension: 'png' })), 'putin.png')
        ])
    }
}