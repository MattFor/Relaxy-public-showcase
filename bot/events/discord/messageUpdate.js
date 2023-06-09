'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle a message edit.
     * @param {Relaxy} client 
     * @param {Discord.Message} old_message
     * @param {Discord.Message} new_message
     */
    async run(client, old_message, new_message) {
        if (old_message?.content === new_message?.content || !old_message || !new_message) 
            return

        const guild = await client.module.database.Guild(new_message.guild.id)

        if (client.core.Censor(new_message, guild))
            return

        if (guild.plugins.modlog.events.messageUpdate.enabled) {
            if (!await client.channels.fetch(guild.plugins.modlog.events.messageUpdate.channel)) 
                return client.save(guild.id, { to_change: 'plugins.modlog.events.messageUpdate.enabled', value: false })
            
            let embed =  new client.class.modlog({
                event: 'Message edited',
                thumbnail: new_message.member.user.avatarURL({ dynamic: true, extension: 'png' }),
                image: new_message.attachments.size > 0 && old_message.attachments.size === 0 ? new_message.attachments.first().url : null,
                fields: [
                    { name: 'Original Message:', value: `\`\`\`\n${old_message.content ? old_message.content.replace(/`/g, "'").slice(0, 1024) : 'Unavailable.'}\n\`\`\`` },
                    { name: 'Updated Message:', value: `\`\`\`fix\n${new_message.content.replace(/`/g, "'")}\n\`\`\``.slice(0, 1024) },
                    { name: 'Author:', value: `${new_message.author ? new_message.author : 'Unavailable.'} - **${new_message.author ? new_message.author.tag ? new_message.author.tag : 'unavailable' : 'unavailable'}** - \`${new_message.author? new_message.author.id ? new_message.author.id: 'unavailable': 'unavailable'}\`` },
                    { name: 'Channel:', value: `${old_message ? old_message.channel : new_message.channel}` },
                    { name: 'Message ID:', value: `\`${old_message ? old_message.id : new_message.id}\``, inline: true },
                    old_message.attachments.size !== new_message.attachments.size ? 
                        { name: 'Old attachments:', value: `${old_message.attachments.map(attachment => { return `Name: ${attachment.name}\n[Link](${attachment.url})\nSize: ${attachment.size/1000000}mb\nContent type: ${attachment.contentType}` })??'None.'}` } : null,       
                    old_message.attachments.size !== new_message.attachments.size ? 
                        { name: 'New attachments:', value: `${new_message.attachments.map(attachment => { return `Name: ${attachment.name}\n[Link](${attachment.url})\nSize: ${attachment.size/1000000}mb\nContent type: ${attachment.contentType}` })??'None.'}` } : null,       
                        old_message.stickers.size !== new_message.stickers.size ? 
                        { name: 'Old stickers:', value: `${old_message.stickers.map(sticker => { return `Name: ${sticker.name}\n[Link](${sticker.url})` })??'None.' }` } : null,
                    old_message.stickers.size !== new_message.stickers.size ? 
                        { name: 'New stickers:', value: `${new_message.stickers.map(sticker => { return `Name: ${sticker.name}\n[Link](${sticker.url})` })??'None.' }` } : null
                ].filter(i => i !== null),
                author: { name: `Message author: ${new_message.author.username}`, iconURL: new_message.author.displayAvatarURL({ dynamic: true, size: 4096 }) },
                description: `[Click here to jump to the message](${new_message.url})`
            })

            return client.data.modlog_posts[new_message.guild.id].push(['messageUpdate', embed])
        }
    }
}