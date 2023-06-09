'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'jump',
    aliases: ['hop', 'jumpto', 'hopto'],
    cooldown: 5,
    slash: new Discord.SlashCommandBuilder().addIntegerOption(option =>
        option.setName('index')
            .setDescription('Index of the song in =queue to skip to.')
            .setRequired(true)
            .setMinValue(1)
    ),
    usage: '=jump (track number)',
    description: 'Make a desired track in the queue play when the command is called.',
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

        if (queue ? queue.state === 'recording' : false) 
            return new client.class.error('RecordingA', interaction ?? message)

        if (message.guild.me.voice && message.guild.me.voice.channel && (message.member.voice.channel.full && message.guild.me.voice.channel.id !== message.member.voice.channel.id) && message.guild.me.voice.channel.id !== message.member.voice.channel.id) 
            return new client.class.error('Voice channel is full!', interaction ?? message)

        const queueLength = queue.tracks.length

        if (isNaN(args[0]))
            return new client.class.error('Specified track to skip is NaN!', interaction ?? message)

        if (args[0] === 0)
            return new client.class.error('Can\'t input 0!', interaction ?? message)

        if (Number(args[0]) - 1 > queueLength)
            return new client.class.error(`Queue length is ${queueLength}, you input ${args[0]}. Out of bounds!`, interaction ?? message)

        queue.jump(queue.tracks[Number(args[0]) - 2])

        if (interaction)
            return new client.class.error('Jumping...', interaction)
    }
}