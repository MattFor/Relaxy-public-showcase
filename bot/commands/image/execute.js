'use strict'

import Discord from 'discord.js'
import jimp from 'jimp'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'execute',
    aliases: ['kill'],
    slash: new Discord.SlashCommandBuilder()
        .addUserOption(option => option.setName('user1').setDescription('User who will be the victim.').setRequired(true))
        .addUserOption(option => option.setName('user2').setDescription('User who will be the killer.').setRequired(false)),
    usage: '=execute user user2',
    description: 'Adds yours or the specified user\'s profile picture a stock picture of a kill.',
    permissionsBOT: ['ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let member1 = null
        let member2 = null

        switch(args.length) {
            case 1:
                member2 = message.member
                member1 = await client.utils.member(message, args, 0)
            break
            case 2:
                member1 = await client.utils.member(message, args, 0) ?? message.member
                member2 = await client.utils.member(message, args, 1)
            break
        }

        if (!member1)
            return new client.class.error('No user specified to execute!', interaction ?? message)

        const base = jimp.read('../Relaxy!/additions/images/kill.png')
        const img1 = jimp.read(member1.displayAvatarURL({ dynamic: true, extension: 'png' }))
        const img2 = jimp.read(member2.displayAvatarURL({ dynamic: true, extension: 'png' }))

        let result = null

        await Promise.all([img1, img2, base]).then(([a, b, c]) => {
            a.circle()
            b.circle()

            c.resize(768, 574)
            a.resize(165, 165)
            b.resize(165, 165)

            c.composite(a, 105, 200)
            c.composite(b, 525, 20)

            c.getBuffer('image/png', async(e, buffer) => {
                result = buffer
            })
        })

        return client.send(interaction ? 1 : message.channel, null, null, [
            new Discord.AttachmentBuilder(result, 'execution.png')
        ])
    }
}