'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle message deletion.
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @returns {Discord.Message} 
     */
    async run(client, message) {
        const forum = await client.module.database.findForumChannel(message?.channel?.parent?.id, message?.guild?.id);
        if (!forum?.checks?.deleteWhenOriginalMessageGone && message.channel.id === forum?.id && message.channel.type === Discord.ChannelType.PublicThread)
            try {
                await client.getMessage(message.channel, null, true)
            } catch {
                return message.channel.delete().catch(() => {})
            }
        
        const guild = await client.module.database.Guild(message?.guild?.id)
        if (!guild || guild.lockeddown || !message || !message.author) 
            return

        if ((message.author.id === client.user.id) && 
            (await client.utils.modlogChannels(guild)).includes(message.channel.id)) 
            return
        
        const index = guild.reaction_role_messages.findIndex(r => r.id === message.id);
        if (index >= 0) {
           guild.reaction_role_messages.splice(index, 1)
           client.save(guild.id, { to_change: 'reaction_role_messages', value: guild.reaction_role_messages })
        }

        if (guild.plugins.modlog.events.messageDelete.enabled) {
            if (!client.channels.cache.get(guild.plugins.modlog.events.messageDelete.channel)) 
                return client.save(guild.id, { to_change: 'plugins.modlog.events.messageDelete.enabled', value: false })

            if (!client.data.modlog_posts[message.guild.id])
                client.data.modlog_posts[message.guild.id] = []

            let attachment = message.attachments.first()
            let sticker = message.stickers.first()

            let audit = (await message.guild.fetchAuditLogs({ limit: 1 }).catch(() => {}))?.entries?.first()??null

            let image = null
            let files = null

            if (client.imports.fs.existsSync(
                `./storage/${message.author.id}/${message.id}`
            )) {
                const gif = attachment.contentType.includes('gif') ? 'gif' : 'png'

                image = { url: `attachment://${message.id}.${gif}` }

                files = [{
                    attachment: `./storage/${message.author.id}/${message.id}`,
                    name: `${message.id}.${gif}`
                }]
                
                setTimeout(() => 
                    client.imports.fs.unlinkSync(
                        `./storage/${message.author.id}/${message.id}`,
                        () => {} // Do nothing on error
                    )
                , 20 * 1000)
            }

            let embed = message.embeds.length > 0 && !message.stickers.size > 0 && !message.attachments.size > 0 ? new client.class.modlog({
                color: 'bad',
                event: 'Message deleted',
                thumbnail: message.author.displayAvatarURL({ dynamic: true, size: 4096 }),
                fields: [
                    { name: 'Channel:', value: `${message.channel} ${message.channel.name} \`${message.channel.id}\``, inline: true },
                    { name: 'User:', value: `${message.author}\n(${message.author.tag})\n**\`${message.author.id}\`**`, inline: true },
                    audit.targetType === 'Message' && audit.actionType === 'Delete' && audit.target.id !== audit.executor.id && audit.executor.id && Date.now() - audit.createdTimestamp < 1000 ? { name: 'Deleted by:', value: `${audit?.executor}\n(${audit?.executor.tag})\n**\`${audit?.executor.id}\`**`, inline: true } : { name: 'Deleted by:', value: `The original poster.`, inline: true },
                    message.attachments.size > 0 ? 
                        { name: 'Attachment was present:', value: `Name: ${attachment.name}\n[Link](${attachment.url})\nSize: ${attachment.size/1000000}mb\nContent type: ${attachment.contentType}` } : null,       
                    message.stickers.size > 0 ? 
                        { name: 'Sticker was present:', value: `Name: ${sticker.name}\n[Link](${sticker.url})` } : null
                ].filter(i => i !== null),
                url: message.embeds[0].data.url??null,
                description: message.embeds[0].data.description??null,
                footer: { text: 'Event emitted', iconURL: client.config.text.links.relaxyImage },
                image: image??null,
                author: { name: `Message author: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 4096 }) }
            }) :
            new client.class.modlog({
                color: 'bad',
                event: 'Message deleted',
                thumbnail: message.author.displayAvatarURL({ dynamic: true, size: 4096 }),
                description: message.content ? message.content.slice(0, 2048) : null, 
                fields: [
                    { name: 'Channel:', value: `${message.channel} ${message.channel.name} \`${message.channel.id}\``.slice(0, 1024), inline: true },
                    { name: 'User:', value: `${message.author}\n(${message.author.tag})`.slice(0, 1024), inline: true },
                    audit.targetType === 'Message' && audit.actionType === 'Delete' && audit.target.id !== audit.executor.id && Date.now() - audit.createdTimestamp < 1000 ? { name: 'Deleted by:', value: `${audit?.executor} - ${audit?.executor.tag} - **\`${audit?.executor.id}\`**`, inline: true } : { name: 'Deleted by:', value: `The original poster.`, inline: true },
                    message.attachments.size > 0 ? 
                        { name: 'Attachment was present:', value: `${message.attachments.map(a => { return `Name: ${a.name}\n[Link](${a.url})\nSize: ${a.size/1000000}mb\nContent type: ${a.contentType}`}).join('\n\n').slice(0, 1024)??'None'}.` } : null,       
                    message.stickers.size > 0 ? 
                        { name: 'Sticker was present:', value: `${message.stickers.map(s => { return `Name: ${s.name}\n[Link](${s.url})` }).join('\n\n').slice(0, 1024)??'None'}.` } : null,
                ].filter(i => i !== null),
                image: image??null,
                author: { name: `Message author: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 4096 }) }
            })

            if (embed.fields.length !== 0)
                return client.data.modlog_posts[message.guild.id].push(['messageDelete', embed, files??null])
        }
    }
}