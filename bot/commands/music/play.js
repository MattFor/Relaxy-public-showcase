'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'
import ytdl from 'better-ytdl-core'


const ytdlGetInfo = ytdl.getInfo


export default {
    name: 'play',
    aliases: ['p'],
    cooldown: 2,
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('song_name').setDescription('Name of the video to search.').setRequired(true).setMinLength(2).setMaxLength(800)),
    usage: '=play link/keywords',
    description: 'Play Youtube, Soundcloud, Spotify, Facebook, Vimeo, Reverbnation music, playlist or an attachment.',
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

        const created_queue = client.module.music.createQueue(message, guild)

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

        // If playlist exists, get the first track and shift to prevent doubling tracks
        let playlist_track_first = song.playlist ? song.playlist.source === 'spotify' ? song.tracks.shift() : song.playlist.tracks.shift() : null

        // If error or no tracks, quit with error
        if (!song || ERROR || song.tracks.length === 0) 
            return ERROR ? new client.class.error(`Encountered an error:\n${ERROR.message}`, interaction ?? message) : new client.class.error(`No results found for ${args}!`, interaction ?? message)

        // Attempt to connect to vc, if failed, quit with error
        try {
            if (!queue || (queue && !queue.playing))
                await created_queue.connect(message.member.voice.channel)              
        } catch {
            return new client.class.error('Couldn\'t connect to your voice channel!', interaction ?? message)
        }

        let playlist_flag = song.playlist && !args.includes('&index=') && !args.includes('watch?v=')

        // EXAMPLE:
        // https://www.youtube.com/watch?v=6HGLeUqoUf8&list=PL8KfkAoFO91J3dD_uFSRsSuAcEhJQfHe5&index=22
        let index = song.playlist && args.includes('&index=') && args.includes('watch?v=') && args.includes('&list=')

        if (playlist_flag) {
            if (queue && queue.playing) 
                created_queue.addTracks(song.tracks)
            else 
                created_queue.addTracks(song.playlist.tracks)

            client.module.music.emit('playlistAdd', message, created_queue, song.playlist)
            
            if (created_queue.playing)
                return interaction ? new client.class.error('Adding...', interaction ?? message) : null
        }

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

        let result = 1

        created_queue.play(index ? song.tracks[Number(args.split('&index=')[1]) - 2] : playlist_flag ? playlist_track_first : song.tracks[0], { immediate: false, filtersUpdate: false }, null, index ? true : null)
            .catch(err => {
                result = err
            })

        if (interaction && (song.playlist && args.includes('&index=') && args.includes('&list=')))
            return new client.class.error('Playing playlist...', interaction ?? message)

        if (result === 1 && interaction)
            return new client.class.error(created_queue.playing ? 'Adding...' : 'Playing...', interaction ?? message)
        else 
            return !interaction ? null : new client.class.error(result === 'liveContent' ? 'Cannot play live videos!' : 'Error occured while trying to play the song!', interaction ?? message)
    }
}