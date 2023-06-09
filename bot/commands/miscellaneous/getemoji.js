'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'getemoji',
    aliases: ['emoji'],
    permissionsBOT: ['EMBED_LINKS'],
    description: 'Get the image of an emoji or stickers provided.\n type \'multiple\' as the first argument to insert multiple stickers/emojis at once [will not display]',
    usage: '=getemoji [multiple] emojis/stickers',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (!args[0] && !message.stickers.first())
            return new client.class.error('No input provided!', message)

        if (args[0] && args[0].toLowerCase() == 'multiple') {
            args.shift()

            let emojis = []
            let stickers = []

            if (message.stickers.size > 0) {
                let i = 0
                message.stickers.forEach(sticker => {
                    stickers.push(`${i + 1}. [${sticker.name}](${sticker.url})`)
                    i++
                })
            }

            if (args.length > 0) {
                for (let i = 0; i < args.length; i++) {
                    if (!client.utils.isValidEmoji(args[i]) && !client.utils.nums(args[i]))
                        return new client.class.error(`Item number [${i + 1}] is not a valid emoji/is a default discord emoji.`, message)

                    if (Object.keys(client.config.emojis).includes(args[i]) || Object.values(client.config.emojis).includes(args[i]))
                        continue

                    let emoji = args[i].split(':')
                    emojis.push(`${i + 1}. [${emoji[1]}](https://cdn.discordapp.com/emojis/${client.utils.nums(emoji[2])}.${emoji[0].includes('a') ? 'gif' : 'png'})`)
                }
            }

            return client.send(message.channel, null, [{
                color: client.data.embedColor,
                description: `${emojis.length > 0 ? `**Emojis:**\n${emojis.join('\n')}\n` : ''}${stickers.length > 0 ? `**Stickers:**\n${stickers.join('\n')}` : ''}`.slice(0, 2048)
            }])
        }

        if (message.stickers.size > 0) {
            let sticker = message.stickers.first()

            return client.send(message.channel, null, [{
                color: client.data.embedColor,
                title: sticker.name,
                image: { url: sticker.url },
                footer: { text: 'Stickers do not animate, they are apng not gif.'}
            }])
        }

        if (!client.utils.isValidEmoji(args[0]) && (!Object.keys(client.config.emojis).includes(args[0]) && !Object.values(client.config.emojis).includes(args[0])))
            return new client.class.error('Input is not a valid emoji.', message)

        if (Object.keys(client.config.emojis).includes(args[0]) || Object.values(client.config.emojis).includes(args[0]))
            return new client.class.error('Cannot display default discord emoji.', message)

        let emoji = args[0].split(':')

        return client.send(message.channel, null, [{
            color: client.data.embedColor,
            title: emoji[1],
            image: { url: `attachment://emoji.${emoji[0].includes('a') ? 'gif' : 'png'}` }
        }], [{
            attachment: `https://cdn.discordapp.com/emojis/${client.utils.nums(emoji[2])}.${emoji[0].includes('a') ? 'gif' : 'png'}`,
            name: `emoji.${emoji[0].includes('a') ? 'gif' : 'png'}`
        }])
    }
}