'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'goto',
    args: true,
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('time').setDescription('Time to which the video will be skipped. Format: HH:MM:SS.').setRequired(true).setMinLength(2).setMaxLength(800)),
    usage: '=goto time',
    description: 'Skip to a desired part of a song.',
    aliases: ['seek', 'skipto'],
    cooldown: 4,
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

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) 
            return new client.class.error('NotSameVoiceChannel', interaction ?? message)

        if (isNaN(args[0]) && !args[0].includes(':'))
            return new client.class.error('Time is NaN', interaction ?? message)


        if (!args[0].includes(':'))
            args[0] = `${args[0]}:`

        let time = client.utils.cleanup(args[0].split(':'))

        switch (time.length) {
            case 1: {
                time = parseInt(time[0]) * 1000
                break
            }

            case 2: {
                time =  parseInt(time[0]) * 60000 +  parseInt(time[1]) * 1000
                break
            }

            case 3: {
                time = parseInt(time[0]) * 3600000 + parseInt(time[1]) * 60000 + parseInt(time[2]) * 1000
                break
            }

            default: 
                return new client.class.error('Time too long!', interaction ?? message)
        }

        queue.seek(time)

        return new client.class.error(`description Skipping to **${client.imports.time(time)}**`, interaction ?? message)
    }
}