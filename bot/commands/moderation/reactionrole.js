'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'reactionrole',
    aliases: ['rr'],
    usage: '=reactionrole message/=embed formated txt file',
    description: 'Bind reaction roles to an existing message or send a new one. Accepts =embed formatting.\nTo bind to an existing message simply input the channel mention/id as the first argument and the message id as the second.\nTo construct a new one either type a normal message or an =embed formatted file.',
    permissions: ['MANAGE_MESSAGES', 'MANAGE_ROLES'],
    permissionsBOT: ['MANAGE_ROLES', 'EMBED_LINKS', 'ADD_REACTIONS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (!message.attachments.size > 0 && !args[0])
            return new client.class.error('No arguments provided!', interaction ?? message)
        if (message.attachments.size > 0 && args[0])
            return new client.class.error('Too many arguments provided!', interaction ?? message)

        let info = {
            id: '',
            channel: '',
            emojis: [],
            roles: []
        }

        let text = null
        let embed = null

        let flag = false


        // Fast case, channel and message link already present.
        if (args.length === 2) {
            const channel = client.channels.cache.get(client.utils.nums(args[0]))
            const msg = await channel.messages.fetch(client.utils.nums(args[1])).catch(() => {})??null

            if (channel && msg) {
                info.id = msg.id
                info.channel = channel.id

                client.send(message.channel, null, [{
                    color: client.data.embedColor,
                    description: 'List the roles you want to appear by **mention** or **id** **`(in order)`**'
                }])

                return message.channel.awaitMessages({ filter: m => m.author.id === message.author.id,
                    max: 1,
                    time: 300000,
                    errors: ['time']
                }).then(c => {
                    for (const item of client.utils.cleanup(c.first().content.split(' '))) {
                        let i = message.guild.roles.cache.find(role => role.id === client.utils.nums(item))

                        if (!i)
                            return new client.class.error(`Role: [${item}] is invalid!`, message)
                        if (i.managed)
                            return new client.class.error(`Role: [${item}] cannot be added as it's managed another service!`, message)
                        if (i.position > message.guild.me.roles.highest.position)
                            return new client.class.error(`Role: [${item}] is above Relaxy's highest role!`, message)

                        info.roles.push(client.utils.nums(item))
                    }

                    client.send(message.channel, null, [{
                        color: client.data.embedColor,
                        description: '**All roles valid!**\n**Please now type the corresponding emojis (in order)!**'
                    }])

                    return message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, 
                        max: 1,
                        time: 300000,
                        errors: ['time']
                    }).then(async c => {
                        const message_received = c.first()

                        if (client.utils.cleanup(message_received.content.split(' ')).length !== info.roles.length)
                            info.roles.slice(0, client.utils.cleanup(message_received.content.split(' ')).length - 1)
                        
                        try {
                            if (client.utils.isValidEmoji(message_received.content, message).length !== client.utils.cleanup(message_received.content.split(' ')).length)
                                return new client.class.error('One or more of the emojis is invalid!', interaction ?? message)
                        } catch{
                            return new client.class.error('One or more of the emojis is invalid!', interaction ?? message)
                        }

                        info.emojis = client.utils.isValidEmoji(message_received.content, message)

                        guild.reaction_role_messages.push(info)
                        client.save(guild.id, { to_change: 'reaction_role_messages', value: guild.reaction_role_messages })
                        client.core.ReactionRoles(msg, guild, 1)

                        return new client.class.error('Reaction roles applied, everything set!', interaction ?? message)
                    })
                })
            }
        }
        
        let attachment = message.attachments.first()

        // File form.
        if (message.attachments.size > 0 && attachment?.contentType.includes('text')) {
            embed = new client.class.customEmbed(client)

            try {
                await embed.createFromFile(message)
            } catch {}

            if (embed.data === undefined || embed.data === null)
                return new client.class.error('The data you provided is invalid!', interaction ?? message)

            client.send(message.channel, null, [{
                color: client.data.embedColor,
                description: 'Do you want text above the embed? It will not show any text if you reply with **`no`**.'
            }])

            await message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, 
                max: 1,
                time: 300000,
                errors: ['time']
            }).then(c => {
                const message_received = c.first()

                if (!message_received.content) {
                    flag = true
                    return new client.class.error('Invalid response!', interaction ?? message)
                }

                let a = message_received.content.toLowerCase()

                if (a !== 'no' && a !== '`no`' && a !== '**`no`**')
                    return text = a
            })

            if (flag) 
                return

            new client.class.error('To which channel you want to sent this reaction role message?', message)

            return await message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, 
                max: 1,
                time: 300000,
                errors: ['time']
            }).then(c => {
                const message_received = c.first()

                if (!message_received.content)
                    return new client.class.error('No text provided!', interaction ?? message)

                const channel = client.utils.channel(message_received, message_received.content.split(' '), 0)

                if (!channel)
                    return new client.class.error('Invalid channel!', interaction ?? message)

                if (guild.plugins.restricted_channels.includes(channel.id) && !client.utils.isExempt(guild, message))
                    return new client.class.error('Cannot use that channel as it\'s restricted!', interaction ?? message)

                info.channel = channel.id

                return client.send(channel, text, embed ? [embed.data] : null).then(async msg => {
                    info.id = msg.id

                    client.send(message.channel, null, [{
                        color: client.data.embedColor,
                        description: 'List the roles you want to appear by **mention** or **id** **`(in order)`**'
                    }])

                    await message.channel.awaitMessages({ filter: m => m.author.id === message.author.id,
                        max: 1,
                        time: 300000,
                        errors: ['time']
                    }).then(c => {
                        for (const item of client.utils.cleanup(c.first().content.split(' '))) {
                            let i = message.guild.roles.cache.find(role => role.id === client.utils.nums(item))

                            if (!i)
                                return new client.class.error(`Role: [${item}] is invalid!`, message)
                            if (i.managed)
                                return new client.class.error(`Role: [${item}] cannot be added as it's managed another service!`, message)
                            if (i.position > message.guild.me.roles.highest.position)
                                return new client.class.error(`Role: [${item}] is above Relaxy's highest role!`, message)

                            info.roles.push(client.utils.nums(item))
                        }

                        client.send(message.channel, null, [{
                            color: client.data.embedColor,
                            description: '**All roles valid!**\n**Please now type the corresponding emojis (in order)!**'
                        }])

                        message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, 
                            max: 1,
                            time: 300000,
                            errors: ['time']
                        }).then(async c => {
                            const message_received = c.first()

                            if (client.utils.cleanup(message_received.content.split(' ')).length !== info.roles.length)
                                info.roles.slice(0, client.utils.cleanup(message_received.content.split(' ')).length - 1)
                            
                            try {
                                if (client.utils.isValidEmoji(message_received.content, message).length !== client.utils.cleanup(message_received.content.split(' ')).length)
                                    return new client.class.error('One or more of the emojis is invalid!', interaction ?? message)
                            } catch{
                                return new client.class.error('One or more of the emojis is invalid!', interaction ?? message)
                            }

                            info.emojis = client.utils.isValidEmoji(message_received.content, message)

                            guild.reaction_role_messages.push(info)
                            client.save(guild.id, { to_change: 'reaction_role_messages', value: guild.reaction_role_messages })
                            client.core.ReactionRoles(msg, guild, 1)

                            return new client.class.error('Reaction roles applied, everything set!', interaction ?? message)
                        })
                    })
                }).catch(() => {
                    return new client.class.error('An error occured while sending the message!', interaction ?? message)
                })
            })
        }


        // Text form
        new client.class.error('To which channel you want to sent this reaction role message?', message)

        return message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, 
            max: 1,
            time: 300000,
            errors: ['time']
        }).then(c => {
            const message_received = c.first()

            if (!message_received.content)
                return new client.class.error('No text provided!', interaction ?? message)

            let channel = client.utils.channel(message_received, message_received.content.split(' '), 0)
            
            if (!channel)
                return new client.class.error('Invalid channel!', interaction ?? message)

            if (guild.plugins.restricted_channels.includes(channel.id) && !client.utils.isExempt(guild, message))
                return new client.class.error('Cannot use that channel as it\'s restricted!', interaction ?? message)

            info.channel = channel.id
    
            return client.send(channel, args.join(' ')??null, null, attachment ? [attachment] : null).then(async msg => {
                info.id = msg.id

                client.send(message.channel, null, [{
                    color: client.data.embedColor,
                    description: 'List the roles you want to appear by **mention** or **id** **`(in order)`**'
                }])

                return message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, 
                    max: 1,
                    time: 300000,
                    errors: ['time']
                }).then(c => {
                    for (const item of client.utils.cleanup(c.first().content.split(' '))) {
                        let i = message.guild.roles.cache.find(role => role.id === client.utils.nums(item))

                        if (!i)
                            return new client.class.error(`Role: [${item}] is invalid!`, message)
                        if (i.managed)
                            return new client.class.error(`Role: [${item}] cannot be added as it's managed another service!`, message)
                        if (i.position > message.guild.me.roles.highest.position)
                            return new client.class.error(`Role: [${item}] is above Relaxy's highest role!`, message)

                        info.roles.push(client.utils.nums(item))
                    }

                    client.send(message.channel, null, [{
                        color: client.data.embedColor,
                        description: '**All roles valid!**\n**Please now type the corresponding emojis (in order)!**'
                    }])

                    return message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, 
                        max: 1,
                        time: 300000,
                        errors: ['time']
                    }).then(async c => {

                        const message_received = c.first()

                        if (client.utils.cleanup(message_received.content.split(' ')).length !== info.roles.length)
                            return new client.class.error('Number of emojis doesn\'t match number of roles!', interaction ?? message)

                        try {
                            if (client.utils.isValidEmoji(message_received.content, message).length !== client.utils.cleanup(message_received.content.split(' ')).length)
                                return new client.class.error('One or more of the emojis is invalid!', interaction ?? message)
                        } catch {
                            return new client.class.error('One or more of the emojis is invalid!', interaction ?? message)
                        }

                        info.emojis = client.utils.isValidEmoji(message_received.content, message)

                        guild.reaction_role_messages.push(info)
                        client.save(guild.id, { to_change: 'reaction_role_messages', value: guild.reaction_role_messages })
                        client.core.ReactionRoles(msg, guild, 1)

                        return new client.class.error('Reaction roles applied, everything set!', interaction ?? message)
                    })
                })
            }).catch(() => {
                return new client.class.error('An error occured while sending the message!', interaction ?? message)
            })
        })
    }
}