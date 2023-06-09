'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'leaderboard',
    cooldown: 4,
    aliases: ['lb'],
    usage: '=leaderboard',
    description: 'React with 🔠 to show the top 15 people message count wise (since Relaxy joined the server),\n react with 🔢 to show the top 15 people level wise.\nReact with ⏹️ to return to the main page.',
    permissionsBOT: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let guildMembers = await client.module.database.findGuildMembers(message.guild.id)
        let User = await client.module.database.Member(message.author.id, guild.id)

        if (!guild.plugins.leveling.enabled)
            return new client.class.error('Leveling is disabled on this server!', interaction ?? message)
        
        let page = 1
        let last_pressed = ''

        let member_level_list = []
        let member_message_list = []
        const member_len = guildMembers.length

        for (let i = 0; i < member_len; i++) {
            member_level_list.push(`${guildMembers[i].level}.${guildMembers[i].id}`)
            member_message_list.push(`${guildMembers[i].messages}.${guildMembers[i].id}`)
        }
        
        member_level_list = client.utils.radix(member_level_list)
        member_message_list = client.utils.radix(member_message_list)

        client.send(message.channel, null, [{
            color: client.data.embedColor,
            title: `🔠 ***- leaderboard for number of messages sent***\n🔢 ***- leaderboard for guild levels***\n⏹️ ***- main page***\n\nYour level spot: **\`[${member_level_list.indexOf(`${User.level}.${message.author.id}`) + 1}]\`**\nYour messages spot: **\`[${member_message_list.indexOf(`${User.messages}.${message.author.id}`) + 1}]\`**\nYou sent \`${User.messages}\` messages and your level is \`${User.level + 1}\``,
            footer: client.data.footer,
            timestamp: new Date(),
            thumbnail: {
                url: `attachment://${message.guild.id}.gif`
            },
        }], [{
            attachment: !message.guild.iconURL({
                dynamic: true,
                size: 4096
            }) ? './additions/images/server.png' : message.guild.iconURL({
                dynamic: true,
                size: 4096
            }),
            name: `${message.guild.id}.gif`
        }]).then(async m => {
            let time = 0
            let react_intervaaal = setInterval(() => {
                if (time >= client.config.emojiCollections.leaderboard || !client.config.emojiCollections.leaderboard[time]) {
                    clearInterval(react_intervaaal)
                    return react_intervaaal = null
                }

                m.react(client.config.emojiCollections.leaderboard[time])
                time++
            }, 755)

            const collector = m.createReactionCollector({ filter: (r, user) => { return user.id === message.author.id && !user.bot } })

            collector.on('collect', async(reaction, user) => {
                m.reactions.cache.get(reaction.emoji.name).users.remove(user.id)

                last_pressed = ['🔠', '🔢'].includes(reaction.emoji.name) ? reaction.emoji.name : last_pressed
                
                if (last_pressed !== reaction.emoji.name && ['🔠', '🔢'].includes(reaction.emoji.name))
                    page = 1

                switch (reaction.emoji.name) {
                    case '⏹️':
                        return client.edit(m, null, [{
                            color: client.data.embedColor,
                            title: `🔠 ***- leaderboard for number of messages sent***\n🔢 ***- leaderboard for guild levels***\n⏹️ ***- main page***\n\nYour level spot: **\`[${member_level_list.indexOf(`${User.level}.${message.author.id}`) + 1}]\`**\nYour messages spot: **\`[${member_message_list.indexOf(`${User.messages}.${message.author.id}`) + 1}]\`**\nYou sent \`${User.messages}\` messages and your level is \`${User.level + 1}\``,
                            footer: client.data.footer,
                            timestamp: new Date(),
                            thumbnail: { url: `attachment://${message.guild.id}.gif` },
                        }], [{
                            attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                            name: `${message.guild.id}.gif`
                        }])
        
                    case '🔠': {
                        page = 1

                        let list = []

                        for (let i = 15 * (page - 1); i < 15 * page; i++) {
                            let member_level_id = member_message_list[i].split('.')
                            let user = await client.module.database.User(member_level_id[1])

                            let member = message.author.id === member_level_id[1] ? message.member : (await client.getUser(member_level_id[1]))?.username??'Unavailable.'

                            if (typeof member === 'string' && member === 'Unavailable')
                                continue

                            list.push(`\`${i + 1}\`** - ${user.levelout ? 'Opted out' : member}**  [${Number(member_level_id[0]) + 1}]`)
                        }

                        return client.edit(m, null, [{
                            color: client.data.embedColor,
                            title: `Messages leaderboard for **${client.utils.firstLetterUp(message.guild.name)}**`,
                            footer: client.data.footer,
                            description: list.slice(0, 15).join('\n'),
                            timestamp: new Date(),
                            thumbnail: { url: `attachment://${message.guild.id}.gif` },
                        }], [{
                            attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                            name: `${message.guild.id}.gif`
                        }])
                    }

                    case '🔢': {
                        page = 1

                        let list = []

                        for (let i = 15 * (page - 1); i < 15 * page; i++) {
                            let member_level_id = member_level_list[i].split('.')
                            let user = await client.module.database.User(member_level_id[1])

                            if (user.levelout)
                                continue

                            let member = message.author.id === member_level_id[1] ? message.member : (await client.getUser(member_level_id[1]))?.username??'Unavailable.'

                            if (typeof member === 'string' && member === 'Unavailable')
                                continue
                            
                            list.push(`\`${i + 1}\`** - ${user.levelout ? 'Opted out' : member}**  [${Number(member_level_id[0]) + 1}]`)
                        }

                        return client.edit(m, null, [{
                            color: client.data.embedColor,
                            title: `Leveling leaderboard for **${client.utils.firstLetterUp(message.guild.name)}**`,
                            footer: client.data.footer,
                            description: list.slice(0, 15).join('\n'),
                            timestamp: new Date(),
                            thumbnail: { url: `attachment://${message.guild.id}.gif` },
                        }], [{
                            attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                            name: `${message.guild.id}.gif`
                        }])
                    }

                    case '◀️': {
                        if (page === 1 || last_pressed.length === 0)
                            return
                        
                        page--
                        break
                    } 

                    case '▶️': {
                        if (15 * (page + 1) > 100 || last_pressed.length === 0)
                            return

                        page++
                        break
                    }
                }

                if (['◀️', '▶️'].includes(reaction.emoji.name)) {
                    let list = []
                                
                    for (let i = 15 * (page - 1); i < 15 * page; i++) {
                        let member_level_id = last_pressed === '🔠' ? member_message_list[i].split('.') : member_level_list[i].split('.')
                        let user = await client.module.database.User(member_level_id[1])

                        if (user.levelout)
                            continue

                        let member = message.author.id === member_level_id[1] ? message.member : (await client.getUser(member_level_id[1]))?.username??null

                        if (!member)
                            continue
                        
                        list.push(`\`${i + 1}\`** - ${user.levelout ? 'Opted out' : member}**  [${Number(member_level_id[0]) + 1}]`)
                    }

                    return client.edit(m, null, [{
                        color: client.data.embedColor,
                        title: `${last_pressed === '🔠' ? 'Messages' : 'Leveling'} leaderboard for **${client.utils.firstLetterUp(message.guild.name)}**`,
                        footer: client.data.footer,
                        description: list.slice(0, 15).join('\n'),
                        timestamp: new Date(),
                        thumbnail: { url: `attachment://${message.guild.id}.gif` },
                    }], [{
                        attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                        name: `${message.guild.id}.gif`
                    }])
                }
            })

            setTimeout(async () => {
                m.reactions.removeAll().catch(() => {})
                return collector.stop()
            }, 120 * 1000)
        })
    }
}