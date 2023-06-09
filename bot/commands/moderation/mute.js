'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'mute',
    usage: '=mute user time',
    description: 'Mute a member for a specified amount of time (time can include the keywords: minute, hour, day, week, month, year to multiply time).',
    permissions: ['MANAGE_MESSAGES', 'MANAGE_ROLES'],
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
            return new client.class.error('Cannot mute yourself!', interaction ?? message)

        if (member.user.id === client.user.id)
            return new client.class.error('Relaxy cannot mute himself!', interaction ?? message)
        
        if (member.user.bot)
            return new client.class.error('Cannot mute a bot!', interaction ?? message)

        if (member.user.id === message.guild.ownerId)
            return new client.class.error('Cannot mute the server owner, obviously...', interaction ?? message)

        if (member.roles.highest.position >= message.member.roles.highest.position)
            return new client.class.error('You can not mute a member that is equal to or higher than yourself!', interaction ?? message)

        if (member.roles.highest.position >= message.guild.me.roles.highest.position)
            return new client.class.error('Cannot mute, Relaxy!\'s highest role position is lower than the person to be muted!', interaction ?? message)

        let mute_role = await message.guild.roles.fetch(guild.mute_id)

        if (mute_role && mute_role.rawPosition >= message.guild.me.roles.highest.position)
            return new client.class.error('The position of the mute role is lower than Relaxy!\'s highest role position!', interaction ?? message)

        if (member.permissions.has(Discord.PermissionFlagsBits['Administrator']))
            return new client.class.error('Cannot mute someone with administrator privileges!', interaction ?? message)

        if (member.roles.cache.find(r => r.id === guild.mute_id))
            return new client.class.error('This member is already muted!', interaction ?? message)

        if (!mute_role || mute_role?.size > 1) {
            let error = false

            mute_role = await message.guild.roles.create().catch(() => error = true)

            if (error) 
                return new client.class.error('Something went wrong while creating the muted role!', interaction ?? message)

            await Promise.all([mute_role.setName('Relaxy Muted'), mute_role.setColor('#000000'), mute_role.setMentionable(false), mute_role.setHoist(true)]).then(() => {
                message.guild.channels.cache.forEach((channel) => {
                    if ([client.imports.discord.ChannelType.GuildAnnouncement,
                        client.imports.discord.ChannelType.GuildText,
                        client.imports.discord.ChannelType.GuildVoice]
                    .includes(channel.type)) {
                        channel.permissionOverwrites.create(mute_role, {
                            'SendMessages': false,
                            'AddReactions': false,
                            'CreatePublicThreads': false,
                            'CreatePrivateThreads': false,
                            'Speak': false,
                            'Connect': false,
                        })
                    }
                })
            })

            client.save(guild.id, { to_change: 'mute_id', value: mute_role.id })
            new client.class.error('Created the Relaxy muted role!', message)
        }

        args.shift()
        let joined_args = args.join('')

        let time = Number(client.utils.nums(joined_args)??0) * 1000

        if (!time && member.user.username.split(' ').length > 1) {
            new client.class.error('No time specified/invalid formatting, setting default - 6 hours!', interaction ?? message)
            time = 6000
            args = ['6hours']
            joined_args = '6hours'
        }

        let member_roles_to_save = ""

        member.roles.cache.forEach(role => {
            if (role.id !== guild.mute_id)
                member_roles_to_save += `${role.id}+`
        })

        member_roles_to_save = member_roles_to_save.slice(0, -1)

        time = client.utils.get_time(joined_args)

        if (time > 315360000100)
            return new client.class.error('Maximum mute time is 10 years!', interaction ?? message)

        let mis_perm_flag = false

        member.roles.set([mute_role.id, member.roles.cache.find(role => role?.tags?.premiumSubscriberRole)??null]).catch((e) => {
            mis_perm_flag = true
            return new client.class.error('Relaxy has missing permissions to mute this user!', interaction ?? message)
        }).then(() => {
            if (mis_perm_flag) 
                return

            let temp_time = time
            time = Date.now() + time

            guild.mutes.push(`${time}_${member.user.id}_${temp_time}_${message.author.id}_${member_roles_to_save}_${guild.plugins.modlog.events.memberMuted ? guild.plugins.modlog.events.memberMuted.channel ? guild.plugins.modlog.events.memberMuted.channel : message.channel.id : message.channel.id}`)
            client.save(guild.id, { to_change: 'mutes', value: guild.mutes })

            if (guild.plugins.modlog.enabled && guild.plugins.modlog.events.memberMuted && guild.plugins.modlog.events.memberMuted.enabled)
                client.send(client.channels.cache.get(guild.plugins.modlog.events.memberMuted.channel), null, [new Discord.EmbedBuilder()
                    .setColor(16711680)
                    .setThumbnail(member.displayAvatarURL({ dynamic: true, extension: 'png' }))
                    .setTitle('**Event |** `User muted`')
                    .addFields([
                        { name: 'User:', value: `${member}`, inline: true },
                        { name: 'User ID:', value: `\`${member.user.id}\``, inline: true },
                        { name: 'Mute time:', value: `\`${client.imports.time(temp_time)}\`` },
                        { name: 'Muted by:', value: `${message.member}` }
                    ])
                    .setTimestamp()
                    .setFooter({ text: 'Event emitted', iconURL: client.config.text.links.relaxyImage })])

            return new client.class.error(`${member.user.username} has been muted for ${client.imports.time(temp_time)}!`, message)
        })
    }
}