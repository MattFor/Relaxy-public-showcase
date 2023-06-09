'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import DIG from 'discord-image-generation'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'spank',
    cooldown: 5,
    usage: '=spank user',
    slash: new Discord.SlashCommandBuilder()
        .addUserOption(option => option.setName('user1').setDescription('User whose profile picture will do the slap.').setRequired(true))
        .addUserOption(option => option.setName('user2').setDescription('User whose profile picture will be slapped.').setRequired(false)),
    description: 'Spank someone.',
    permissionsBOT: ['ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let member1 = await client.utils.member(message, args, 0)??message.member
        let member2 = await client.utils.member(message, args, 1)

        if (!member1)
            return new client.class.error('No user specified to spank!', interaction ?? message)

        let image1 = member1.displayAvatarURL({ dynamic: true, extension: 'png' })
        let image2 = member2.displayAvatarURL({ dynamic: true, extension: 'png' })

        if (args.length === 2 && interaction) {
            let interaction_member1 = await client.getMember(message.guild, args[0])
            let interaction_member2 = await client.getMember(message.guild, args[1])

            image1 = interaction_member1.displayAvatarURL({ dynamic: true, extension: 'png' })
            image2 = interaction_member2.displayAvatarURL({ dynamic: true, extension: 'png' })
        }

        return client.send(interaction ? 1 : message.channel, null, null, [
            new Discord.AttachmentBuilder(await new DIG.Spank().getImage(image1, image2), 'spank.png')
        ])
    }
}