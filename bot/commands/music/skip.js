'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'skip',
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    cooldown: 5,
    slash: new Discord.SlashCommandBuilder().addIntegerOption(option => option.setName('amount').setDescription('Amount of songs to skip.').setRequired(false).setMinValue(1)),
    usage: '=skip number',
    description: 'Skips the current song or the desired number of songs.',
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


        let Num = client.utils.nums(args.join(''))

        if (args[0] && Num < 1)    
            return new client.class.error('Input number cannot be lower than 1!', interaction ?? message)

        if (args[0] && Num) {
            if (Num > queue.tracks.length)
                return new client.class.error('Too many tracks to skip!', interaction ?? message)

            queue.skip(false, Num)

            return new client.class.error(`Skipped ${Num} tracks!`, interaction ?? message)
        }

        let track = queue.current

        queue.skip()


        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            title: client.utils.firstLetterUp(track.title),
            url: track.url,
            author: { name: 'Skipping:', icon_url: client.config.text.links.musicImage },
            thumbnail: {
                url: 'attachment://file.gif'
            },
            timestamp: new Date(),
        }], [{
            attachment: track.thumbnail === '' ? './additions/images/mp3.gif' : track.thumbnail,
            name: 'file.gif'
        }])
    }
}