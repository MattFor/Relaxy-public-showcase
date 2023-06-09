'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'mutes',
    usage: '=mutes',
    description: 'Show all people on the server who are muted.',
    permissions: ['MANAGE_MESSAGES', 'MANAGE_ROLES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let mutes = ''

        const muteValues = Object.values(guild.mutes)
        const membersToFetch = [...new Set(muteValues.map(warn => warn.split('_')[1]).concat(muteValues.map(warn => warn.split('_')[3])))]

        const membersFetched = await message.guild.members.fetch({ user: membersToFetch }) 
            
        for (let i = 0; i < guild.mutes.length; i++) {
            const mute = guild.mutes[i].split('_')

            const member1 = membersFetched.get(mute[1])
            const member2 = membersFetched.get(mute[3])

            mutes += `**${i + 1}.** ${member1??'[Unavailable]'} ${member1?.user.tag??''} for \`${client.imports.time(mute[2])}\` by ${member2??'[Unavailable]'}\n`
        }

        let fields = []
        let desc_copy = mutes.slice(0, 2048)
        if (mutes.length > 2048) {
            mutes = mutes.slice(2048, mutes.length - 1)
            let i = 0
            while (true) {
                if (i * 1024 > mutes.length || fields.length > 20)
                    break

                fields.push({ name: 'Continuation:', value: mutes.slice(i * 1024, (i + 1) * 1024) })
                i++
            }
        }

        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            title: `Mutes of ${client.utils.cstr(message.guild.name)}`,
            description: desc_copy??'There\'s noone muted!',
            fields: fields??null,
            footer: client.data.footer,
            thumbnail: { url: `attachment://${message.guild.id}.gif` },
        }], [{
            attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
            name: `${message.guild.id}.gif`
        }])
    }
}