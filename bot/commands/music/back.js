'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'back',
    aliases: ['prev', 'previous', 'last'],
    usage: '=back',
    slash: new Discord.SlashCommandBuilder(),
    description: 'Plays the previous song in the queue.',
    cooldown: 5,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const queue = client.module.music.getQueue(message.guild.id)


        if (!message.member.voice.channel) 
            return new client.class.error('NotConnected', interaction ?? message)

        if (!queue) 
            return new client.class.error('NotPlaying', interaction ?? message)

        if (queue ? queue.state === 'recording' : false) 
            return new client.class.error('RecordingA', interaction ?? message)

        if (message.guild.me.voice && message.guild.me.voice.channel && (message.member.voice.channel.full && message.guild.me.voice.channel.id !== message.member.voice.channel.id) && message.guild.me.voice.channel.id !== message.member.voice.channel.id)
            return new client.class.error('Voice channel is full!', interaction ?? message)


        const curTrack = queue.nowPlaying()


        if (!queue || queue.tracks.size < 2 || curTrack.title === queue.tracks[0].title)
            return new client.class.error('Cannot use the =back command at this time!', interaction ?? message)

        return queue.back()
    }
}