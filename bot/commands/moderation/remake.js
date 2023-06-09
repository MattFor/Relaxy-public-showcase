'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'remake',
    cooldown: 20,
    permissions: ['MANAGE_CHANNELS'],
    permissionsBOT: ['MANAGE_CHANNELS'],
    slash: new Discord.SlashCommandBuilder().addChannelOption(option => option.setName('channel').setDescription('Channel to remake again.').setRequired(true)),
    usage: '=remake channel',
    description: 'Replace the channel with a clean copy of itself. **[REMOVES RELAXY FUNCTIONS]**',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        let id = client.utils.nums(args[0]) ? client.utils.nums(args[0]).id : message.channel.id

        if (!client.channels.cache.get(id) || [Discord.ChannelType.GuildVoice, Discord.ChannelType.AnnouncementThread, Discord.ChannelType.GuildAnnouncement, Discord.ChannelType.GuildDirectory].includes(client.channels.cache.get(id).type))
            return new client.class.error(`Invalid channel type!`, message)

        client.channels.cache.get(id).clone().then(async channel => {
            channel.setPosition(client.channels.cache.get(id).position)
            channel.setTopic(client.channels.cache.get(id).topic)
        })

        return setTimeout(() => {
            return client.channels.cache.get(id).delete()
        }, 1000)
    }
}