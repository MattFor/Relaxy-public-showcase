'use sstrict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'
import { QueueRepeatMode } from '../../../src/MusicPlayer/internals/QueryTypes.js'

export default {
    name: 'loop',
    aliases: ['lp'],
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    usage: '=loop',
    slash: new Discord.SlashCommandBuilder(),
    description: 'Loops the queue (every song) until the command gets called again.',
    cooldown: 10,
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


        if (queue.RepeatMode === QueueRepeatMode.QUEUE) {
            queue.setRepeatMode(QueueRepeatMode.AUTOPLAY)

            return client.send(interaction ? 1 : message.channel, null, [{
                color: client.data.embedColor,
                author: { name: 'Loop enabled for', icon_url: client.config.text.links.musicImage },
                title: `${client.utils.firstLetterUp(message.guild.name)}`,
                description: `**Channel - ${message.guild.me.voice.channel.name}**`,
                thumbnail: {
                    url: `attachment://${message.guild.id}.gif`
                },
                timestamp: new Date(),
            }], [{
                attachment: !message.guild.iconURL({
                    dynamic: true,
                    size: 4096
                }) ? './additions/images/server.png' : message.guild.iconURL({
                    dynamic: true,
                    size: 4096
                }),
                name: `${message.guild.id}.gif`
            }])
        }

        queue.setRepeatMode(QueueRepeatMode.QUEUE)

        return client.send(interaction ? 1 : message.channel, null, [{
            color: client.data.embedColor,
            author: { name: 'Loop enabled for', icon_url: client.config.text.links.musicImage },
            title: `${client.utils.firstLetterUp(message.guild.name)}`,
            description: `**Channel - ${message.guild.me.voice.channel.name}**`,
            thumbnail: {
                url: `attachment://${message.guild.id}.gif`
            },
            timestamp: new Date(),
        }], [{
            attachment: !message.guild.iconURL({
                dynamic: true,
                size: 4096
            }) ? './additions/images/server.png' : message.guild.iconURL({
                dynamic: true,
                size: 4096
            }),
            name: `${message.guild.id}.gif`
        }])
    }
}