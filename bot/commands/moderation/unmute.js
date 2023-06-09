'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'unmute',
    usage: '=unmute user',
    desciption: 'Unmute a user.',
    permissions: ['MANAGE_MESSAGES', 'MANAGE_ROLES', 'EMBED_LINKS'],
    permissionsBOT: ['MANAGE_ROLES'],
    args: true,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let member = await client.utils.member(message, args, 0)??null

        if (!member)
            return new client.class.error('Member doesn\'t exist!', interaction ?? message)

        if (member.user.id === message.author.id)
            return new client.class.error('Cannot unmute yourself!', interaction ?? message)

        let mute_role = message.guild.roles.cache.find(role => role.id == guild.mute_id)

        if (!member.roles.cache.find(r => r.id == guild.mute_id))
            return new client.class.error('This user isn\'t muted!', interaction ?? message)

        if (!mute_role)
            return new client.class.error('Mute role created by Relaxy doesn\'t exist!', interaction ?? message)

        let mute_length = guild.mutes.length

        for (let i = 0; i < mute_length; i++)
            if (guild.mutes[i].includes(client.utils.nums(member.user.id))) {
                member.roles.remove(mute_role.id)

                let splits = guild.mutes[i].split('_')

                if (isNaN(Number(splits[0]))) {
                    guild.mutes.splice(i, 1)
                    client.save(guild.id, { to_change: 'mutes', value: guild.mutes })
                    continue
                }

                if (guild.plugins.modlog.enabled)
                    client.data.modlog_posts[message.guild.id].push(['memberUnmuted', new client.class.modlog({
                        color: 'good',
                        event: 'Member unmuted',
                        fields: [
                            { name: 'User:', value: member.toString(), inline: true },
                            { name: 'User ID:', value: `\`${member.user.id}\``, inline: true },
                            { name: 'Mute time:', value: `\`${client.imports.time(Date.now() - Number(guild.mutes[i].split('_')[2]))}\``},
                            { name: 'Muted by:', value: `${await client.getMember(message.guild, guild.mutes[i].split('_')[3].toString())??'Unavailable.'}` },
                            { name: 'Unmuted by:', value: `${message.member} [manual unmute]` }
                        ],
                        thumbnail: message.author.displayAvatarURL({ dynamic: true, size: 4096 })
                    })])

                member.roles.set(guild.mutes[i].split('_')[4].split('+'))
                guild.mutes.splice(i, 1)
                client.save(guild.id, { to_change: 'mutes', value: guild.mutes })

                return new client.class.error(`${member.user.username} has been unmuted!`, message)
            }

        return new client.class.error('There was noone to unmute?', interaction ?? message)
    }
}