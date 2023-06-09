'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'
import { QueueRepeatMode } from '../../../src/MusicPlayer/internals/QueryTypes.js'

export default {
    name: 'repeat',
    aliases: ['repeater'],
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    cooldown: 5,
    slash: new Discord.SlashCommandBuilder(),
    usage: '=repeat',
    description: 'Repeats the currently playing song.',
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

        const track = queue.nowPlaying()
        
        if (queue.repeatMode === QueueRepeatMode.TRACK) {
            queue.setRepeatMode(QueueRepeatMode.AUTOPLAY)

            return client.send(interaction ? 1 : message.channel, null, [{
                color: client.data.embedColor,
                author: { name: 'Repeating disabled for:', icon_url: client.config.text.links.musicImage },
                title: client.utils.firstLetterUp(track.title),
                url: track.url,
                thumbnail: {
                    url: 'attachment://file.gif'
                },
                timestamp: new Date(),
            }], [{
                attachment: track.thumbnail === '' ? './additions/images/mp3.gif' : track.thumbnail,
                name: 'file.gif'
            }])
        }
        
        queue.setRepeatMode(QueueRepeatMode.TRACK)
        
        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            author: { name: 'Repeating enabled for:', icon_url: client.config.text.links.musicImage },
            title: client.utils.firstLetterUp(track.title),
            url: track.url,
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