'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'pfp',
    aliases: ['avatar'],
    permissionsBOT: ['ATTACH_FILES'],
    usage: '=pfp user (raw)',
    slash: new Discord.SlashCommandBuilder()
        .addUserOption(option => option.setName('member').setDescription('Member whose profile picture will be displayed.').setRequired(false))
        .addBooleanOption(option => option.setName('raw').setDescription('Show user avatar not server avatar (different pfp due to nitro)').setRequired(false)),
    description: 'Shows your or the another user\'s profile picture.\nType \'raw\' to show global, not server profile.',
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
            new Discord.AttachmentBuilder(args.join(' ').toLowerCase().includes('raw') || args.join(' ').toLowerCase().includes('false') ? member.user.displayAvatarURL({ dynamic: true, size: 4096 }) : member.displayAvatarURL({ dynamic: true, size: 4096 }), 'avatar.gif')
        ])
    }
}