'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'clearchannel',
    permissions: ['MANAGE_CHANNELS', 'MANAGE_MESSAGES'],
    permissionsBOT: ['MANAGE_CHANNELS', 'MANAGE_MESSAGES'],
    cooldown: 5,
    usage: '=clearchannel',
    description: 'Add a channel that\'s going to get all of it\'s messages removed every 3 minutes.\nType \'show\' as the only argument to show all current channels.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let clear_channels = guild.plugins.clearing_channels

        if (args.length > 0) {
            if (args[0] === 'show')
                return client.send(message.channel, null, [{
                    color: client.data.embedColor,
                    title: 'Clearing channels:',
                    description: `${clear_channels.map(c => { return message.guild.channels.get(c) }).join(', ') || 'None'}.`
                }])

            let removed = []
            let arg_len

            for (let i = 0; i < arg_len; i++) {
                let channel = client.utils.channel(message, args, i)

                if (clear_channels.includes(channel.id)) {
                    clear_channels.splice(clear_channels.indexOf(channel.id), 1)
                    removed.push(channel)
                }
            }
            
            let embed = [{
                color: client.data.embedColor,
                title: 'Clearing channels:',
                description: `${clear_channels.map(c => { return message.guild.channels.get(c) }).join(', ') || 'None'}.`,
                fields: [{ name: 'Removed:', value: `${removed.map(c => { return removed }).join(', ')}.` }]
            }]

            return client.send(message.channel, null, embed)
        }

        message.guild.channels.create({ 
            name: 'bot-commands', 
            type: Discord.ChannelType.GuildText,
        }).then(async(channel) => {
            clear_channels.push(`${channel.id}`)

            client.save(guild.id, { to_change: 'plugins.clearing_channels', value: clear_channels })
            channel.setTopic(`Channel for bot commands, it is going to be cleared every 3 minutes if Relaxy's online.`)
            channel.send(`New channel id: ***${channel.id}***\nChannel will be cleared every __3__ mins by Relaxy!`)

            channel.setPosition(message.channel.position)

            return new client.class.error(`${channel.name} has been constructed!`, message)
        })
    }
}