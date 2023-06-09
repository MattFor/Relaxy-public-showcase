'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


let perms = {}
for (const perm of Object.getOwnPropertyNames(Discord.PermissionsBitField.Flags)) 
    perms[perm] = perm;

export default {
    name: 'stats',
    aliases: ['guildstats', 'serverstats'],
    cooldown: 5,
    slash: new Discord.SlashCommandBuilder(),
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    usage: '=stats',
    description: 'Show an enormous amount of information about the server you\'re on.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} Guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, Guild, interaction) {
        const owner = await message.guild.fetchOwner()
        const guild = message.guild
        let show_thread_n_category = false
        let page = 0

        let pages = [
            [(async () => { return {
                color: client.data.embedColor,
                title: `Statistics for: **${client.utils.firstLetterUp(guild.name)}**`,
                footer: client.data.footer,
                timestamp: new Date(),
                fields: [{
                    name: 'Server info:', value: `Server ID: \`${
                        guild.id
                    }\`.\nServer age: \`${
                        client.imports.time(guild.createdAt ? (new Date() - guild.createdAt) : 0)
                    }\`.\nServer owner: ${
                        owner
                    } ${
                        owner.user.tag
                    } \`${
                        guild.ownerId
                    }\`\nServer member count: \`${
                        guild.memberCount
                    }\`.\nServer nitro level: \`${
                        guild.premiumTier
                    }\`.\nServer nitro subscribers: **\`${
                        guild.premiumSubscriptionCount
                    }\`**.\nServer verification level: \`${
                        guild.verificationLevel
                    }\`.\nServer verified?: \`${
                        guild.verified ? `YES` : `NO`
                    }\`.\nServer afk channel and timeout: **${
                        guild.afkChannel ? `ENABLED` : `DISABLED`
                    }** ${
                        guild.afkChannel ? `    **-**     \`${client.imports.time(guild.afkTimeout)}\`.` : `.`
                    }\nServer discord censor level: **${
                        guild.explicitContentFilter.toString()
                    }**.`, 
                },
                {
                    name: 'Relaxy info:', value: `Relaxy joined: \`${
                        client.imports.time(guild.joinedAt ? (new Date() - guild.joinedAt) : 0)
                    } ago\`.\nRelaxy server prefixes: ${
                        Guild.prefixes.map(prefix => { return `**\`${prefix}\`**` })
                    }.\nMessages sent since Relaxy joined: \`${
                        Guild.messages
                    }\`.\nRelaxy server shard: \`${
                        message.guild.shardId + 1
                    }\`.\nRelaxy shard count: \`${
                        client.data.shard_count
                    }\`.\nRelaxy shard ping: \`${
                        client.ws.ping
                    }ms\`.\nRelaxy commands used: \`${
                        Guild.commands
                    }\`.\nRelaxy mutes: \`${
                        Guild.mutes.length
                    }\`.\nRelaxy restricted channels count: \`${
                        Guild.plugins.restricted_channels.length
                    }\`.\nRelaxy exemptions count: \`${
                        Guild.plugins.person_exceptions.length
                    }\`.\nRelaxy clearing channels count: \`${
                        Guild.plugins.clearing_channels.length
                    }\`.\nRelaxy censoring enabled?: **${
                        Guild.plugins.censoring.enabled ? `YES` : `NO`
                    }**.\nRelaxy autobanning enabled?: **${
                        Guild.plugins.censoring.autobanning == 0 ? 'NO' : 'YES'
                    }** ${
                        !Guild.plugins.censoring.autobanning === 0 ? `    **-**     \`${Guild.plugins.censoring.autobanning}\`.` : `.`
                    }\nRelaxy leveling enabled?: **${
                        Guild.plugins.leveling.enabled ? `YES` : `NO`
                    }** ${
                        Guild.plugins.leveling.enabled ? `    **-**     \`${Guild.plugins.leveling.type}\`.` : `.`
                    }\nRelaxy welcome message enabled?: **${
                        Guild.plugins.welcome_enabled ? `YES` : `NO`
                    }**.\nRelaxy reaction roles enabled?: **${
                        Guild.plugins.welcome_roles ? `YES` : `NO`
                    }**.\nRelaxy moderator log enabled?: **${
                        Guild.plugins.modlog.enabled ? `YES` : `NO`
                    }**.${Guild.plugins.modlog.lowspam ? ' Lowspam: **ON**' : ' Lowspam: **OFF**'}.\nRelaxy heartboard enabled?: **${
                        Guild.plugins.heart_board.enabled ? `YES` : `NO`
                    }**.\nRelaxy music options: \n- leave after calling =stop: **\`${
                        Guild.music_options.leaveOnStop ? 'YES' : 'NO'
                    }\`**.\n- leave after music ends: **\`${
                        Guild.music_options.leaveOnEnd ? 'YES' : 'NO'
                    }\`**.\n- leave on empty channel:  **\`${
                        Guild.music_options.leaveOnEmpty ? `YES\`** - **\`${client.imports.time(Guild.music_options.leaveOnEmptyCooldown)}\`**` : 'NO\`**'
                    }.\nRelaxy achievement channel: **${Guild.achievements.channel.length === 0 ? 'None.' : await client.channels.fetch(Guild.achievements.channel)}.**`
                },{
                    name: 'Relaxy\'s permissions:', value: `${Object.entries(guild.me.permissions.serialize()).filter(perm => perm[1]).map(([perm]) => `\`${perms[perm]}\``).join(', ')}.`
                }],
                thumbnail: { url: `attachment://${guild.id}.gif` },
            } }), (() => { return {
                attachment: !guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : guild.iconURL({ dynamic: true, size: 4096 }),
                name: `${guild.id}.gif`
            } })],
            [
                (() => { 
                    let roles = guild.roles.cache.sorted().map(r => { return r }).join(', ')
                    let desc_copy = roles.slice(0, 5800).slice(0, 2048)
                    let fields = []
                    let _f = false


                    if (roles.length > 2048) {
                        _f = true
                        roles = roles.slice(0, 5800).slice(2048, roles.length - 1)
                        let i = 0
                        while (true) {
                            if (i * 1024 > roles.length || fields.length > 20)
                                break

                            fields.push({ name: 'Continuation:', value: roles.slice(i * 1024, (i + 1) * 1024) })
                            i++
                        }
                    }

                    return {
                        color: client.data.embedColor,
                        title: `Roles of **${client.utils.firstLetterUp(guild.name)}**`,
                        footer: client.data.footer,
                        timestamp: new Date(),
                        description: desc_copy,
                        fields: _f ? fields : [],
                        thumbnail: { url: `attachment://${guild.id}.gif` },
                    } 
                })
            ],
            [
                ((additional) => { 
                    let channels = guild.channels.cache.sorted().map(c => { 
                        if (additional) {
                            if (![Discord.ChannelType.PublicThread, Discord.ChannelType.PrivateThread, Discord.ChannelType.AnnouncementThread, Discord.ChannelType.GuildCategory].includes(c.type)) 
                                return c
                            
                            return null
                        } else 
                            return c
                    }).filter(i => i !== null).join(', ')

                    let desc_copy = channels.slice(0, 5800).slice(0, 2048)
                    let fields = []
                    let _f = false

                    if (channels.length > 2048) {
                        _f = true
                        channels = channels.slice(0, 5800).slice(2048, channels.length - 1)
                        let i = 0
                        while (true) {
                            if (i * 1024 > channels.length || fields.length > 20)
                                break

                            fields.push({ name: 'Continuation:', value: channels.slice(i * 1024, (i + 1) * 1024) })
                            i++
                        }
                    }

                    return {
                        color: client.data.embedColor,
                        title: `Channels of **${client.utils.firstLetterUp(guild.name)}**`,
                        footer: client.data.footer,
                        timestamp: new Date(),
                        description: desc_copy,
                        fields: _f ? fields : [],
                        thumbnail: { url: `attachment://${guild.id}.gif` },
                    } 
                })
            ]
        ]

        if (!interaction)
            return client.send(message.channel, null, [await pages[0][0]()], [await pages[0][1]()]).then(async m => {
                await m.react('◀️')
                await m.react('▶️')
                await m.react('🔀')

                const collector = m.createReactionCollector({ filter: (reaction, user) =>
                    (user.id === message.author.id && !user.bot)}
                ).on('collect', async (reaction, user) => {
                    m.reactions.cache.get(reaction.emoji.name).users.remove(user.id)

                    switch(reaction.emoji.name) {
                        case '◀️':
                            if (page === 0)
                                return

                            page--
                            break
                        case '▶️':
                            if (page === pages.length - 1)
                                return

                            page++
                            break
                        case '🔀':
                            if (page !== 2)
                                return
        
                            show_thread_n_category = !show_thread_n_category
                    }

                    return client.edit(m, null, [await pages[page][0](show_thread_n_category)], [await pages[0][1]()])
                })

                setTimeout(async () => {
                    m.reactions.removeAll()
                    return collector.stop()
                }, 120 * 1000)
            })
        
        interaction.reply({ embeds: [await pages[0][0]()], files: [pages[0][1]()] }).then(async m => {
            m = await interaction.fetchReply()
            await m.react('◀️')
            await m.react('▶️')
            await m.react('🔀')

            const collector = m.createReactionCollector({ filter: (reaction, user) =>
                (user.id === message.author.id && !user.bot)}
            ).on('collect', async (reaction, user) => {
                m.reactions.cache.get(reaction.emoji.name).users.remove(user.id)

                switch(reaction.emoji.name) {
                    case '◀️':
                        if (page === 0)
                            return

                        page--
                        break
                    case '▶️':
                        if (page === pages.length - 1)
                            return

                        page++
                        break
                    case '🔀':
                        if (page !== 2)
                            return
    
                        show_thread_n_category = !show_thread_n_category
                }

                return client.edit(m, null, [await pages[page][0](show_thread_n_category)], [await pages[0][1]()])
            })

            setTimeout(async () => {
                m.reactions.removeAll()
                return collector.stop()
            }, 120 * 1000)
        })
    }
}