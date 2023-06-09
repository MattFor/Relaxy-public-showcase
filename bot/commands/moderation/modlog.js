'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'modlog',
    permissions: ['VIEW_AUDIT_LOG', 'MANAGE_GUILD', 'MANAGE_CHANNELS'],
    usage: '=modlog',
    description: 'Relaxy creates a modlog channel for you.\nEvery important server change/interaction is going to be logged there in detail.\nTo view the options, simply type =modlog again. To turn off the modlog, do =modlog off.\nTo change something, simply type =modlog (event number, take it from the list by simply doing =modlog) (channel, if you want to redirect it somewhere else or simply nothing to turn it off).\nYou can also say =modlog all (channel) to turn on everything and push it to the desired channel.\nType \'lowspam\' to turn off events that rapidly appear.',
    permissionsBOT: ['MANAGE_CHANNELS', 'EMBED_LINKS', 'ATTACH_FILES', 'VIEW_AUDIT_LOG'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (guild.plugins.modlog.enabled) {
            await client.utils.modlogChannels(guild)

            if (args.length > 0)
                switch (args[0].toLowerCase()) {
                    case 'off': 
                        client.save(guild.id, {
                            to_change: 'plugins.modlog',
                            value: {
                                enabled: false,
                                events: client.data.modlogEvents
                            }
                        })

                        return new client.class.error('Mod log removed!', interaction ?? message)

                    case 'all': 
                        let channel = client.utils.channel(message, args, 1)

                        if (!channel)
                            return new client.class.error('Cannot find channel!', message)

                        if (channel.type !== Discord.ChannelType.GuildText)
                            return new client.class.error('Invalid channel type!', message)

                        client.save(guild.id, {
                            to_change: 'plugins.modlog',
                            value: {
                                enabled: true,
                                events: client.data.modlogEvents
                            }
                        })

                        return new client.class.error(`Pushing all modlogs to ${channel.name}.`, interaction ?? message)

                    case 'lowspam':
                        let mode = guild.plugins.modlog.lowspam

                        client.save(guild.id, {
                            to_change: 'plugins.modlog.lowspam',
                            value: !mode
                        })

                        return new client.class.error(`Low spam mode has been turned ${mode ? 'off' : 'on'}!`, interaction ?? message)
                }

            let embed = {
                color: client.data.embedColor,
                title: 'Moderator log options:',
                thumbnail: { url: `attachment://${message.guild.id}.gif` },
                fields: [{
                    name: 'Low spam mode:',
                    value: guild.plugins.modlog.lowspam ? 'Is turned ON.' : 'Is turned OFF.'
                }],
                description: '',
                footer: client.data.footer
            }

            if (args.length === 0) {
                let count = 1

                let w = []

                for (const part of Object.entries(guild.plugins.modlog.events)) {
                    w.push(part[0])
                    embed.description += `${count} - \`${client.data.humanReadableEvents[part[0]]}\`\nEnabled: ${part[1].enabled? '**Yes.**' : '**No.**'}\nChannel: **${client.channels.cache.get(part[1].channel) || 'None.'}**\n`
                    count++
                }

                return client.send(message.channel, null, [embed], [{
                    attachment: !message.guild.iconURL({ dynamic: true, size: 4096 }) ? './additions/images/server.png' : message.guild.iconURL({ dynamic: true, size: 4096 }),
                    name: `${message.guild.id}.gif`
                }])
            }

            let index = Number(client.utils.nums(args[0]))

            if (!index)
                return new client.class.error('No option index given!', message)

            let event_length = Object.keys(client.data.humanReadableEvents).length

            if (index < 1 || index > event_length)
                return new client.class.error(`Number is out of bounds, min 1 max ${event_length}.`, message)

            index -= 1

            let channel = client.utils.channel(message, args, 1)
            let key = Object.keys(guild.plugins.modlog.events)[index]

            if (channel) {
                client.save(guild.id, { to_change: `plugins.modlog.events.${key}.channel`, value: channel.id })
                return new client.class.error('Options saved', message)
            }

            let option = guild.plugins.modlog.events[key].enabled

            client.save(guild.id, { to_change: `plugins.modlog.events.${key}.enabled`, value: !option })
            return new client.class.error(`'${client.data.humanReadableEvents[key].slice(0, client.data.humanReadableEvents[key].length - 2)}' has been turned ${option ? 'off' : 'on'}!`, message)
        }

        return message.guild.channels.create({ 
            name: 'mod-log', 
            type: Discord.ChannelType.GuildText,
        }).then((channel) => {

            channel.setTopic('All important server interactions are going to be noted here.')

            let result = client.data.modlogEvents
            for (const key of Object.keys(result))
                result[key] = {
                    enabled: true,
                    channel: channel.id
                }

            client.save(guild.id, {
                to_change: 'plugins.modlog',
                value: {
                    enabled: true,
                    events: result
                }
            })

            new client.class.error('Moderator log channel created.', message)

            return client.send(channel, null, [
                new Discord.EmbedBuilder()
                .setColor(client.data.embedColor)
                .setAuthor({ name: 'Moderator channel created!' })
                .setDescription(`Channel id: \`${channel.id}\`\nEvery important interaction on this server\nIs going got get reported on this channel.\n\`\`\`diff\n- It is recommended to lock this channel from non moderators.\n\`\`\``)
                .setTimestamp()
                .setFooter(client.data.footer)
                .setThumbnail(message.guild.iconURL({ dynamic: true, extension: 'png' }))]
            )
        })
    }
}