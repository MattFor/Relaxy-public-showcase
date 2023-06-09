'use strict'

import jimp from 'jimp'
import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'sus',
    permissionsBOT: ['ATTACH_FILES'],
    usage: '=sus user',
    slash: new Discord.SlashCommandBuilder().addUserOption(option => option.setName('user').setDescription('SUS').setRequired(false)),
    description: 'I fucking hate this command don\'t use it.',
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

        await Promise.all([(jimp.read(Math.floor(Math.random() * 10) === 4 ? `./additions/images/goos.png` : `./additions/images/sus.png`)), jimp.read(member.displayAvatarURL({ dynamic: true, extension: 'png' }))]).then(([a, b]) => {
            b.circle()
            a.resize(679, 653)
            b.resize(100, 100)
            a.composite(b, 340, 400)

            a.getBuffer(`image/png`, async(e, buffer) => {
                result = buffer
            })
        })

        return client.send(interaction ? 1 : message.channel, null, null, [
            new Discord.AttachmentBuilder(result, 'sus.png')
        ])
    }
}