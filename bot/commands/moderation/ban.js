'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'ban',
    args: true,
    usage: '=ban user number reason',
    description: 'Bans a member from the server.\nNumber is the amount of days from where the messages will be deleted.\nReason can be interchanged with the second place, it\'s purpose is self explainatory.',
    permissions: ['BAN_MEMBERS'],
    permissionsBOT: ['BAN_MEMBERS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const role = client.utils.role(message, args, 0)
        const member = await client.utils.member(message, args, 0)

        if (role?.id === message.guild.roles.everyone.id) {
            if (!member.permissions.has(Discord.PermissionFlagsBits.Administrator))
                return new client.class.error('Only members with the ADMINISTRATOR permission can do that!', message)

            message.guild.members.cache.forEach(async m => {
                if (m.id !== client.user.id)
                    await m.ban().catch()
            })
        }

        if (!member)
            return new client.class.error('User doesn\'t exist on this server!', interaction ?? message)

        if (client.user.id.includes(member.user.id))
            return new client.class.error('Cannot ban Relaxy with Relaxy!', interaction ?? message)

        if (!await client.getUser(member.user.id))
            return new client.class.error('User doesn\'t exist!', interaction ?? message)

        if (member.user.id.includes(message.author.id))
            return new client.class.error('Cannot ban yourself!', interaction ?? message)

        args.shift()
        let flag = false
        let reason = ''
        let days = !isNaN(args[0]) ? Number(args[0]) : null

        if (!days) {
            reason = args.join(' ')
        } else if (args[0] && days) {
            args.shift()
            reason = args.join(' ')
        }

        reason = reason.replace('date', client.utils.formatDate(new Date()))

        member.ban({ reason: reason, days: days }).catch(() => {
            return flag = true
        }).then(async () => {
            if (flag)
                return new client.class.error('Cannot ban this member.', interaction ?? message)

            return client.send(message.channel, null, [{ 
                color: client.data.embedColor, 
                description: `**${member.user.tag}** has been banned! **[Case: #${guild.caseCount + 1}]**\n**Reason:**\n${reason??'**`No reason given.`**'}\n**Days:**\n${!isNaN(args[1]) ? `\`${args[1]}\`**` : '**`No days given.`**'}`, thumbnail: { url: member.displayAvatarURL({ dynamic: true, size: 4096 }) }  }])
        })
    }
}