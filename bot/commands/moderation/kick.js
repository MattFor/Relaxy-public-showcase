'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'kick',
    args: true,
    usage: '=kick member reason',
    description: 'Kick someone from the server with the specified reason (optional).',
    permissions: ['KICK_MEMBERS'],
    permissionsBOT: ['KICK_MEMBERS'],
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
            return new client.class.error('User doesn\'t exist on this server!', interaction ?? message)

        if (client.user.id.includes(member.user.id))
            return new client.class.error('Cannot kick Relaxy with Relaxy!', interaction ?? message)

        if (!await client.getUser(member.user.id))
            return new client.class.error('User doesn\'t exist!', interaction ?? message)

        if (member.user.id.includes(message.author.id))
            return new client.class.error('Cannot kick yourself!', interaction ?? message)

        args.shift()
        let flag = false
        let reason = ''
        if (args[0])
            reason = args.join(' ')

        member.kick({ reason: reason.replace('date', client.utils.formatDate(new Date())) }).catch(() => {
            return flag = true
        }).then(async () => {
            if (flag)
                return new client.class.error('Cannot kick this member.', interaction ?? message)

            client.save(guild.id, { to_change: 'caseCount', value: ++guild.caseCount })
            return client.send(message.channel, null, [{color: client.data.embedColor, description: `**${member.user.tag}** has been kicked! **[Case: #${guild.caseCount}]**\n**Reason:**\n${args[1] && isNaN(args[1]) && args[1].length > 0 ? args[1] : '**`No reason given.`**'}`, thumbnail: { url: member.displayAvatarURL({ dynamic: true, size: 4096 }) } }])
        })
    }
}