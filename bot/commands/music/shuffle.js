'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'shuffle',
    aliases: ['mix'],
    cooldown: 5,
    slash: new Discord.SlashCommandBuilder(),
    usage: '=shuffle',
    description: 'Shuffles the queue randomly.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (!message.member.voice.channel) 
            return new client.class.error('NotConnected', interaction ?? message)

        const queue = client.module.music.getQueue(message.guild.id)


        if (!queue) 
            return new client.class.error('NotPlaying', interaction ?? message)

        if (queue ? queue.state === 'recording' : false)
            return new client.class.error('RecordingA', interaction ?? message)

        if (queue.tracks.length < 3)
            return new client.class.error('Queue too small to shuffle!', interaction ?? message)

        if (message.guild.me.voice && message.guild.me.voice.channel && (message.member.voice.channel.full && message.guild.me.voice.channel.id !== message.member.voice.channel.id) && message.guild.me.voice.channel.id !== message.member.voice.channel.id) 
            return new client.class.error('Voice channel is full!', interaction ?? message)


        queue.shuffle()

        return new client.class.error(`Queue of ${queue.tracks.length} tracks has been shuffled!`, interaction ?? message)
    }
}