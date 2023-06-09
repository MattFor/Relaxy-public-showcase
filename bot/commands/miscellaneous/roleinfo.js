'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'roleinfo',
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    cooldown: 5,
    args: true,
    slash: new Discord.SlashCommandBuilder().addRoleOption(option => option.setName('role').setDescription('Role which information you want to get.').setRequired(true)),
    usage: '=roleinfo role mention/id/name',
    description: 'Get general information about a role.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let role = client.utils.role(message, args, 0)

        if (!role)
            return new client.class.error('No role like that found!', interaction ?? message)

        let permissions = []

        for (const key of Object.entries(Discord.PermissionFlagsBits))
            if (role.permissions.has(Discord.PermissionFlagsBits[key[0]]))
                permissions.push(client.utils.firstLetterUp(key[0].toLowerCase()))

        if (permissions.length === Object.entries(Discord.PermissionFlagsBits).length)
            permissions = ['Has every permission [Administrator]']

        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            title: `Role information for \`${role.name}\``,
            fields: [
                {
                    name: '**Role id:**',
                    value: `\`${role.id}\``,
                    inline: true,
                },
                {
                    name: '**Role name:**',
                    value: `**${role.name}**`,
                    inline: true,
                },
                {
                    name: '**Role:**',
                    value: `**${role}**`,
                    inline: true,
                },
                {
                    name: '**Role hex color code:**',
                    value: `**${role.hexColor.toUpperCase()}**`,
                    inline: true,
                },
                {
                    name: '**Role user number:**',
                    value: role.members.size.toString(),
                    inline: true,
                },
                {
                    name: '**Role position:**',
                    value: role.position.toString(),
                    inline: true,
                },
                {
                    name: '**Can the role be mentioned:**',
                    value: `${role.mentionable ? '```fix\nYES\n```' : '```diff\n- NO\n```'}`, 
                },
                {
                    name: '**Permissions:**',
                    value: `\`${permissions.join(`\`, \``)}\``
                }
            ],
            footer: client.data.footer,
            thumbnail: { 
                url: `attachment://${message.guild.id}.gif`
            }}], 
            [{
                attachment: role.iconURL({ dynamic: true, size: 4096 })??(!message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 })),
                name: `${message.guild.id}.gif`
            }])
    }
}