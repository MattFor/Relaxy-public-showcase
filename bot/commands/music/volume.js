'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'

// let volume = 10;  // Maximum volume
// let userInput = convertToUserInput(volume);  // Converts to user input scale
// console.log(userInput);  // Outputs: 100

// userInput = 20;  // 20% of the maximum volume
// volume = convertToVolume(userInput);  // Converts back to volume scale
// console.log(volume);  // Outputs: 2 (which is 20% of 10)
const maxVolume = 10;

function convertToVolume(userInput) {
    return (userInput / 100) * maxVolume;
}

export default {
    name: 'volume',
    aliases: ['vol'],
    slash: new Discord.SlashCommandBuilder()
        .addIntegerOption(option => option.setName('volume').setDescription('Music volume.').setRequired(false).setMaxValue(1000).setMinValue(1)),
    description_slash: 'Change the volume of Relaxy\'s music.',
    usage: '=volume number',
    description: 'Number: `1 - 100`\nChange the volume of music that Relaxy!\'s playing.\nTo see the queue volume simply do =volume.',
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

        const volume = parseInt(args.join(' '))

        if (!args[0])
            return new client.class.error(`The current volume is: ${queue.volume}%!`, interaction ?? message)

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) 
            return new client.class.error('NotSameVoiceChannel', interaction ?? message)

        if (!message.INTERACTION && (isNaN(args[0]) || args[0] > 1000 || args[0] < 1 || message.content.includes('-') || message.content.includes('+') || message.content.includes(',') || message.content.includes('.'))) 
            return new client.class.error('InvalidNumber', interaction ?? message)

        queue.setVolume(convertToVolume(volume))
        return new client.class.error(`Volume set to ${volume}%!`, interaction ?? message)
    }
}