'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'
import ytdl from 'better-ytdl-core'


const ytdlGetInfo = ytdl.getInfo

export default {
    name: 'pskip',
    aliases: ['playskip'],
    cooldown: 2,
    usage: '=pskip link/keywords',
    slash: new Discord.SlashCommandBuilder()
        .addStringOption(option => option.setName('video_name').setDescription('Name of the video to search').setRequired(true).setMinLength(2).setMaxLength(800)),
    description_slash: 'Play a song immediately after skipping the current one.',
    description: 'Works exactly like **`=p`**, difference is that =pskip doesn\'t add the track to the end of the queue but instead replaces the currently playing track. Accepts mp3/4/mov/webm s.',
    permissionsBOT: ['CONNECT', 'SPEAK', 'EMBED_LINKS', 'ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        let queue = client.module.music.getQueue(message.guild.id)

        if (!queue || !queue?.current_song)
            return new client.class.error('Nothing to skip!', interaction ?? message)

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

        let attachment = interaction ? null : message.attachments.first()

        // Check if input is empty
        if (!args[0] && !attachment)
            return new client.class.error('No input given!', interaction ?? message)

        let attachment_flag = false

        // Check if attachement file format is valid
        if (attachment)
            if (attachment.url.endsWith('mp3') || attachment.url.endsWith('mp4') || attachment.url.endsWith('mov') || attachment.url.endsWith('webm')) {
                attachment_flag = true
            } else {
                return new client.class.error('Invalid file format', interaction ?? message)
            }

        // Get achievement
        client.module.profiles.Achievement(message, 'playedtrack', guild)

        let ERROR = null

        // Clear out search from shift-enters and such
        args = args.join(' ').replaceAll('\n', '').replaceAll('\r\n', '').split('&ab_channel')[0]

        const song = await client.module.music.search(attachment_flag ? attachment.url : args, {
            requestedBy: message.author
        }).catch((err) => {
            ERROR = err
        })

        if (song === 'liveContent')
            return new client.class.error('Cannot play a live video!', interaction ?? message)

        if (!song)
            return new client.class.error('Error, cannot find the thing you\'re searching for, sorry!', interaction ?? message)

        // If error or no tracks, quit with error
        if (!song || ERROR || song.tracks.length === 0) 
            return ERROR ? new client.class.error(`Encountered an error:\n${ERROR.message}`, interaction ?? message) : new client.class.error(`No results found for ${args}!`, interaction ?? message)

        let playlist_flag = song.playlist && !args.includes('&index=') && !args.includes('watch?v=')

        let information_about_yt_vid_live = null

        // When not playlist, but singular yt video, check whether it is live
        if (!playlist_flag && !attachment)
            ytdlGetInfo(song.tracks[0].url).then(async(info) => {
                return information_about_yt_vid_live = info
            }).catch(() => {})

        try {
            if (information_about_yt_vid_live.videoDetails.isLive) 
                return new client.class.error('Cannot play live videos!', interaction ?? message)
        } catch {}

        if (playlist_flag) {
            for (let i = song.playlist.tracks.length; i >= 0; i--)
                queue.tracks.unshift(song.playlist.tracks[i])
        } else 
            queue.tracks.unshift(song.tracks[0])

        if (queue.tracks.length !== 0) {
            queue.skip()

            return interaction ? new client.class.error('Skipping...', interaction) : null
        }

        return interaction ? new client.class.error('Playing...', interaction) : null
    }
}