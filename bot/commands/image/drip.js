'use strict'

import Discord from 'discord.js'
import jimp from 'jimp'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'drip',
    permissionsBOT: ['ATTACH_FILES'],
    slash: new Discord.SlashCommandBuilder().addUserOption(option => option.setName('user').setDescription('User whose profile picture will be displayed.').setRequired(false)),
    usage: '=drip user',
    description: 'Adds yours or the specified user\'s profile picture to the \'drip\' meme template.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let member = await client.utils.member(message, args, 0)??message.member

        let result = null

        await Promise.all([jimp.read('./additions/images/drip.png'), jimp.read(member.displayAvatarURL({ dynamic: true, extension: 'png' }))]).then(([a, b]) => {
            b.circle()
            a.resize(768, 574)
            b.resize(165, 165)
            a.composite(b, 300, 70)

            a.getBuffer('image/png', async(e, buffer) => {
                result = buffer
            })
        })

        return client.send(interaction ? 1 : message.channel, null, null, [
            new Discord.AttachmentBuilder(result, 'drip.png')
        ])
    }
}