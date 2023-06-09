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
        client.log(`${member.user.tag} has joined [${member.guild.name}]`)

        const guild = await client.module.database.Guild(member.guild.id)

        client.core.autoRole(member, guild)

        if (guild.plugins?.raid?.enabled) {
            if (Date.now() - member.user.createdTimestamp < guild.plugins.raid.account_existance)
                // If the user meets the suspicious user criteria and RAID mode is enabled, deal with them
                if (guild.plugins.raid.on)
                    if (guild.plugins.raid.ban)
                        return member.ban({ reason: 'Suspected of raiding.' }).catch(() => {})
                    else 
                        return member.kick({ reason: 'Suspected of raiding.' }).catch(() => {})
                // Otherwise add them onto the pile of suspicious users
                else
                    client.data.raid_prevention[guild.id].push(member.user.id)
        } else {
            await client.save(guild.id, { to_change: 'plugins.raid', value: {
                enabled: false,
                on: false,
                ban: false,
                threshhold: 25,
                timeperiod: 300_000,
                account_existance: 2_678_400_000 // MONTH
            }})

            client.save(guild.id, { to_change: 'plugins.raid.enabled', value: false })
        }


        const invalidName = client.utils.censorCheck([member.nickname??member.user.username], guild)
        const renamedNickname = `Renamed${Math.floor(Math.random() * 100000000000)}`

        if (invalidName)
            member.setNickname(renamedNickname, `Censoring pool word detected in the ${member.nickname ? 'nickname' : 'username'}!`)

        if (guild.plugins.modlog.events.guildMemberAdd.enabled) {
            let permissions = []

            for (const key of Object.entries(Discord.PermissionFlagsBits))
                if (member.permissions.has(Discord.PermissionFlagsBits[key[0]]))
                    permissions.push(client.utils.firstLetterUp(key[0].toLowerCase()))

            if (permissions.length === Object.entries(Discord.PermissionFlagsBits).length)
                permissions = ['Has every permission [Administrator]']

            if (permissions.length === 0)
                permissions.push('No Key Permissions Found')

            if (!client.channels.cache.get(guild.plugins.modlog.events.guildMemberAdd.channel)) 
                client.save(guild.id, { to_change: 'plugins.modlog.events.guildMemberAdd.enabled', value: false })
            else 
                client.data.modlog_posts[member.guild.id].push(['guildMemberAdd', new client.class.modlog({
                    color: 'good',
                    event: 'User joined!',
                    thumbnail: member.displayAvatarURL({ dynamic: true, size: 4096 }),
                    fields: [
                        { name: 'User:', value: `${member}\n${member.user.tag}\n**\`${member.user.id}\`**` },
                        { name: 'Permissions:', value: `\`${permissions.join(`\`, \``)}\`` }
                    ],
                    description: `Joined discord: \`${client.utils.formatDate(member.user.createdAt)}\`\nAccount exists for: \`${client.imports.time(Date.now() - member.user.createdTimestamp)}\`${guild.plugins.censoring.enabled ? guild.plugins.censoring.renaming ? invalidName ? `\nUser renamed due to infringement of censor pool words:\nYes! The user is now named **\`${renamedNickname}\`!**`: `\nUser renamed due to infringement of censor pool words: **No!**` : '': ''}`
                })])
        }

        client.core.LockdownJoin(member, guild)

        if (guild.plugins.dm_welcome_leave.enabled) {
            let user = await client.module.database.User(member.user.id)
            let welcomer_message = guild.plugins.dm_welcome_leave.welcome.split('[SPLIT_FLAG]')

            if (welcomer_message[0] === 'NULL(0)')
                welcomer_message[0] = ''

            welcomer_message[0] = welcomer_message[0].replace('NULL(0)', '')

            if (welcomer_message[1] === 'NULL(0)')
                welcomer_message[1] = null
                welcomer_message[1] = welcomer_message[1].replace('NULL(0)', '')

            if (welcomer_message[1]) {
                welcomer_message[1] = JSON.parse(welcomer_message[1])
                try {
                    welcomer_message[1] = fixer.parse(JSON.stringify(welcomer_message[1]).replaceAll('botver', client.config.keys.version))
                } catch {}
            }

            if (!user.dmout)
                client.send(member.user, welcomer_message[0], [welcomer_message[1]] )
        }


        if (guild.welcome_channel.enabled) {
            if (!client.channels.cache.get(guild.welcome_channel.channelWELCOME)) 
                client.save(guild.id, { to_change: 'welcome_channel.channelWELCOME', value: '' })

            let welcome_card = null
            let welcome_attachment = null

            let welcome_encode = guild.welcome_channel.messageWELCOME.split('[SPLIT_FLAG]')

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

            if ([2, 3, 7, 9, 10, 11, 13].includes(Number(guild.welcome_channel.type))) {
                welcome_card = new client.imports.canvacord.Welcomer()
                    .setColor('#FF69B4')
                    .setGuildName(member.guild.name)
                    .setMemberCount(member.guild.members.cache.size)
                    .setUsername(client.utils.norm(member.user.username))
                    .setDiscriminator(member.user.tag.slice(-4))
                    .setAvatar(member.displayAvatarURL({ extension: 'png', size: 4096 }))

                welcome_card.colorTitle = '#FF69B4'
                welcome_card.textMessage = guild.welcome_channel.bottomWELCOME
                welcome_card.textTitle = guild.welcome_channel.topWELCOME

                await welcome_card.build().then((data) => {
                    if (welcome_encode[1])
                        welcome_attachment = data
                    else 
                        welcome_attachment = new Discord.AttachmentBuilder(data, { name: 'welcome.png' })
                })

                if (welcome_encode[1]) {
                    welcome_encode[1].files = [{
                        attachment: welcome_attachment,
                        name: 'welcome.png'
                    }]

                    welcome_encode[1].image = { url: 'attachment://welcome.png' }
                }
            }

            if ([1, 3, 7, 8, 10, 11, 12].includes(Number(guild.welcome_channel.type))) {
                if (welcome_encode[0])
                    welcome_encode[0] = welcome_encode[0].replace('|U|', member).replace('|G|', member.guild.name)
            } else {
                welcome_encode[0] = null
            }

            return client.data.entrance_messages[guild.id].push(['welcome', [welcome_encode[0], welcome_encode[1] ? [welcome_encode[1]] : null, welcome_attachment ? [welcome_attachment] : null]])
        }
    }
}