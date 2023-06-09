'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'redirect',
    permissions: ['MANAGE_GUILD'],
    aliases: ['switch'],
    usage: '=redirect option channel',
    description: 'Redirect a Relaxy! function to a given channel.\nF.e **=redirect leveling #bot-actions**\nAvailable redirectors:\n- leveling\n- modlog\n- heart_board\n- censoring\n- achievements\n- welcomes\n- leaves\n- forum (special: =redirect forum #(current forum channel) #(new forum channel)' ,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        if (!args[0])
            return new client.class.error('One of the options is missing!', interaction ?? message)

        let channel = client.utils.channel(message, args, 1)

        if (!channel) 
            return new client.class.error('No channel given!', interaction ?? message)

        if (![Discord.ChannelType.GuildText, Discord.ChannelType.GuildAnnouncement].includes(channel.type) || (args[0].toLowerCase() === 'forum' && channel.type !== Discord.ChannelType.GuildForum))
            return new client.class.error('Invalid channel given!', interaction ?? message)

        if (args[0].toLowerCase() === 'forum' && !guild.forum.enabled)
            return new client.class.error('This feature of Relaxy! is not currently enabled on this server!', interaction ?? message)
        else if (['welcomes', 'leaves'].includes(args[0].toLowerCase()) && guild.welcome_channel[`channel${args[0].toUpperCase().slice(0, -1)}`].enabled)
            return new client.class.error('This feature of Relaxy! is not currently enabled on this server!', interaction ?? message)

        if (guild.plugins.restricted_channels.includes(channel.id) && !client.utils.isExempt(guild, message))
            return new client.class.error('This channel is restricted from normal users!', interaction ?? message)

        switch (args[0].toLowerCase()) {
            case 'achievements':
                if (!channel) {
                    client.save(guild.id, { to_change: 'achievements.channel', value: '' })
                    return new client.class.error('Achievements messages will now be redirected to the channel where the person gained them.', interaction ?? message)
                }

                client.save(guild.id, { to_change: 'achievements.channel', value: channel.id })

                return new client.class.error(`Achievements messages will now be redirected to ${channel.name}`, interaction ?? message)
            case 'leveling':
                if (!guild.plugins.leveling.enabled)
                    return new client.class.error('This feature of Relaxy! is not currently enabled on this server!', interaction ?? message)

                client.save(guild.id, { to_change: 'plugins.leveling.channel', value: channel.id })

                return new client.class.error(`Level up messages will now be redirected to ${channel.name}`, interaction ?? message)
            case 'modlog':
                if (!guild.plugins.modlog.enabled)
                    return new client.class.error('This feature of Relaxy! is not currently enabled on this server!', interaction ?? message)

                    let changed_events = {}

                    for (const key of Object.keys(client.data.modlogEvents))
                        changed_events[key] = {
                            enabled: true,
                            channel: channel.id
                        }

                    client.save(guild.id, {
                        to_change: 'plugins.modlog',
                        value: {
                            enabled: true,
                            events: changed_events
                        }
                    })

                return new client.class.error(`Mod logs will now be redirected to ${channel.name}`, interaction ?? message)
            case 'censoring':
                if (!guild.plugins.censoring.enabled)
                    return new client.class.error('This feature of Relaxy! is not currently enabled on this server!', interaction ?? message)

                client.save(guild.id, { to_change: 'plugins.censoring.channel', value: channel.id })

                return new client.class.error(`Censoring messages will now be redirected to ${channel.name}`, interaction ?? message)
            case 'welcomes':
                if (!guild.welcome_channel.enabled)
                    return new client.class.error('This feature of Relaxy! is not currently enabled on this server!', interaction ?? message)

                client.save(guild.id, { to_change: 'welcome_channel.channelWELCOME', value: channel.id })

                return new client.class.error(`Welcome messages will now be redirected to ${channel.name}`, interaction ?? message)
            case 'leaves':
                if (!guild.welcome_channel.enabled)
                    return new client.class.error('This feature of Relaxy! is not currently enabled on this server!', interaction ?? message)

                client.save(guild.id, { to_change: 'welcome_channel.channelLEAVE', value: channel.id })

                return new client.class.error(`Leave messages will now be redirected to ${channel.name}`, interaction ?? message)
            case 'heart_board':
                if (!guild.plugins.heart_board.enabled)
                    return new client.class.error('This feature of Relaxy! is not currently enabled on this server!', interaction ?? message)

                client.save(guild.id, { to_change: 'plugins.heart_board.channel_id', value: channel.id })

                return new client.class.error(`Heart board posts will now be redirected to ${channel.name}`, interaction ?? message)
            case 'forum': 
                if (!guild.forum.enabled)
                    return new client.class.error('Relaxy forums not enabled on this server!', interaction ?? message)

                let channel2 = client.utils.channel(message, args, 2)

                if (!channel2) {
                    return new client.class.error('Channel does not exist', interaction ?? message)
                }

                if (!channel2.type === Discord.ChannelType.GuildForum)
                    return new client.class.error('Channel requested is not a forum!', message)

                let fc = await client.module.database.findForumChannel(channel.id, guild.id)

                if (!fc)
                    return new client.class.error('Channel does not exist', interaction ?? message)

                let fcs = await client.module.database.findForumChannels(guild.id)

                let _a = fcs.length
                for (let i = 0; i < _a; i++)
                    if (fcs[i].id === channel2.id) 
                        return new client.class.error('Channel already has forum settings applied.', interaction ?? message)

                fc.id = channel2.id
                fc.markModified('id')
                await fc.save()

                return new client.class.error(`Forum settings applied to ${channel2.name}!`, message)
            default:
                return new client.class.error('Invalid option given!', interaction ?? message)
        }
    }
}