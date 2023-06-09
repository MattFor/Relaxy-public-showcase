'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'bitrate',
    args: true,
    slash: new Discord.SlashCommandBuilder().addNumberOption(option => option.setName('bitrate').setDescription('Bitrate in kb/s from 1 to the maximum nitro boost allows.').setMinValue(1).setMaxValue(384).setRequired(true)),
    usage: '=bitrate bitrate',
    description: 'Set the bitrate of Relaxy\'s music. (max depends on server boost level)',
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

        if (!queue) 
            return new client.class.error('NotPlaying', interaction ?? message)

        if (message.guild.me.voice && message.guild.me.voice.channel && (message.member.voice.channel.full && message.guild.me.voice.channel.id !== message.member.voice.channel.id) && message.guild.me.voice.channel.id !== message.member.voice.channel.id) 
            return new client.class.error('Voice channel is full!', interaction ?? message)

        if (isNaN(args[0]))
            return new client.class.error('Argument is not a number!', interaction ?? message)


        let bitrate = Number(args[0])

        let max_bitrate = 96

        switch (message.guild.premiumTier) {
            case 1:
                max_bitrate = 128
            break

            case 2:
                max_bitrate = 256
            break

            case 3:
                max_bitrate = 384
            break

            default:
                max_bitrate = 96
        }

        if (bitrate < 1)
            return new client.class.error('Bitrate cannot be lower than 1!', interaction ?? message)

        if (bitrate > max_bitrate)
            return new client.class.error(`Bitrate too high, max for your server is ${max_bitrate}!\nTo increase this, boost your server with nitro!`, interaction ?? message)

        queue.setBitrate((bitrate * 1000))

        if (interaction)
            return new client.class.error(`Bitrate set to ${bitrate}!`, interaction ?? message)
    }
}