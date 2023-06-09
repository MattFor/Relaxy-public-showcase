'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'whois',
    aliases: ['lookup'],
    cooldown: 5,
    args: true,
    slash: new Discord.SlashCommandBuilder().addUserOption(option => option.setName('user').setDescription('User who\'s information you want.').setRequired(false)),
    usage: '=whois user',
    description: 'Get general information about a user or yourself if no argument is provided.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let member = await client.utils.member(message, args, 0)

        if (!member)
            member = message.member

        const db_member = await client.module.database.Member(member.user.id, message.guild.id)

        let permissions = []
        let acknowledgements = ''

        for (const key of Object.entries(Discord.PermissionFlagsBits))
            if (member.permissions.has(Discord.PermissionFlagsBits[key[0]]))
                permissions.push(client.utils.firstLetterUp(key[0].toLowerCase()))

        if (permissions.length === Object.entries(Discord.PermissionFlagsBits).length)
            permissions = ['Has every permission [Administrator]']

        if (permissions.length === 0)
            permissions.push('No Key Permissions Found')

        if (member.user.id === client.config.keys.owner)
            acknowledgements += '```diff\n- MAKER OF RELAXY -\n```'

        if (member.user.id == message.guild.ownerID)
            acknowledgements += '```fix\nServer Owner\n```\n'

        if (member.user.id === client.user.id)
            acknowledgements += '```diff\n- RELAXY -\n```'

        if (member.user.bot)
            acknowledgements += '**BOT**\n'

        if (member.premiumSince)
            acknowledgements += `**Nitro boosting server for ${client.imports.time(member.premiumSince - Date.now()).replaceAll('-', '')}**\n`

        return client.send(interaction ? 1 : message.channel, null, [
            new Discord.EmbedBuilder()
                .setDescription(`**${member}** - **${member.user.tag}** - \`${member.user.id}\`\nNickname: ${member.nickname ? member.nickname : 'Same as normal username. / Unavailable.'}\nUser status: **${client.config.text.presenceStatus[member?.presence?.status??'offline']}**\n\nJoined server:\nAbout \`${client.imports.time(Date.now() - member.joinedAt)}\` ago.\n\nJoined discord:\nAbout \`${client.imports.time(Date.now() - member.user.createdAt)}\` ago.\n\nMessages sent: \`${db_member.messages}\`\nRelaxy! commands used: \`${db_member.commands}\`\nDisplay color: \`${member.displayHexColor}\``)
                .setAuthor({ name: member.user.tag, iconURL: member.displayAvatarURL({ dynamic: true, size: 4096 }) })
                .setColor(client.data.embedColor)
                .setFooter(client.data.footer)
                .setThumbnail(member.displayAvatarURL({ dynamic: true, size: 4096 }))
                .setTimestamp()
                .addFields([
                    { name: `Roles [${member.roles.cache.filter(r => r.id !== message.guild.id).map(roles => `\`${roles.name}\``).length}]`, value: `${member.roles.cache.filter(r => r.id !== message.guild.id).map(roles => `<@&${roles.id}>`).join(' **|** ') || 'No Roles'}`, inline: true },
                    { name: 'Permissions:', value: `\`${permissions.join(`\`, \``)}\`` },
                    acknowledgements.length !== 0 ? { name: 'Additional information:', value: acknowledgements, inline: true } : null
            ].filter(i => i !== null))]
        )
    }   
}