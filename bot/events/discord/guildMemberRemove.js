'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'
import fixer from 'dirty-json'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.GuildMember} member
     */
    async run(client, member) {
        client.log(`${member.user.tag} has left [${member.guild.name}]`, 'ERROR')

        client.module.database.Guild(member.guild.id).then(async guild  => {
            if (guild.plugins.modlog.events.guildMemberRemove.enabled) {
                if (!client.channels.cache.get(guild.plugins.modlog.events.guildMemberRemove.channel)) 
                    return client.save(guild.id, { to_change: 'plugins.modlog.events.guildMemberRemove.enabled', value: false })

                let permissions = []
                for (const key of Object.entries(Discord.PermissionFlagsBits))
                    if (member.permissions.has(Discord.PermissionFlagsBits[key[0]]))
                        permissions.push(client.utils.firstLetterUp(key[0].toLowerCase()))

                if (permissions.length === Object.entries(Discord.PermissionFlagsBits).length)
                    permissions = ['Has every permission [Administrator]']

                if (permissions.length === 0)
                    permissions.push('No Key Permissions Found')

                client.data.modlog_posts[member.guild.id].push(['guildMemberRemove', new client.class.modlog({
                    color: 'bad',
                    event: 'User left!',
                    thumbnail: member.displayAvatarURL({ dynamic: true, size: 4096 }),
                    fields: [
                        { name: 'User:', value: `${member}\nTag: (${member.user.tag})\nNickname: ${member.nickname ? member.nickname : 'Same as normal username. / Unavailable.' }` },
                        { name: 'User ID:', value: `\`${member.user.id}\`` },
                        member.joinedAt ? { name: 'Joined server:', value: `\`${client.utils.formatDate(member.joinedAt)}\`` } : null,
                        { name: 'Permissions:', value: `\`${permissions.join(`\`, \``)}\`` },
                        { name: `Roles [${member.roles.cache.filter(r => r.id !== member.guild.id).map(roles => `\`${roles.name}\``).length}]`, value: `${member.roles.cache.filter(r => r.id !== member.guild.id).map(roles => `<@&${roles.id}>`).join(' **|** ') || 'No Roles'}`, inline: true }
                    ].filter(i => i !== null)
                })])
            }

            if (guild.plugins.dm_welcome_leave.enabled) {
                let user = await client.module.database.User(member.user.id)

                let z = guild.plugins.dm_welcome_leave.leave.split('[SPLIT_FLAG]')
                if (z[0] === 'NULL(0)')
                    z[0] = ''
                z[0] =z[0].replace('NULL(0)', '')
                if (z[1] === 'NULL(0)')
                    z[1] = null
                    z[1] = z[1].replace('NULL(0)', '')
                if (z[1]) {
                    z[1] = JSON.parse(z[1])
                    try {
                        z[1] = fixer.parse(JSON.stringify(z[1]).replaceAll('botver', client.config.keys.version))
                    } catch {}
                }
    
                if (!user.dmout)
                    client.send(member.user, z[0], [z[1]] )
            }

            if (guild.welcome_channel.enabled) {
                if (!client.channels.cache.get(guild.welcome_channel.channelLEAVE)) client.save(guild.id, { to_change: 'welcome_channel.channelLEAVE', value: '' })

                let welcome_card = null
                let welcome_attachment = null

                let welcome_encode = guild.welcome_channel.messageLEAVE.split('[SPLIT_FLAG]')

                if (welcome_encode[0] === 'NULL(0)')
                    welcome_encode[0] = ''

                if (welcome_encode[1]) {
                    try {
                        welcome_encode[1] = welcome_encode[1].replaceAll('botver', client.config.keys.version)
                    } catch {}
                    try {
                        welcome_encode[1] = welcome_encode[1].replaceAll("|U|", member).replaceAll("'U'", member)
                    } catch {}
                    try {
                        welcome_encode[1] = welcome_encode[1].replaceAll("|G|", member.guild.name).replaceAll("'G'", member.guild.name)
                    } catch {}
                    try {
                        welcome_encode[1] = fixer.parse(welcome_encode[1])
                    } catch {}
                    if (JSON.stringify(welcome_encode[1]).includes('timestamp'))
                        welcome_encode[1].timestamp = new Date()
                } 

                if ([4, 6, 7, 8, 9, 11, 13].includes(Number(guild.welcome_channel.type))) {
                    welcome_card = new client.imports.canvacord.Leaver()
                        .setColor('#FF69B4')
                        .setGuildName(member.guild.name)
                        .setMemberCount(member.guild.members.cache.size + 1)
                        .setUsername(client.utils.norm(member.user.username))
                        .setDiscriminator(member.user.tag.slice(-4))
                        .setAvatar(member.displayAvatarURL({ extension: 'png', size: 4096 }))

                    welcome_card.colorTitle = '#FF69B4'
                    welcome_card.textMessage = guild.welcome_channel.bottomLEAVE
                    welcome_card.textTitle = guild.welcome_channel.topLEAVE
                    await welcome_card.build().then((data) => {
                        if (welcome_encode[1])
                            welcome_attachment = data
                        else welcome_attachment = new Discord.AttachmentBuilder(data, { name: 'leave.png' })
                    })
                    if (welcome_encode[1]) {
                        welcome_encode[1].files = [{
                            attachment: welcome_attachment,
                            name: 'leave.png'
                        }]
                        welcome_encode[1].image = { url: 'attachment://leave.png' }
                    }
                }

                if ([4, 5, 7, 8, 9, 10, 12].includes(Number(guild.welcome_channel.type))) {
                    if (welcome_encode[0])
                        welcome_encode[0] = welcome_encode[0].replace('|U|', member).replace('|G|', member.guild.name)
                } else {
                    welcome_encode[0] = null
                }

                return client.data.entrance_messages[guild.id].push(['leave', [welcome_encode[0], welcome_encode[1] ? [welcome_encode[1]] : null, welcome_attachment ? [welcome_attachment] : null]])
            }
        })
    }
}