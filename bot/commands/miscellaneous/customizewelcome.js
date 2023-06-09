'use strict'

import Relaxy from '../../../src/Relaxy.js'
import Discord from 'discord.js'


export default {
    name: 'customizewelcome',
    cooldown: 5,
    usage: '=customizewelcome option text',
    args: true,
    permissions: ['MANAGE_GUILD'],
    description: 'Option must be:\n- welcomer_message.\n- leaver_message.\n- welcomer_top.\n- leaver_top.\n- welcomer_bottom.\n- leaver_bottom.\nThe text for welcomer_message and leaver_message can include **|U|** which is going to be replaced with the user who joined/left.\nIt can also contain **|G|** which is going to be replaced with the server name.\nYou can also use**`=embed`** formatting to send an embedded message, it only works with text files as embed code can get pretty big!\nIf you\'re using a welcome option with an image, it\'s going to appear on the big field in the embed.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let type = args.shift().toLowerCase()

        if (!args[0] && !message.attachments.first())
            return new client.class.error('No text given!', interaction ?? message)

        if (!guild.welcome_channel.enabled)
            return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

        let text = ''
        let flag = false

        if (message.attachments.first()) {
            switch (type) {
                case 'welcomer_top':
                    if (guild.welcome_channel.channelWELCOME === '')
                        return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                    return new client.class.error('You can only have an embed when using welcomer_message or leaver_message!', interaction ?? message)
                case 'leaver_top':
                    if (guild.welcome_channel.channelLEAVE === '')
                        return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                    return new client.class.error('You can only have an embed when using welcomer_message or leaver_message!', interaction ?? message)
                case 'welcomer_bottom':
                    if (guild.welcome_channel.channelWELCOME === '')
                        return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                    return new client.class.error('You can only have an embed when using welcomer_message or leaver_message!', interaction ?? message)
                case 'leaver_bottom':
                    if (guild.welcome_channel.channelLEAVE === '')
                        return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                    return new client.class.error('You can only have an embed when using welcomer_message or leaver_message!', interaction ?? message)
                default:
                    if (['leaver_message', 'welcomer_message'].includes(type)) 
                        break
                    else 
                        return new client.class.error('Invalid option specified', interaction ?? message)
            }

            let embed = new client.class.customEmbed(client)

            try {
                await embed.createFromFile(message)
            } catch {}

            if (embed.data === undefined || embed.data === null)
                return new client.class.error('The data you provided is invalid!', interaction ?? message)
            
            client.send(message.channel, null, [{ 
                color: client.data.embedColor, description: 'Do you want text above the embed? It will not show any text if you reply with **`no`**.' 
            }])

            message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, max: 1, time: 300000, errors: ['time'] })
                .then(c => {
                    if (!c.first().content) {
                        flag = true
                        return new client.class.error('Invalid response!', interaction ?? message)
                    }

                    let a = c.first().content.toLowerCase()

                    if (a !== 'no' && a !== '`no`' && a !== '**`no`**')
                        return text = a
                })

            if (flag) return

            switch (type) {
                case 'welcomer_message':
                    if (guild.welcome_channel.channelWELCOME === '')
                        return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                    guild.welcome_channel.messageWELCOME = `${text}NULL(0)[SPLIT_FLAG]${JSON.stringify(embed)}`
                    guild.markModified('welcome_channel.messageWELCOME')

                    break
                case 'leaver_message':
                    if (guild.welcome_channel.channelLEAVE === '')
                        return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                    guild.welcome_channel.messageLEAVE = `${text}NULL(0)[SPLIT_FLAG]${JSON.stringify(embed)}`
                    guild.markModified('welcome_channel.messageLEAVE')

                    break
            }

            await guild.save()

            return new client.class.error('Options changed & saved!', interaction ?? message)
        }

        switch (type) {
            case 'welcomer_message':
                if (guild.welcome_channel.channelWELCOME === '')
                    return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                guild.welcome_channel.messageWELCOME = args.join(' ').slice(0, 1960)
                guild.markModified('welcome_channel.messageWELCOME')

                break
            case 'leaver_message':
                if (guild.welcome_channel.channelLEAVE === '')
                    return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                guild.welcome_channel.messageLEAVE = args.join(' ').slice(0, 1960)
                guild.markModified('welcome_channel.messageLEAVE')

                break
            case 'welcomer_top':
                if (guild.welcome_channel.channelWELCOME === '')
                    return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                guild.welcome_channel.topWELCOME = args.join(' ').slice(0, 15)
                guild.markModified('welcome_channel.topWELCOME')

                break
            case 'leaver_top':
                if (guild.welcome_channel.channelLEAVE === '')
                    return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                guild.welcome_channel.topLEAVE = args.join(' ').slice(0, 15)
                guild.markModified('welcome_channel.topLEAVE')

                break
            case 'welcomer_bottom':
                if (guild.welcome_channel.channelWELCOME === '')
                    return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)

                guild.welcome_channel.bottomWELCOME = args.join(' ').slice(0, 30)
                guild.markModified('welcome_channel.bottomWELCOME')

                break
            case 'leaver_bottom':
                if (guild.welcome_channel.channelLEAVE === '')
                    return new client.class.error('This feature of Relaxy! is not enabled on this server', interaction ?? message)
                
                guild.welcome_channel.bottomLEAVE = args.join(' ').slice(0, 30)
                guild.markModified('welcome_channel.bottomLEAVE')

                break
            default:
                return new client.class.error('Invalid option specified', interaction ?? message)
        }

        await guild.save()

        return new client.class.error('Options changed & saved!', interaction ?? message)
    }
}