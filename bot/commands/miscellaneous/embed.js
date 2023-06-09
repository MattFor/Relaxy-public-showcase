'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'embed',
    usage: '=embed (embed object representation)',
    permissionsBOT: ['EMBED_LINKS'],
    permissions: ['EMBED_LINKS'],
    description: 'Send an embed like a bot would, as to how you should format it, please refer to the image below.\nFor more information, use **[this lovely link](https://discordjs.guide/popular-topics/embeds.html#using-an-embed-object)**. Instead of writing `\'` in a word like `don\'t`, please write `|`, f.e `don|t`.\nSame goes for `:`, please replace that with `;;`. (unless using a link) \nReplace `,` with `<>`, when wanting to do `enter`, instead of just pressing enter, please type `~=` instead.\nWhen intending on having spaces in text please use "" instead of \'\'\nWhen writing in a text field surrounded by "" please double any brackets f.e ( becomes (( and } becomes }}.\nShould the embed you want to build exceed the discord message size limit, please send a text file instead.\n\n**I know this is hard to get a hold of but it offers full customization of embeds.**\nYes, even more. If you want to edit an existing embed, type \'=embed edit [channel] [message id]\' you will be prompted to do the rest.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction  '
     */
    async run(client, message, args, guild, interaction) {
        if (!message.attachments.first() && !args[0])
            return new client.class.error('No arguments provided!', interaction ?? message)

        if (message.attachments.first() && args[0])
            return new client.class.error('Too many arguments provided!', interaction ?? message)


        let edit_flag = false
        let edit_msg = null

        let error_flag = false
        let above_embed_text = ""
        let embed = new client.class.customEmbed(client)

        if (args.length === 3 && args[0].toLowerCase() === 'edit') {
            let channel = client.utils.channel(message, args, 1)

            if (!channel)
                return new client.class.error('Channel does not exist', message)

            if (guild.plugins.restricted_channels.includes(channel.id) && !client.utils.isExempt(guild, message))
                return new client.class.error('Cannot use Relaxy in that channel.', message)

            if (guild.plugins.welcome_message.enabled && channel.id === guild.plugins.welcome_message.wmessage_channel)
                return new client.class.error('Cannot edit a message inside of a welcome channel.', message)

            let msg = await channel.messages.fetch(args[2], { cache: false, limit: 1  })

            if (!msg)
                return new client.class.error('Message with provided ID doesn\'t exist.', message)

            if (msg.author.id !== client.user.id)
                return new client.class.error('Message is not from Relaxy, cannot edit.', message)

            edit_msg = msg

            client.send(message.channel, null, [{
                color: client.data.embedColor,
                title: 'Provide text or file that includes the embed code'
            }])

            await message.channel.awaitMessages({ 
                filter: m => m.author.id === message.author.id, max: 1, time: 300000, errors: ['time'] 
            }).then(c => {
                message = c.first()
                args = message.content.split(' ')
            })

            edit_flag = true
        }

        if (message.attachments.first()) {
            try {
                await embed.createFromFile(message)
            } catch {}

            if (embed.data === undefined || embed.data === null)
                return new client.class.error('The data you provided is invalid!', interaction ?? message)

            client.send(message.channel, null, [{ 
                color: client.data.embedColor, 
                description: 'Do you want text above the embed? It will not show any text if you reply with **`no`**.' 
            }])

            await message.channel.awaitMessages({ 
                filter: m => m.author.id === message.author.id, max: 1, time: 300000, errors: ['time'] 
            }).then(c => {
                if (!c.first().content) {
                    error_flag = true
                    return new client.class.error('Invalid response!', interaction ?? message)
                }
                let a = c.first().content.toLowerCase()
                if (a !== 'no' && a !== '`no`' && a !== '**`no`**')
                    return above_embed_text = a
            })

            if (error_flag) 
                return

            if (edit_flag) {
                error_flag = false
                return client.edit(edit_msg, above_embed_text, [embed.data]).catch((e) => {
                    console.log(e)
                    error_flag = true
                    return new client.class.error('An error occured while editing the embed!', interaction ?? message)
                }).then(() => {
                    if (error_flag) 
                        return
                    return new client.class.error('Successfully edited the message.', message)
                })
            }

            client.send(message.channel, null, [{ 
                color: client.data.embedColor, 
                description: 'To which channel you want to sent this embed? **channel mention/name/id**' 
            }])

            return message.channel.awaitMessages({
                filter: m => m.author.id === message.author.id, max: 1, time: 300000, errors: ['time'] 
            }).then(c => {
                if (!c.first().content)
                    return new client.class.error('No text provided!', interaction ?? message)

                let channel = client.utils.channel(c.first(), c.first().content.split(' '))

                if (!channel)
                    return new client.class.error('Invalid channel!', interaction ?? message)

                if (guild.plugins.restricted_channels.includes(channel.id) && !client.utils.isExempt(guild, message))
                    return new client.class.error('Cannot use that channel as it\'s restricted!', interaction ?? message)

                return client.send(channel, above_embed_text, [embed.data]).catch((e) => {
                    console.log(e)
                    return new client.class.error('An error occured while sending the embed!', interaction ?? message)
                })
            })
        }

        embed.createFromText(args)

        if (embed.data === undefined || embed.data === null)
            return new client.class.error('The data you provided is invalid!', interaction ?? message)

        client.send(message.channel, null, [{ color: 
            client.data.embedColor, 
            description: 'Do you want text above the embed? It will not show any text if you reply with **`no`**.' 
        }])

        await message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, max: 1, time: 300000, errors: ['time'] })
            .then(c => {
                if (!c.first().content) {
                    error_flag = true
                    return new client.class.error('Invalid response!', interaction ?? message)
                }

                let a = c.first().content.toLowerCase()

                if (a !== 'no' && a !== '`no`' && a !== '**`no`**')
                    return above_embed_text = a
            })

        if (error_flag) 
            return 

        if (edit_flag) {
            error_flag = false
            return client.edit(edit_msg, above_embed_text, [embed.data]).catch(() => {
                error_flag = true
                return new client.class.error('An error occured while editing the embed!', interaction ?? message)
            }).then(() => {
                if (error_flag) 
                    return
                return new client.class.error('Successfully edited the message.', message)
            })
        }

        client.send(message.channel, null, [{ 
            color: client.data.embedColor, 
            description: 'To which channel you want to sent this embed? **channel mention/name/id**' 
        }])

        return message.channel.awaitMessages({
            filter: m => m.author.id === message.author.id, max: 1, time: 300000, errors: ['time'] 
        }).then(c => {
            if (!c.first().content)
                return new client.class.error('No text provided!', interaction ?? message)

            let channel = client.utils.channel(c.first(), c.first().content.split(' '))

            if (!channel)
                return new client.class.error('Invalid channel!', interaction ?? message)

            if (guild.plugins.restricted_channels.includes(channel.id) && !client.utils.isExempt(guild, message))
                return new client.class.error('Cannot use that channel as it\'s restricted!', interaction ?? message)

            return client.send(channel, above_embed_text, [embed.data]).catch((e) => {
                console.log(e)
                return new client.class.error('An error occured while sending the embed!', interaction ?? message)
            })
        })
    }
}

