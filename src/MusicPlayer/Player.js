'use strict'

// NodeJS imports
import os from 'os'
import ytdl from 'better-ytdl-core'
import fetch from 'isomorphic-unfetch'
import spotify_import from 'spotify-url-info'

const ytdlGetInfo = ytdl.getInfo
const { getData } = spotify_import(fetch)

// Discord.js imports
import { Collection } from 'discord.js'
import { generateDependencyReport } from '@discordjs/voice'
import { TypedEmitter as EventEmitter } from 'tiny-typed-emitter'

// Music Player imports
import Track from './classes/Track.js'
import { Queue } from './classes/Queue.js'
import { Playlist } from './classes/Playlist.js'
import { VoiceUtils } from './internals/VoiceUtils.js'
import { ExtractorModel } from './classes/ExtractorModel.js'
import { PlayerError, ErrorStatusCode } from './classes/PlayerError.js'

// External API imports
import { YouTube } from 'youtube-sr'
import { Client as SoundCloud } from 'soundcloud-scraper'

const soundcloud = new SoundCloud()

// Utils imports
import { Util } from './utils/Util.js'
import DiscordExtractor from './utils/Discord.js'
import { QueryType } from './internals/QueryTypes.js'
import { QueryResolver } from './utils/QueryResolver.js'


export default class Player extends EventEmitter {
    constructor(client, options = {}) {
        super()
        this.options = {
            autoRegisterExtractor: true,
            ytdlOptions: {
                filter: 'audioonly',
                fmt: 'mp3',
                highWaterMark: 1 << 62,
                liveBuffer: 20000,
                dlChunkSize: 0,
                bitrate: 128,
                quality: 'highestaudio'
            },
            connectionTimeout: 20000
        }
        this.queues = new Collection()
        this.voiceUtils = new VoiceUtils()
        this.extractors = new Collection()
        /**
         * The discord.js client
         * @type {Client}
         */
        this.client = client
        /**
         * The extractors collection
         * @type {ExtractorModel}
         */
        this.options = Object.assign(this.options, options)

        if (this.options?.autoRegisterExtractor) {
            const nv = Util.require('@discord-player/extractor')
            
            if (nv) {
                const extractors = ['Attachment', 'Facebook', 'Reverbnation', 'Vimeo']
                extractors.forEach((ext) => {
                    const extractor = nv[ext]
                    if (extractor)
                        this.use(ext, extractor)
                })
            }
        }
    }

    /**
     * Handles voice state update
     * @param {VoiceState} oldState The old voice state
     * @param {VoiceState} newState The new voice state
     * @returns {void}
     */
    async _handleVoiceState(oldState, newState) {
        const queue = this.getQueue(oldState.guild.id)
        if (!queue) 
            return
        
        const channel = newState.guild?.me?.voice?.channel
            
        if (!oldState.channelId && newState.channelId && newState.member.id === newState.guild.me.id) {
            queue.setPaused(newState.serverMute || !newState.serverMute)
            if (newState.suppress) 
                newState.guild.me.voice.setRequestToSpeak(true).catch(Util.noop)

            queue.setPaused(newState.suppress || !newState.suppress)
        }
        
        if (oldState.channelId === newState.channelId && oldState.member.id === newState.guild.me.id)
            if (oldState.serverMute !== newState.serverMute) {
                queue.setPaused(newState.serverMute)
            } else if (oldState.suppress !== newState.suppress) {
                if (newState.suppress)
                    newState.guild.me.voice.setRequestToSpeak(true).catch(Util.noop)

                queue.setPaused(newState.suppress)
            }
        
        if (oldState.member.id === this.client.user.id && !newState.channelId) {
            if (queue.state === 'recording') {
                new this.client.class.error('Stopped recording, I left the channel!', queue.message)
                this.client.module.recorder.Halt(queue.message)
            }

            return void this.emit('botDisconnect', queue)
        }

        if (!channel)
            return
        
        if (oldState.channelId !== newState.channelId && !oldState.channelId) {
            const emptyTimeout = queue._cooldownsTimeout.get(`empty_${oldState.guild.id}`)
            const channelEmpty = newState.guild?.me?.voice?.channel.members.size === 1
            
            if (!channelEmpty && emptyTimeout) {
                clearTimeout(emptyTimeout)
                queue._cooldownsTimeout.delete(`empty_${oldState.guild.id}`)
            }
        } else {
            const timeout = setTimeout(async () => {
                if (!this.queues.has(queue.guild.id) || !Util.isVoiceEmpty(channel)) 
                    return

                if (queue.state === 'recording') {
                    new this.client.class.error('Stopped recording, I left the channel!', queue.message)
                    this.client.module.recorder.Halt(queue.message)
                }

                if (queue.options.leaveOnEmpty)
                    queue.destroy(true, false, true)
                
                this.emit('channelEmpty', queue)
            }, queue.options.leaveOnEmptyCooldown || 0).unref()
            
            queue._cooldownsTimeout.set(`empty_${oldState.guild.id}`, timeout)
        }
    }

    /**
     * Player stats
     * @returns {PlayerStats}
     */
    getStats() {
        let _a = 0
        this.queues.forEach(queue => {
            try {
                _a  += queue.message.guild.me.voice.channel.members.size - 1
            } catch {}
        })
        return {
            shard_id: this.client.data.id,
            uptime: this.client.uptime,
            connections: this.client.voice.adapters.size,
            users: _a,
            queues: this.queues.size,
            system: {
                arch: process.arch,
                platform: process.platform,
                cpu: os.cpus().length,
                memory: {
                    total: (process.memoryUsage().heapTotal / 1024 / 1024),
                    usage: (process.memoryUsage().heapUsed / 1024 / 1024),
                    rss: (process.memoryUsage().rss / 1024 / 1024),
                    arrayBuffers: (process.memoryUsage().arrayBuffers / 1024 / 1024)
                },
                uptime: process.uptime()
            }
        }
    }

    /**
     * Creates a queue for a guild if not available, else returns existing queue
     * @param {Message} message The Discord message object
     * @param {GuildResolvable} GUILD The guild
     * @param {PlayerOptions} queueInitOptions Queue init options
     * @returns {Queue} The queue for the guild
     */
    createQueue(message, GUILD, queueInitOptions = {}) {
        const guild = this.client.guilds.resolve(GUILD.id)

        if (!guild)
            throw new PlayerError('Unknown Guild', ErrorStatusCode.UNKNOWN_GUILD)

        const existingQueue = this.queues.get(guild.id)

        if (existingQueue)
            return existingQueue

        const _meta = queueInitOptions.metadata
        delete queueInitOptions.metadata

        queueInitOptions.ytdlOptions = queueInitOptions.ytdlOptions ?? this.options.ytdlOptions

        const queue = new Queue(this, guild, message, GUILD, queueInitOptions)
        queue.metadata = _meta
        this.queues.set(guild.id, queue)

        return queue
    }

    /**
     * Returns the queue if available
     * @param {GuildResolvable} guild The guild id
     * @returns {Queue}
     */
    getQueue(guild) {
        guild = this.client.guilds.resolve(guild)
        if (!guild)
            throw new PlayerError('Unknown Guild', ErrorStatusCode.UNKNOWN_GUILD)
        return this.queues.get(guild.id)
    }

    /**
     * Deletes a queue and returns deleted queue object
     * @param {GuildResolvable} guild The guild id to remove
     * @returns {Queue}
     */
    deleteQueue(guild) {
        guild = this.client.guilds.resolve(guild)
        if (!guild)
            throw new PlayerError('Unknown Guild', ErrorStatusCode.UNKNOWN_GUILD)
        const prev = this.getQueue(guild)
        try {
            prev.destroy()
        }
        catch (_a) { }
        this.queues.delete(guild.id)
        return prev
    }
    /**
     * @typedef {object} SearchResult
     * @property {Playlist} [playlist] The playlist (if any)
     * @property {Track[]} tracks The tracks
     */
    /**
     * Search tracks_a[1][1]
     * @param {string|Track} query The search query
     * @param {SearchOptions} options The search options
     * @returns {Promise<SearchResult>}
     */
    async search(query, options) {
        var _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18
        if (query instanceof Track)
            return { playlist: null, tracks: [query] }
        if (!options)
            throw new PlayerError('DiscordPlayer#search needs search options!', ErrorStatusCode.INVALID_ARG_TYPE)
        options.requestedBy = this.client.users.resolve(options.requestedBy)
        if (!('searchEngine' in options))
            options.searchEngine = QueryType.AUTO

        for (const [_, extractor] of this.extractors) {
            if (options.blockExtractor)
                break
            if (!extractor.validate(query))
                continue
            const data = await extractor.handle(query)
            if (data && data.data.length) {
                const playlist = !data.playlist
                    ? null
                    : new Playlist(this, Object.assign(Object.assign({}, data.playlist), { tracks: [] }))
                const tracks = data.data.map((m) => new Track(this, Object.assign(Object.assign({}, m), { requestedBy: options.requestedBy, duration: Util.buildTimeCode(Util.parseMS(m.duration)), playlist: playlist })))
                if (playlist)
                    playlist.tracks = tracks
                return { playlist: playlist, tracks: tracks }
            }
        }
        const qt = options.searchEngine === QueryType.AUTO ? QueryResolver.resolve(query) : options.searchEngine

        switch (qt) {
            case QueryType.YOUTUBE_VIDEO: {
                const info = await ytdlGetInfo(query).catch(Util.noop)
                if (!info)
                    return { playlist: null, tracks: [] }
                    if (info.videoDetails.isLive) return 'liveContent'
                const track = new Track(this, {
                    title: info.videoDetails.title,
                    description: info.videoDetails.description,
                    author: info.videoDetails.author?.name,
                    url: info.videoDetails.video_url,
                    requestedBy: options.requestedBy,
                    thumbnail: Util.last(info.videoDetails.thumbnails)?.url,
                    views: parseInt(info.videoDetails.viewCount.replace(/[^0-9]/g, '')) || 0,
                    duration: Util.buildTimeCode(Util.parseMS(parseInt(info.videoDetails.lengthSeconds) * 1000)),
                    source: 'youtube',
                    raw: info,
                })
                return { playlist: null, tracks: [track] }
            }
            case QueryType.YOUTUBE_SEARCH: {
                const videos = await YouTube.search(query, {
                    type: 'video'
                })
                if (!videos)
                    return { playlist: null, tracks: [] }
                
                const tracks = videos.map((m) => {
                    m.source = 'youtube'

                    return new Track(this, {
                        title: m.title,
                        description: m.description,
                        author: m.channel?.name,
                        url: m.url,
                        requestedBy: options.requestedBy,
                        thumbnail: m.thumbnail?.displayThumbnailURL('maxresdefault'),
                        views: m.views,
                        duration: m.durationFormatted,
                        source: 'youtube',
                        raw: m,
                    })
                })
                return { playlist: null, tracks }
            }
            case QueryType.SOUNDCLOUD_TRACK:
            case QueryType.SOUNDCLOUD_SEARCH: {
                const result = QueryResolver.resolve(query) === QueryType.SOUNDCLOUD_TRACK ? [{ url: query }] : await soundcloud.search(query, 'track').catch(() => [])
                if (!result || !result.length)
                    return { playlist: null, tracks: [] }
                const res = []
                for (const r of result) {
                    const trackInfo = await soundcloud.getSongInfo(r.url).catch(Util.noop)
                    if (!trackInfo)
                        continue
                    const track = new Track(this, {
                        title: trackInfo.title,
                        url: trackInfo.url,
                        duration: Util.buildTimeCode(Util.parseMS(trackInfo.duration)),
                        description: trackInfo.description,
                        thumbnail: trackInfo.thumbnail,
                        views: trackInfo.playCount,
                        author: trackInfo.author.name,
                        requestedBy: options.requestedBy,
                        source: 'soundcloud',
                        engine: trackInfo
                    })
                    res.push(track)
                }
                return { playlist: null, tracks: res }
            }
            case QueryType.SPOTIFY_SONG: {
                const spotifyData = await getData(query).catch()

                if (!spotifyData)
                    return { playlist: null, tracks: [] }

                const spotifyTrack = new Track(this, {
                    title: spotifyData.name,
                    description: spotifyData.description ?? '',
                    author: spotifyData.artists?.[0]?.name ?? 'Unknown Artist',
                    url: spotifyData.external_urls?.spotify ?? query,
                    thumbnail: `https://i.scdn.co/image/${spotifyData.album?.images?.[0]?.url ?? (spotifyData.preview_url?.length && spotifyData.preview_url?.split('?cid=')[1]) ?? 'https://www.scdn.co/i/_global/twitter_card-default.jpg'}`,
                    duration: Util.buildTimeCode(Util.parseMS(spotifyData.duration_ms)),
                    views: 0,
                    requestedBy: options.requestedBy,
                    source: 'spotify'
                })
                return { playlist: null, tracks: [spotifyTrack] }
            }
            case QueryType.SPOTIFY_PLAYLIST:
            case QueryType.SPOTIFY_ALBUM: {
                const spotifyPlaylist = await getData(query).catch()
                if (!spotifyPlaylist)
                    return { playlist: null, tracks: [] }

                const playlistAuthor = spotifyPlaylist.type !== 'playlist'
                ? {
                    name: spotifyPlaylist.artists[0]?.name || 'Unknown Artist',
                    url: spotifyPlaylist.artists[0]?.external_urls?.spotify || null,
                }
                : {
                    name: spotifyPlaylist.owner?.display_name || spotifyPlaylist.owner?.id || 'Unknown Artist',
                    url: spotifyPlaylist.owner?.external_urls?.spotify || null,
                }
                  
                const playlist = new Playlist(this, {
                    title: spotifyPlaylist.name || spotifyPlaylist.title,
                    description: spotifyPlaylist.description || '',
                    thumbnail: spotifyPlaylist.images[0]?.url || 'https://www.scdn.co/i/_global/twitter_card-default.jpg',
                    type: spotifyPlaylist.type,
                    source: 'spotify',
                    author: playlistAuthor,
                    tracks: [],
                    id: spotifyPlaylist.id,
                    url: spotifyPlaylist.external_urls?.spotify || query,
                    rawPlaylist: spotifyPlaylist
                })
                
                if (spotifyPlaylist.type !== 'playlist') {
                    playlist.tracks = spotifyPlaylist.tracks.items.map((m) => {
                        const data = new Track(this, {
                            title: m.name ?? '',
                            description: m.description ?? '',
                            author: m.artists?.[0]?.name ?? 'Unknown Artist',
                            url: m.external_urls?.spotify ?? query,
                            thumbnail: spotifyPlaylist.images?.[0]?.url ?? 'https://www.scdn.co/i/_global/twitter_card-default.jpg',
                            duration: Util.buildTimeCode(Util.parseMS(m.duration_ms)),
                            views: 0,
                            requestedBy: options.requestedBy,
                            playlist,
                            source: 'spotify'
                        })
                        return data
                    })
                }
                else {
                    playlist.tracks = spotifyPlaylist.tracks.items.map((m) => {
                        const data = new Track(this, {
                            title: m.track.name ?? '',
                            description: m.track.description ?? '',
                            author: m.track.artists?.[0]?.name ?? 'Unknown Artist',
                            url: m.track.external_urls?.spotify ?? query,
                            thumbnail: m.track.album?.images?.[0]?.url ?? 'https://www.scdn.co/i/_global/twitter_card-default.jpg',
                            duration: Util.buildTimeCode(Util.parseMS(m.track.duration_ms)),
                            views: 0,
                            requestedBy: options.requestedBy,
                            playlist,
                            source: 'spotify'
                        })
                        return data
                    })
                }
                return { playlist: playlist, tracks: playlist.tracks }
            }
            case QueryType.SOUNDCLOUD_PLAYLIST: {
                const data = await soundcloud.getPlaylist(query).catch(Util.noop)
                if (!data)
                    return { playlist: null, tracks: [] }
                const res = new Playlist(this, {
                    title: data.title,
                    description: (_6 = data.description) !== null && _6 !== void 0 ? _6 : '',
                    thumbnail: (_7 = data.thumbnail) !== null && _7 !== void 0 ? _7 : 'https://soundcloud.com/pwa-icon-192.png',
                    type: 'playlist',
                    source: 'soundcloud',
                    author: {
                        name: (_11 = (_9 = (_8 = data.author) === null || _8 === void 0 ? void 0 : _8.name) !== null && _9 !== void 0 ? _9 : (_10 = data.author) === null || _10 === void 0 ? void 0 : _10.username) !== null && _11 !== void 0 ? _11 : 'Unknown Artist',
                        url: (_12 = data.author) === null || _12 === void 0 ? void 0 : _12.profile
                    },
                    tracks: [],
                    id: `${data.id}`,
                    url: data.url,
                    rawPlaylist: data
                })
                for (const song of data.tracks) {
                    const track = new Track(this, {
                        title: song.title,
                        description: (_13 = song.description) !== null && _13 !== void 0 ? _13 : '',
                        author: (_17 = (_15 = (_14 = song.author) === null || _14 === void 0 ? void 0 : _14.username) !== null && _15 !== void 0 ? _15 : (_16 = song.author) === null || _16 === void 0 ? void 0 : _16.name) !== null && _17 !== void 0 ? _17 : 'Unknown Artist',
                        url: song.url,
                        thumbnail: song.thumbnail,
                        duration: Util.buildTimeCode(Util.parseMS(song.duration)),
                        views: (_18 = song.playCount) !== null && _18 !== void 0 ? _18 : 0,
                        requestedBy: options.requestedBy,
                        playlist: res,
                        source: 'soundcloud',
                        engine: song
                    })
                    res.tracks.push(track)
                }
                return { playlist: res, tracks: res.tracks }
            }
            case QueryType.YOUTUBE_PLAYLIST: {
                const ytpl = await YouTube.getPlaylist(query)
                if (!ytpl)
                    return { playlist: null, tracks: [] }
                await ytpl.fetch()
                const playlist = new Playlist(this, {
                    title: ytpl.title,
                    thumbnail: ytpl.thumbnail,
                    description: '',
                    type: 'playlist',
                    source: 'youtube',
                    author: {
                        name: ytpl.channel.name,
                        url: ytpl.channel.url
                    },
                    tracks: [],
                    id: ytpl.id,
                    url: ytpl.url,
                    rawPlaylist: ytpl
                })
                playlist.tracks = ytpl.videos.map((video) => {
                    if (video.live) return 
                    var _a
                    return new Track(this, {
                        title: video.title,
                        description: video.description,
                        author: (_a = video.channel) === null || _a === void 0 ? void 0 : _a.name,
                        url: video.url,
                        requestedBy: options.requestedBy,
                        thumbnail: video.thumbnail.url,
                        views: video.views,
                        duration: video.durationFormatted,
                        raw: video,
                        playlist: playlist,
                        source: 'youtube'
                    })
                })

                return { playlist: playlist, tracks: playlist.tracks }
            }
            case QueryType.ARBITRARY : {
                const data = await DiscordExtractor.getInfo(query)
                    if (!data || !(data.format.startsWith('audio/') || data.format.startsWith('video/')))
                        return { playlist: null, tracks: [] }

                    const track = new Track(this, {
                        title: data.title.replaceAll('\_', ' '),
                        url: query,
                        thumbnail: '',
                        duration: 0,
                        description: '',
                        views: 0,
                        requestedBy: options.requestedBy,
                        fromPlaylist: false,
                        author: options.requestedBy,
                        playlist: null,
                        raw: {engine: query},
                        source: query
                    })

                    return { playlist: null, tracks: [track] }
            }
            default:
                return { playlist: null, tracks: [] }
        }
    }

    /**
     * Registers extractor
     * @param {string} extractorName The extractor name
     * @param {ExtractorModel|any} extractor The extractor object
     * @param {boolean} [force=false] Overwrite existing extractor with this name (if available)
     * @returns {ExtractorModel}
     */
    use(extractorName, extractor, force = false) {
        if (!extractorName)
            throw new PlayerError('Cannot use unknown extractor!', ErrorStatusCode.UNKNOWN_EXTRACTOR)
        if (this.extractors.has(extractorName) && !force)
            return this.extractors.get(extractorName)
        if (extractor instanceof ExtractorModel) {
            this.extractors.set(extractorName, extractor)
            return extractor
        }
        for (const method of ['validate', 'getInfo']) {
            if (typeof extractor[method] !== 'function')
                throw new PlayerError('Invalid extractor data!', ErrorStatusCode.INVALID_EXTRACTOR)
        }
        const model = new ExtractorModel(extractorName, extractor)
        this.extractors.set(model.name, model)
        return model
    }

    /**
     * Removes registered extractor
     * @param {string} extractorName The extractor name
     * @returns {ExtractorModel}
     */
    unuse(extractorName) {
        if (!this.extractors.has(extractorName))
            throw new PlayerError(`Cannot find extractor '${extractorName}'`, ErrorStatusCode.UNKNOWN_EXTRACTOR)
        const prev = this.extractors.get(extractorName)
        this.extractors.delete(extractorName)
        return prev
    }
    
    /**
     * Generates a report of the REQ_showDependencies used by the `@discordjs/voice` module. Useful for debugging.
     * @returns {string}
     */
    scanDeps() {
        return generateDependencyReport()
    }

    /**
     * Resolves queue
     * @param {GuildResolvable|Queue} queueLike Queue like object
     * @returns {Queue}
     */
    resolveQueue(queueLike) {
        return this.getQueue(queueLike instanceof Queue ? queueLike.guild : queueLike)
    }

    *[Symbol.iterator]() {
        yield* Array.from(this.queues.values())
    }
}