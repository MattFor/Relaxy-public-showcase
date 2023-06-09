'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'
import fixer from 'dirty-json'
import fs from 'fs'


let i = JSON.parse(fs.readFileSync('./bot/configuration/key.ini').toString())
const map = `${i.text.wmTypes.map((w, i) => {
    return `\`${i+1}\` - **${w}**,`
}).join('\n').slice(0, -1)}.`


export default {
    name: 'welcomechannel',
    aliases: ['wcl', 'entrance'],
    permissions: ['MANAGE_GUILD'],
    usage: '=welcomechannel type (required)  (welcome/leave message (optional))',
    description: `Adds a channel where Relaxy! will welcome/goodbye people who join/leave your server. **(use the command if the channel is active to remove it)**\nIf you want to customize the welcome message/leaver message then type which one you wanna customize after the type selected. f.e:\n**=welcomechannel {type} welcomer Hi, welcome to |G|, hope you have a great time here.**\nShould you want the message to be an embed, use **\`=customizewelcome\`**.\nXXXX${map}\nWhen enabled, type \'show\' as the only argument to see how it looks.`,
    cooldown: 5,
    permissionsBOT: ['MANAGE_CHANNELS', 'ATTACH_FILES', 'EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (guild.welcome_channel.enabled) {
            if (args[0]?.toLowerCase() === 'show') {
                let member = message.member

                // Welcomer section
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
                        welcome_encode[1] = welcome_encode[1].replaceAll("|U|", member)
                    } catch {}

                    try {
                        welcome_encode[1] = welcome_encode[1].replaceAll("|G|", member.guild.name)
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
                    welcome_encode[0] = ''
                }

                // Leave section
                let leave_card = null
                let leave_attachment = null

                let leave_encode = guild.welcome_channel.messageLEAVE.split('[SPLIT_FLAG]')

                if (leave_encode[0] === 'NULL(0)')
                    leave_encode[0] = ''

                if (leave_encode[1]) {
                    try {
                        leave_encode[1] = leave_encode[1].replaceAll('botver', client.config.keys.version)
                    } catch {}
                    try {
                        leave_encode[1] = leave_encode[1].replaceAll("'U'", member)
                    } catch {}
                    try {
                        leave_encode[1] = leave_encode[1].replaceAll("'G'", member.guild.name)
                    } catch {}
                    try {
                        leave_encode[1] = fixer.parse(leave_encode[1])
                    } catch {}
                    if (JSON.stringify(leave_encode[1]).includes('timestamp'))
                        leave_encode[1].timestamp = new Date()
                } 

                if ([5, 6, 7, 8, 9, 11, 13].includes(Number(guild.welcome_channel.type))) {
                    leave_card = new client.imports.canvacord.Leaver()
                        .setColor('#FF69B4')
                        .setGuildName(member.guild.name)
                        .setMemberCount(member.guild.members.cache.size + 1)
                        .setUsername(client.utils.norm(member.user.username))
                        .setDiscriminator(member.user.tag.slice(-4))
                        .setAvatar(member.displayAvatarURL({ extension: 'png', size: 4096 }))

                    leave_card.colorTitle = '#FF69B4'
                    leave_card.textMessage = guild.welcome_channel.bottomLEAVE
                    leave_card.textTitle = guild.welcome_channel.topLEAVE
                    await leave_card.build().then((data) => {
                        if (leave_encode[1])
                            leave_attachment = data
                        else leave_attachment = new Discord.AttachmentBuilder(data, { name: 'leave.png' })
                    })
                    if (leave_encode[1]) {
                        leave_encode[1].files = [{
                            attachment: leave_attachment,
                            name: 'leave.png'
                        }]
                        leave_encode[1].image = { url: 'attachment://leave.png' }
                    }
                }

                if ([1, 3, 7, 8, 10, 11, 12].includes(Number(guild.welcome_channel.type))) {
                    if (leave_encode[0])
                        leave_encode[0] = leave_encode[0].replace('|U|', member).replace('|G|', member.guild.name)
                } else {
                    leave_encode[0] = ''
                }

                return client.send(message.channel, null, [{
                    color: client.data.embedColor,
                    title: 'Welcome / Leave card texts:',
                    fields: [{
                        name: 'Welcomer card:', value: welcome_encode[0] ?? 'None.'
                    }, {
                        name: 'Leaver card:', value: leave_encode[0] ?? 'None.'
                    }]
                }], !(welcome_attachment && leave_attachment) ? null : [welcome_attachment ?? null, leave_attachment ?? null])
            }

            if (!args[0]) {
                client.save(guild.id, { to_change: 'welcome_channel', value: {
                    type: 0,
                    enabled: false,
                    messageWELCOME: 'Hi |U|, welcome to |G|!',
                    messageLEAVE: 'Bye bye |U|, hope you\'ve had a great time here!',
                    topWELCOME: 'Welcome!',
                    topLEAVE: 'Goodbye!',
                    bottomWELCOME: 'Glad to see you here!',
                    bottomLEAVE: 'Farwell friend!',
                    channelWELCOME: '',
                    channelLEAVE: ''
                }})

                return new client.class.error('Feature disabled on the server!', interaction ?? message)
            }

            if (args[0] && !args[1]) {
                let type = client.utils.nums(args[0])

                if (isNaN(type) || (type > 16 || type < 1))
                    return new client.class.error('Invalid type/type is too large/low.', interaction ?? message)    

                client.save(guild.id, { to_change: 'welcome_channel.type', value: type })

                return new client.class.error(`Setting welcome channel type ${type}. Showing ${client.config.text.wmTypes[type - 1]}`, message)
            }

            let type = client.utils.nums(args[0])

            if (!isNaN(type) && (type > 16 || type < 1))
                return new client.class.error('Invalid type/type is too large/low.', interaction ?? message)    

            args.shift()
            let w = args.shift()
            let msg = args.join(' ')

            switch (w) {
                case 'welcome':
                    client.save(guild.id, { to_change: 'welcome_channel.messageWELCOME', value: msg })
                    break
                case 'leave':
                    client.save(guild.id, { to_change: 'welcome_channel.messageLEAVE', value: msg })
                    break
                default:
                    return new client.class.error('Invalid option specifier. Use welcomer/leaver.', interaction ?? message)
            }

            client.save(guild.id, { to_change: 'welcome_channel.type', value: type })

            new client.class.error(`Setting welcome channel type ${type}. Showing ${client.config.text.wmTypes[type - 1]}`, message)
            return new client.class.error('New message set!', interaction ?? message)
        } 

        if (args[0]?.toLowerCase() === 'show') 
            return new client.class.error('Not yet set!', message)

        let type = Number(client.utils.nums(args.shift()))

        if (isNaN(type) || (type > 16 || type < 1)) {
            new client.class.error('Invalid / no type present setting default - 7.', interaction ?? message)
            type = 7
        }

        if (args[0]) {
            let i = args.shift()

            if (!args[0])
                return new client.class.error('No message given!', interaction ?? message)

            let msg = args.join(' ')

            switch (i) {
                case 'welcome':
                    client.save(guild.id, { to_change: 'welcome_channel.messageWELCOME', value: msg })
                    break
                case 'leave':
                    client.save(guild.id, { to_change: 'welcome_channel.messageLEAVE', value: msg })
                    break
                default:
                    return new client.class.error('Invalid option specifier. Use welcomer/leaver.', interaction ?? message)
            }
        }

        if (!isNaN(type))
            client.save(guild.id, { to_change: 'welcome_channel.type', value: type })
        else
            client.save(guild.id, { to_change: 'welcome_channel.type', value: 1 })

        return message.guild.channels.create({ 
            name: 'entrance', 
            type: client.imports.discord.ChannelType.GuildText,
        }).then(async(channel) => {
            channel.setTopic('A channel for welcomers!')

            if ([1, 2, 3, 7, 8, 9, 10, 11, 12 ,13].includes(type))
            {
                client.save(guild.id, { to_change: 'welcome_channel.channelWELCOME', value: channel.id })
            }

            if ([4, 5, 6, 7, 8, 9 , 10, 11, 12, 13].includes(type))
            {
                client.save(guild.id, { to_change: 'welcome_channel.channelLEAVE', value: channel.id })
            }

            client.save(guild.id, { to_change: 'welcome_channel.enabled', value: true })

            return new client.class.error(`Setting welcome channel type ${type}. Showing ${client.config.text.wmTypes[type - 1]}`, message)
        })
    }
}