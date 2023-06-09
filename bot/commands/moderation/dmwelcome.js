'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'dmwelcome',
    usage: '=dmwelcome welcome/leave text',
    description: 'Set a message that will be sent to a user who leaves/joins your server.\nYou can provide a text file with the =embed formatting to have the message be an embed (when doing that just type `=dmwelcome (welcome/leave) and add the file to the message.`\n**People can opt out with `=dmout`**\n```diff\n- leave messages only visible for users who are also with relaxy on other servers\n```Also should the message not display when someone joins and has =dmout off, check if any of the embed fields or the message itself isn\'t longer than 1950 characters!',
    permissionsBOT: ['EMBED_LINKS'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (!args[0] && !guild.plugins.dm_welcome_leave.enabled)
            return new client.class.error('No arguments provided!', interaction ?? message)

        if (!args[0]) {
            client.save(guild.id, { to_change: 'plugins.dm_welcome_leave.enabled', value: false })
            return new client.class.error(`Turned off DM welcome/leave messages for ${message.guild.name}`, message)
        }

        if (args[0] !== 'welcome' && args[0] !== 'leave') 
            return new client.class.error('The first argument must be either welcome or leave!', interaction ?? message)

        if (message.attachments.size > 0 && args[1])
            return new client.class.error('Too many arguments!', interaction ?? message)

        let welcome_leave = args.shift()
        let embed = new client.class.customEmbed(client)
        let text = ''

        client.save(guild.id, { to_change: 'plugins.dm_welcome_leave.enabled', value: true })

        if (message.attachments.size > 0) {
            try {
                await embed.createFromFile(message)
            } catch {}

            if (embed.data === undefined || embed.data === null)
                return new client.class.error('The data you provided is invalid!', interaction ?? message)

            client.send(message.channel, null, [{ 
                color: client.data.embedColor, description: 'Do you want text above the embed? It will not show any text if you reply with **`no`**.' 
            }])

            await message.channel.awaitMessages({ filter: m => m.author.id === message.author.id, max: 1, time: 300000, errors: ['time'] })
            .then(c => {
                const message_received = c.first()

                if (!message_received.content) {
                    flag = true
                        return new client.class.error('Invalid response!', interaction ?? message)
                }

                let a = message_received.content.toLowerCase()

                if (a !== 'no' && a !== '`no`' && a !== '**`no`**')
                    return text = a
            })

            if (flag) return

            client.save(guild.id, { to_change: `plugins.dm_welcome_leave.${welcome_leave}`, value: `${text}NULL(0)[SPLIT_FLAG]NULL(0)${JSON.stringify(embed)}` })

            return new client.class.error(`DM ${welcome_leave} message changed!`, interaction ?? message)
        }

        if (args.join(' ').length > 1950)
            return new client.class.error('DM welcome message is too long! (maximum 1950 characters)', interaction ?? message)

        client.save(guild.id, { to_change: `plugins.dm_welcome_leave.${welcome_leave}`, value: `${args.join(' ')}NULL(0)[SPLIT_FLAG]NULL(0)` })
    
        return new client.class.error(`DM ${welcome_leave} message changed!`, message)
    }
}