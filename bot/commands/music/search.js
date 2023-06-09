'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


const optimizeTrackMapString = (String) => {
    try {
        String = String.replaceAll('~', '\\~').replaceAll('|', '\\|').replaceAll('_', '\\_').replaceAll('*', '\\*').replaceAll('`', '\\`')
    } catch {}

    let split = String.split('\n')
    let reference_indexes = 0
    let temporary_string

    for (let i = 0; i < split.length; i++) {
        temporary_string += split[i]

        if (temporary_string.length > 2047)
            return split.slice(reference_indexes, 1).join('\n')

        reference_indexes++
    }

    return String
}


export default {
    name: 'search',
    permissionsBOT: ['EMBED_LINKS'],
    args: true,
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('song_name').setDescription('Name of the video to search.').setRequired(true).setMinLength(2).setMaxLength(800)),
    usage: '=search keywords',
    description: 'Search for a Youtube video, returns multiple results that you can pick from.',
    cooldown: 3,
    permissionsBOT: ['CONNECT', 'SPEAK', 'EMBED_LINKS'],
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

        if (message.guild.me.voice && message.guild.me.voice.channel && (message.member.voice.channel.full && message.guild.me.voice.channel.id !== message.member.voice.channel.id) && message.guild.me.voice.channel.id !== message.member.voice.channel.id) 
            return new client.class.error('Voice channel is full!', interaction ?? message)

        if (!message.member.voice.channel.joinable) 
            return new client.class.error('Can\'t join your voice channel!', interaction ?? message)

        if (queue ? queue.state === 'recording' : false) 
            return new client.class.error('Recording', interaction ?? message)

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) 
            return new client.class.error('NotSameVoiceChannel', interaction ?? message)

        if (message.attachments.size > 0)
            return new client.class.error('Cannot search with an attachment!', interaction ?? message)

        const created_queue = client.module.music.createQueue(message, guild)
        const query = args.join(' ').replaceAll('\n', '').replaceAll('\r\n', '')

        return client.module.music.search(query, {
            requestedBy: message.author
        }).then(async(song) => {

            if (song === 'liveContent')
                return new client.class.error('Cannot play a live video!', interaction ?? message)

            let trackMapToOptimizedString = optimizeTrackMapString(song.tracks.map((track, i) => `${i < 15 ? `[śFLAG1Ś]${i + 1}.[śFLAG1Ś] - [ąFLAG2Ą][${track.title}](${track.url})[ąFLAG2Ą]` : ``}`).join('\n').toString())
            trackMapToOptimizedString = trackMapToOptimizedString.replaceAll('[śFLAG1Ś]', '\`').replaceAll('[ąFLAG2Ą]', '**')

            if (interaction)
                interaction.reply({ embeds: [{
                    color: client.data.embedColor,
                    author: {
                    name: `Searches for: ${client.utils.firstLetterUp(query)}`,
                    icon_url:
                        client.config.text.links.musicImage
                    },
                    footer: client.data.footer,
                    timestamp: new Date(),
                    thumbnail: { url: song.tracks[0].thumbnail },
                    description: trackMapToOptimizedString
                }]}).then(async msg => {
                    msg = await interaction.fetchReply()

                    msg.channel.awaitMessages({
                        max: 1,
                        time: 3000000,
                        errors: ['time'],
                        filter: async m => m.author.id === message.author.id && parseInt(m.content) > 0 && parseInt(m.content) < 16
                    })
                    .then(async collected => {
                        const args = parseInt(collected.first().content)

                        try {
                            if (!queue || (queue && !queue.playing))
                                await created_queue.connect(message.member.voice.channel)              
                        } catch {
                            return new client.class.error('Couldn\'t connect to your voice channel!', interaction)
                        }

                        return created_queue.play(song.tracks[args - 1]).then(() => {
                            return new client.class.error(created_queue.playing ? 'Adding...' : 'Playing...', interaction)
                        }).catch(err => {
                            return !interaction ? null : new client.class.error(err === 'liveContent' ? 'Cannot play live videos!' : 'Error occured while trying to play the song!', interaction)
                        })
                    })
                })
            else 
                client.send(message.channel, null, [{
                    color: client.data.embedColor,
                    author: {
                    name: `Searches for: ${client.utils.firstLetterUp(query)}`,
                    icon_url:
                        client.config.text.links.musicImage
                    },
                    footer: client.data.footer,
                    timestamp: new Date(),
                    thumbnail: { url: song.tracks[0].thumbnail },
                    description: trackMapToOptimizedString
                }]).then(async msg => {
                    msg.channel.awaitMessages({
                        max: 1,
                        time: 3000000,
                        errors: ['time'],
                        filter: async m => m.author.id === message.author.id && parseInt(m.content) > 0 && parseInt(m.content) < 16
                    })
                    .then(async collected => {
                        const args = parseInt(collected.first().content)

                        try {
                            if (!queue || (queue && !queue.playing))
                                await created_queue.connect(message.member.voice.channel)              
                        } catch {
                            return new client.class.error('Couldn\'t connect to your voice channel!', message)
                        }

                        return created_queue.play(song.tracks[args - 1])
                    })
                })
        })
    }
}