'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'welcomemessage',
    aliases: ['wm'],
    permissions: ['MANAGE_CHANNELS', 'MANAGE_GUILD', 'EMBED_LINKS', 'MANAGE_MESSAGES'],
    permissionsBOT: ['MANAGE_CHANNELS', 'EMBED_LINKS', 'MANAGE_MESSAGES'],
    usage: '=welcomemessage (welcome message) / (text/embed text file)',
    description: 'Welcome message is what you want people to see once they join your server!\nRecommended stuff to put there is: rules, restriction and.. other important stuff.\nRelaxy is going to create a channel for you where it shows the message.\nUnder your welcome message Relaxy! is going to post its status so you can see if it ever goes offline.\n\nTo edit the currently existing welcome message on the server, type =wm only.\nYou can also use an embed if you format it in **`=embed`** style, it only accepts text files as embeds can get pretty big!\nIf the embed doesn\'t work, check if any of the embed fields or the message itself isn\'t longer than 1950 characters!',
    cooldown: 20,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (guild.plugins.welcome_message.enabled && !args[0] && !message.attachments.size > 0) {
            client.save(guild.id, {
                to_change: 'plugins.welcome_message',
                value: {
                    enabled: false,
                    wmessage: '',
                    wmessage_id: '',
                    wmessage_channel: '',
                    status_message_id: '',
                    roles: false,
                    role_emojis: [],
                    role_roles: []
                }
            })

            return new client.class.error(`Welcome message deleted!`, interaction ?? message)
        }

        if (!guild.plugins.welcome_message.enabled && !args[0] && message.attachments.size == 0)
            return new client.class.error(`No welcome message given!`, interaction ?? message)

        if (guild.plugins.welcome_message.enabled && (message.attachments.size > 0 || args[0])) {
            if (message.attachments.size > 0) {
                let embed = new client.class.customEmbed(client)

                try {
                    await embed.createFromFile(message)
                } catch {}

                if (embed.data === undefined || embed.data === null) 
                    return new client.class.error('The data you provided is invalid!', interaction ?? message)

                client.send(message.channel, null, [{ 
                    color: client.data.embedColor, 
                    description: 'Do you want text above the embed? It will not show any text if you reply with **`no`**.' 
                }])

                let error_flag = false
                let above_embed_text = ""

                await message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, max: 1, time: 300000, errors: ['time'] })
                    .then(c => {
                        const message_received = c.first()

                        if (!message_received.content) {
                            flag = true
                            return new client.class.error('Invalid response!', interaction ?? message)
                        }

                        let a = message_received.content.toLowerCase()

                        if (a !== 'no' && a !== '`no`' && a !== '**`no`**')
                            return above_embed_text = a
                    })

                if (error_flag) 
                    return

                client.save(guild.id, { to_change: 'plugins.welcome_message.wmessage', value: `${above_embed_text}NULL(0)[SPLIT_FLAG]${JSON.stringify(embed.data)}` })

                return new client.class.error('Welcome message modified!', interaction ?? message)
            }

            if (args.join(' ').length > 1950)
                return new client.class.error('Welcome message is too long! (maximum 1950 characters)', interaction ?? message)

            client.save(guild.id, { to_change: 'plugins.welcome_message.wmessage', value: args.join(' ') })

            return new client.class.error('Welcome message modified!', interaction ?? message)
        }

        if (message.attachments.size > 0 && !args[0]) {
            let embed = new client.class.customEmbed(client)

            try {
                await embed.createFromFile(message)
            } catch {}

            if (embed.data === undefined || embed.data === null) 
                return new client.class.error('The data you provided is invalid!', interaction ?? message)

            client.send(message.channel, null, [{ 
                color: client.data.embedColor, 
                description: 'Do you want text above the embed? It will not show any text if you reply with **`no`**.' 
            }])

            let error_flag = false
            let above_embed_text = ''
            
            await message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, max: 1, time: 300000, errors: ['time'] })
                .then(c => {
                    const message_received = c.first()

                    if (!message_received.content) {
                        flag = true
                        return new client.class.error('Invalid response!', interaction ?? message)
                    }

                    let a = message_received.content.toLowerCase()

                    if (a !== 'no' && a !== '`no`' && a !== '**`no`**')
                        return above_embed_text = a
                })

            if (error_flag) 
                return

            client.send(message.channel, null, [{
                color: client.data.embedColor,
                author: { name: `Welcome message consisting of ${`${above_embed_text.length > 0 ? above_embed_text : 'NULL(0)'}[SPLIT_FLAG]${JSON.stringify(embed.data)}`.length} characters constructed!` },
                description: `The message is saved internally, should you delete it, Relaxy will clear the channel and resend the message again.\n(Reaction roles optional, activate with =wmreact)`
            }])

            client.save(guild.id, { to_change: 'plugins.welcome_message.wmessage', value: `${above_embed_text.length > 0 ? above_embed_text : 'NULL(0)'}[SPLIT_FLAG]${JSON.stringify(embed.data)}` }, { to_change: 'plugins.welcome_message.enabled', value: true })

            return message.guild.channels.create({ 
                name: 'important-stuff',
                type: Discord.ChannelType.GuildText,
            }).then(async(channel) => {
                client.save(guild.id, { to_change: 'plugins.welcome_message.wmessage_channel', value: channel.id })
                channel.setTopic(`Welcome to ${client.utils.firstLetterUp(message.guild.name)}, read the rules and have fun!`)

                client.send(channel, above_embed_text??null, [embed.data]).then(async(msg) => {
                    client.save(guild.id, { to_change: 'plugins.welcome_message.wmessage_id', value: msg.id })
                })

                return client.send(channel, null, [{
                    color: client.data.embedColor,
                    description: client.config.text.wmStatus,
                }]).then(async(msg) => {
                    client.module.profiles.Achievement(message, 'setwelcome', guild)

                    return client.save(guild.id, { to_change: 'plugins.welcome_message.status_message_id', value: msg.id })
                })
            })
        }

        if (args.join(' ').length > 1950)
            return new client.class.error('Welcome message is too long! (maximum 1950 characters)', interaction ?? message)

        client.send(message.channel, null, [{
            color: client.data.embedColor,
            author: { name: `Welcome message consisting of ${args.join(' ').length} characters constructed!` },
            description: `The message is saved internally, should you delete it, Relaxy will clear the channel and resend the message again.\n(Reaction roles optional, activate with =wmreact)`
        }])

        client.save(guild.id, { to_change: 'plugins.welcome_message.wmessage', value: args.join(' ') }, { to_change: 'plugins.welcome_message.enabled', value: true })

        return message.guild.channels.create({ 
            name: 'important-stuff',
            type: Discord.ChannelType.GuildText,
        }).then(async(channel) => {
            client.save(guild.id, { to_change: 'plugins.welcome_message.wmessage_channel', value: channel.id })
            channel.setTopic(`Welcome to ${client.utils.firstLetterUp(message.guild.name)}, read the rules and have fun!`)

            channel.send(args.join(' ')).then(async(msg) => {
                client.save(guild.id, { to_change: 'plugins.welcome_message.wmessage_id', value: msg.id })
            })

            return client.send(channel, null, [{
                color: client.data.embedColor,
                description: client.config.text.wmStatus,
            }]).then(async(msg) => {
                client.module.profiles.Achievement(message, 'setwelcome', guild)

                return client.save(guild.id, { to_change: 'plugins.welcome_message.status_message_id', value: msg.id })
            })
        })
    }
}