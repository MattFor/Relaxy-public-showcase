'use strict'

import Discord, { NewsChannel } from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle voice channel interaction.
     * @param {Relaxy} client 
     * @param {Discord.VoiceState} oldState
     * @param {Discord.VoiceState} newState
     */
    async run(client, oldState, newState) {
        client.module.music._handleVoiceState(oldState, newState)
        
        const guild = oldState ? await client.module.database.Guild(oldState.member.guild.id) : await client.module.database.Guild(newState.member.guild.id)

        // Check if there's noone in the channel
        // If it's a valid privatechannel then revert it back to default settings
        const privateChannels = guild.privates.filter(channel => channel.id === newState?.channel?.id)??[]
        if (privateChannels.length > 0) {
            const privateChannel = privateChannels[0]
            const nonBotMembers = oldState.channel.members.filter(member => !member.user.bot)
            const emptyChannel = nonBotMembers.size === 0
            if (emptyChannel)
                oldState.channel.edit({
                    userLimit: privateChannel.person_limit,
                    bitrate: privateChannel.kbps_limit
                })
        }

        if (guild.plugins.modlog.events.voiceStateUpdate.enabled && !guild.plugins.modlog.lowspam) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.voiceStateUpdate.channel))
                return client.save(guild.id, { to_change: 'plugins.modlog.events.voiceStateUpdate.enabled', value: false })
        
            const state = client.utils.getVoiceState(oldState, newState)
            const vctime = client.imports.time(client.collections.voiceChatTimes.get(oldState.member?.user.id) ? (new Date() - client.collections.voiceChatTimes.get(oldState.member.user.id)) : 0)

            if (state === '`Joined voice channel`' || state === '`Switched voice channel`') client.collections.voiceChatTimes.set(newState.member.user.id, new Date())

            switch (state) {
                case '`Left voice channel`':
                    client.collections.voiceChatTimes.delete(newState.member.user.id)
                    client.data.modlog_posts[oldState ? oldState.guild.id : newState.guild.id].push(['voiceStateUpdate',
                        new Discord.EmbedBuilder()
                        .setColor('FF69B4')
                        .setThumbnail(oldState.member.displayAvatarURL({ dynamic: true, size: 4096 }))
                        .setTitle('**Event |** ' + `${state}`)
                        .addFields([
                            { name: 'User:', value: `${oldState.member}\n(${oldState.member.user.tag})`, inline: true },
                            { name: 'Channel:', value: oldState?.channel.toString()??'Unavailable.', inline: true },
                            { name: 'Time spent in vc:', value: `${vctime === '0ms' ? '```diff\n- Unavailable\n```' : `**\`${vctime}\`**`}`}
                        ])
                        .setFooter({ text: 'Event emitted', iconURL: client.config.text.links.relaxyImage })
                        .setTimestamp()])
                    break
                    case '`Switched voice channel`':
                    client.data.modlog_posts[oldState ? oldState.guild.id : newState.guild.id].push(['voiceStateUpdate',
                            new Discord.EmbedBuilder()
                        .setColor('FF69B4')
                        .setThumbnail(oldState.member.displayAvatarURL({ dynamic: true, size: 4096 }))
                        .setTitle('**Event |** ' + `${state}`)
                        .addFields([
                            { name: 'User:', value: `${oldState.member}\n(${oldState.member.user.tag})`, inline: true },
                            { name: 'Old channel:', value: oldState?.channel?.toString()??'Unavailable.', inline: true },
                            { name: 'New channel:', value: newState?.channel?.toString()??'Unavailable.', inline: true },
                            { name: 'Time spent in vc:', value: `${vctime === '0ms' ? '```diff\n- Unavailable\n```' : `**\`${vctime}\`**`}`}
                        ])
                        .setFooter({ text: 'Event emitted', iconURL: client.config.text.links.relaxyImage })
                        .setTimestamp()])
                    break
                    default:
                        client.data.modlog_posts[oldState ? oldState.guild.id : newState.guild.id].push(['voiceStateUpdate',
                            new Discord.EmbedBuilder()
                            .setColor('FF69B4')
                            .setThumbnail(newState.member.displayAvatarURL({ dynamic: true, size: 4096 }))
                            .setTitle('**Event |** ' + `${state}`)
                            .addFields([
                                { name: 'User:', value: `${newState.member}\n(${newState.member.user.tag})`, inline: true },
                                { name: 'Channel:', value: newState?.channel.toString(), inline: true }
                            ])
                            .setFooter({ text: 'Event emitted', iconURL: client.config.text.links.relaxyImage })
                            .setTimestamp()])
                    break
                }
            }
            
        return client.core.LockdownVoice(newState, guild)
    }
}