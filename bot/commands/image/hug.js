'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'hug',
    args: true,
    usage: '=hug user',
    slash: new Discord.SlashCommandBuilder().addUserOption(option => option.setName('user').setDescription('Whoever you want to hug.').setRequired(true)),
    description: 'Hug someone!',
    permissionsBOT: ['ATTACH_FILES', 'EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const converted = [...client.imports.fs.readdirSync('./additions/images/hug')]

        let member1 = await client.utils.member(message, args, 0)??message.member
        let member2 = await client.utils.member(message, args, 1)

        if (!member1)
            return new client.class.error('No user to hug!', interaction ?? message)

        if (args.length === 2 && interaction) {
            member1 = await client.getMember(message.guild, args[0])
            member2 = await client.getMember(message.guild, args[1])
        }

        let file = converted[Math.floor(Math.random() * converted.length)]

        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            description: `**${member1} just hugged ${member2}!${Math.floor(Math.random() * 10) == 5 ? '** **big hug :)**' : '**'}`,
            image: {
                url: `attachment://${file}`,
            }
        }], [{
            attachment: `./additions/images/hug/${file}`,
            name: `${file}`,
        }])
    }
}