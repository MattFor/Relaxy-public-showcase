'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'pat',
    args: true,
    usage: '=pat user',
    slash: new Discord.SlashCommandBuilder().addUserOption(option => option.setName('user').setDescription('Whoever you want to pat.').setRequired(true)),
    description: 'Pat someone!',
    permissionsBOT: ['ATTACH_FILES', 'EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const converted = [...client.imports.fs.readdirSync('./additions/images/pat')]

        let member1 = await client.utils.member(message, args, 0)??message.member
        let member2 = await client.utils.member(message, args, 1)

        if (!member1)
            return new client.class.error('No user to pat!', interaction ?? message)

        if (args.length === 2 && interaction) {
            member1 = await client.getMember(message.guild, args[0])
            member2 = await client.getMember(message.guild, args[1])
        }

        let file = converted[Math.floor(Math.random() * converted.length)]

        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            description: `**${member1} just pat ${member2}!${Math.floor(Math.random() * 10) == 5 ? ' \*pat pat\*' : '**'}`,
            image: {
                url: `attachment://${file}`,
            }
        }], [{
            attachment: `./additions/images/pat/${file}`,
            name: `${file}`,
        }])
    }
}