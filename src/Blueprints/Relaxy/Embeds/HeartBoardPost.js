'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../Relaxy.js'

export default class HeartBoardPostEmbed {
    /**
     * Generate a heartboardpost
     * @param {Relaxy} client
     * @param {Discord.Message} message 
     * @returns {Discord.Embed}
     */
    constructor(client, message) {
        let attachment = message.attachments.first()??null
        let embed = message.embeds[0]


        if (message.embeds[0] && attachment && 
        ( // Giphy Imgur etc link embed
            attachment.video === embed.data.video &&
            attachment.url === embed.data.url &&
            attachment.provider === embed.data.provider &&
            attachment.thumbnail === embed.thumbnail &&
            attachment.type == embed.data.type
        )) embed = null

        if (embed && !attachment) {
            attachment = embed
            embed = null
        }

        let result_embed = new client.imports.discord.EmbedBuilder(embed ? embed.data : undefined)
            .setColor(client.data.embedColor)
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, extension: 'png', size: 4096 }) })
            .setFooter({ text: `ID: ${message.id}`, iconURL: client.config.text.links.relaxyImage })
            .setTimestamp()


        if (message.content) // Content is simply link
            if (attachment && attachment.url === message.content && !attachment.url.includes('gif'))
                result_embed.setImage(message.content)
            else
                result_embed.setDescription(message.content.slice(0, 2048))

        try {
            if (!embed && attachment) {
                if (['gif', 'jpg', 'jpeg', 'png', 'gifv'].includes(attachment.url.split('.').splice(-1)[0]))
                    result_embed.setImage(attachment.url.replace('gifv', 'gif'))
                else
                    result_embed.setDescription(`${message.content !== attachment.url ? `${message.content}${
                        message?.type === 12 ? 'Has been added to the announcement list' : 
                        message?.type === 8 ? 'Has just boosted the server!' : ''
                    }` : '' || ''}\n\nAttachment: **[${
                        attachment.name || 
                        attachment.url.split('/').slice(-1)[0] || 
                        'unavailable'
                    }](${
                        attachment.url
                    })**\nSize: \`${
                        attachment.size/1000000 || 
                        'unavailable'
                    }${
                        attachment.size ? 'mb' : ''
                    }\`\n`.slice(0, 2048))

                if (attachment.thumbnail)
                    result_embed.setThumbnail(attachment.thumbnail.url)
            }
        } catch {}

        if (message.stickers.size > 0) {
            let sticker = message.stickers.first()
            result_embed.setImage(sticker.url)
        }

        if (embed?.type === 'auto_moderation_message')
            return

        if (embed)
            result_embed.addFields(embed.data.fields)
                .setDescription(embed.data.description)
                .setImage(embed.data.image??url)
                .setTitle(embed.data.title)
                .setURL(embed.data.url)
                .setThumbnail(embed.data.thumbnail??url)

        result_embed.data.author.url = message.url

        if ([8, 12].includes(message.type))
            result_embed.setDescription(
                message?.type === 12 ? 'Has been added to the announcement list' : 
                message?.type === 8 ? 'Has just boosted the server!' : null
            )

        return result_embed
    }
}