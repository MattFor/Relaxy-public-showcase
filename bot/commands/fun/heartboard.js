'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'heartboard',
    usage: '=heartboard number (optional)',
    description: 'Relaxy creates a heartboard channel for you.\nShould any message that Relaxy can see get 3 :heart: reactions, it will is going to get put on the heartboard.\nIf a message returns back to 0 hearts, it\'s going to get deleted.\nNumber - how many :heart:\'s a post needs before it gets on the heartboard.',
    permissions: ['MANAGE_CHANNELS'],
    permissionsBOT: ['SEND_MESSAGES', 'MANAGE_CHANNELS', 'EMBED_LINKS', 'ADD_REACTIONS', 'ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let number = null

        if (guild.plugins.heart_board.enabled) {
            if (args[0]) {
                number = client.utils.nums(args[0])
                if (!number)
                    return new client.class.error('Heartboard type is NaN!', interaction ?? message)
                else if (number > 10 || number < 2)
                        return new client.class.error('The heartboard type cannot be greater than 10 or lower than 2!', interaction ?? message)
                else {
                    new client.class.error(`Setting heartboard type ${number}!`, message)
                    return client.save(guild.id, { to_change: 'plugins.heart_board.type', value: number })
                }
            }

            client.save(guild.id, {
                to_change: 'plugins.heart_board',
                value: {
                    enabled: false,
                    channel_id: '',
                    type: 3
                }
            })

            return new client.class.error('Heart Board removed!', interaction ?? message)
        }

        if (args[0]) {
            number = client.utils.nums(args[0])
            if (!number)
                return new client.class.error('Heartboard type is NaN!', interaction ?? message)
            else if (number > 10 || number < 2)
                return new client.class.error('The heartboard type cannot be greater than 10 or lower than 2!', interaction ?? message)
            else
                new client.class.error(`Setting heartboard type ${number}!`, message)
        } else 
            new client.class.error('No heartboard type specified, using default: 3.', interaction ?? message)

        if (!number)
            number = 3

        return message.guild.channels.create({
            name: 'heart-board', 
            type: client.imports.discord.ChannelType.GuildText,
        }).then(async(channel) => {
            channel.setTopic(`Glorified hall of fame! Any message with ${number} :heart: reactions will be put on here!`)

            client.save(guild.id, {
                to_change: 'plugins.heart_board',
                value: {
                    enabled: true,
                    channel_id: channel.id,
                    type: number,
                    postIDs: []
                }
            })

            client.module.profiles.Achievement(message, 'madeheartboard', guild)

            return new client.class.error('Heart Board added!', interaction ?? message)
        })
    }
}