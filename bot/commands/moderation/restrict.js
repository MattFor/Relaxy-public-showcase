'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'restrict',
    aliases: ['lock'],
    usage: '=restrict channels',
    permissions: ['MANAGE_CHANNELS'],
    description: 'Turn off Relaxy in a desired channel.\nType bind as a first arguemnt to make Relaxy only usable in the channel the command was called in or input a channel after bind to set it to that one.\nType unbind to completely clear all restricted channels.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let restricted = guild.plugins.restricted_channels

        let embed = {
            color: client.data.embedColor,
            title: 'Restricted channels:',
            description: '',
            fields: []
        }

        let added = []
        let removed = []

        if (args.length === 0) {
            let embed = {
                color: client.data.embedColor,
                title: 'Restricted channels:',
                description: '',
                fields: []
            }

            embed = client.utils.createDescription(`${restricted.map(c => { return client.channels.cache.get(c) }).join(', ') || 'None'}.`, embed)

            return client.send(message.channel, null, [embed])
        }

        switch(args[0].toLowerCase()) {
            case 'unbind': 
            {
                client.save(guild.id, { to_change: 'plugins.restricted_channels', value: [] })

                return client.send(message.channel, null, [{
                    color: client.data.embedColor,
                    title: 'Restricted channels:',
                    description: 'None.'
                }])
            }
            case 'bind': 
            {
                let channel = client.utils.channel(message, args, 1)

                if (channel && channel.type !== Discord.ChannelType.GuildText && channel.type !== Discord.ChannelType.GuildAnnouncement)
                    return new client.class.error('Invalid channel type!', interaction ?? message)
                else if (message.channel.type !== Discord.ChannelType.GuildText && message.channel.type !== Discord.ChannelType.GuildAnnouncement)
                    return new client.class.error('Invalid channel type!', interaction ?? message)

                message.guild.channels.cache.forEach(c => {
                    if (c.type !== Discord.ChannelType.GuildCategory && c.type !== Discord.ChannelType.PublicThread && c.type !== Discord.ChannelType.PrivateThread && c.type !== Discord.ChannelType.GuildForum && channel && c.id != channel.id)
                        return restricted.includes(c.id) ? restricted.slice(restricted.indexOf(c.id), 1) : restricted.push(c.id)

                    if (c.type !== Discord.ChannelType.GuildCategory && c.type !== Discord.ChannelType.PublicThread && c.type !== Discord.ChannelType.PrivateThread && c.type !== Discord.ChannelType.GuildForum && c.id !== message.channel.id)
                        return restricted.includes(c.id) ? restricted.slice(restricted.indexOf(c.id), 1) : restricted.push(c.id)
                })

                client.save(guild.id, { to_change: 'plugins.restricted_channels', value: restricted })

                return client.send(message.channel, null, [{
                    color: client.data.embedColor,
                    description: `Relaxy is now bound to **${channel ? channel : message.channel}**`
                }])
            }
        }

        let exemption_flag = client.utils.isExempt(guild, message)

        let arg_len = args.length
        for (let i = 0; i < arg_len; i++) {
            let channel = client.utils.channel(message, args, i)

            if (!channel)
                return new client.class.error(`Channel ${i + 1} doesn't exist`, interaction ?? message)

            if (channel.type !== Discord.ChannelType.GuildText && channel.type !== Discord.ChannelType.GuildAnnouncement && !exemption_flag)
                return new client.class.error(`Invalid channel type at ${i + 1}!`, interaction ?? message)

            if (restricted.includes(channel.id)) {
                removed.push(channel.id) 
                restricted.splice(restricted.indexOf(channel.id), 1)
                continue
            }

            restricted.push(channel.id)
            added.push(channel.id)
        }

        client.save(guild.id, { to_change: 'plugins.restricted_channels', value: restricted })

        if (added.length > 0)
            embed.fields.push({ name: 'Added:', value: `${added.map(cid => { return client.channels.cache.get(cid) }).join(', ')}.` })

        if (removed.length > 0)
            embed.fields.push({ name: 'Removed:', value: `${removed.map(cid => { return client.channels.cache.get(cid) }).join(', ')}.` })

        embed.description = `${restricted.map(c => { return client.channels.cache.get(c) }).join(', ') || 'None'}.`.slice(0, 2048)

        return client.send(message.channel, null, [embed])
    }
}