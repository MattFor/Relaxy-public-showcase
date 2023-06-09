'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle a message.
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     */
    async run(client, message) {
        if ([Discord.ChannelType.DM, Discord.ChannelType.GroupDM].includes(message.channel.type))
            return client.log(`\nFrom ${message.author.username} to ${message.channel.recipient.username} at ${message.createdAt.toISOString()} - ${message?.author.id} - ${message.id}:\n\n${message.content.length > 0 ? message.content : 'None.'}${message.attachments.size > 0 ? `\n\nAttachment ${message.attachments.first().name}\n${message.attachments.first().url}` : ''}${message.embeds[0] ?  `\nEmbeds:\n\n ${JSON.stringify(message.embeds[0].data)}` : ''}`)

        if (![
            Discord.ChannelType.GuildText, 
            Discord.ChannelType.GuildAnnouncement,
            Discord.ChannelType.PublicThread
        ].includes(message.channel.type) || 
        [
            Discord.ChannelType.PrivateThread
        ].includes(message.channel.type) || !message.member || !message.author || message.author.id === client.user.id) 
            return

        client.module.database.Guild(message.guild.id).then(async guild => {
            await client.core.cacheImage(message)
            const member = await client.module.database.Member(message.author.id, guild.id)??null

            member.last_message_channel_id = message.channel.id
            member.markModified('last_message_channel_id')

            await member.save()

            client.core.LockdownMessage(message, guild)
            // client.core.autoRole(message.member, guild)
            client.core.Censor(message, guild)

            if (await client.utils.isSuspiciousUser(guild, message))
                return console.log(1)

            let allowed = await client.utils.isAllowedUser(guild, message)
            if (allowed === 0 && allowed !== -1) {
                return client.core.Leveling(message, true, guild)
            }

            if (message.channel.type === Discord.ChannelType.PublicThread && guild.forum.enabled && guild.forum.channels.includes(message.channel.parent.id))
                if (client.core.ForumPostMessage(message, guild) === 0) {
                    return client.core.Leveling(message, true, guild)
                }

            if (client.utils.isRestricted(guild, message.channel.id) && !client.utils.isExempt(guild, message)) {
                return client.core.Leveling(message, true, guild)
            }

            message.guild.me = await message.guild.members.fetchMe()

            // if (message.author.bot && message.author.id !== client.user.id) 
            //     return

            const prefix = guild.prefixes.find(prefix => message.content.startsWith(prefix) && message.content[prefix.length] !== ' ') || '='
            const args = message.content.slice(prefix.length).trim().split(/ +/g)
            const command = args.shift()?.toLowerCase()

            if (client.config.text.noMissingCmdResponse.includes(command)) 
                return

            let prefix_index = message.content.indexOf(prefix) === 0

            const cmd = client.collections.commands.get(command) || client.collections.aliases.get(command)

            if ((!cmd && prefix_index) || cmd?.owner && message?.author.id !== client.config.keys.owner && message?.author.id !== client.user.id) {
                if (!message.content.includes('!') && !message.content.includes('?'))
                    client.send(message.channel, null, [{
                        color: client.data.embedColor, 
                        description: 'There\'s no command like that, see all commands in **=help**!' 
                    }])

                return client.core.Leveling(message, false, guild)
            }

            if (message.content[prefix.length] === ' ') {
                return client.core.Leveling(message, false, guild)
            }

            if (prefix_index) {
                client.core.Leveling(message, true, guild)
                return client.core.Message(message, args, command, cmd, guild)
            }

            return client.core.Leveling(message, false, guild)  
        }).catch(e => console.log(e))
    }
}