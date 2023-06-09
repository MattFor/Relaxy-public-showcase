import ytdl from 'ytdl-core'
import opus from 'prism-media'

// import yt_dlp from 'yt-dlp-wrap'
// const ytdlp = new yt_dlp.default('./additions/bin/yt-dlp.exe')

const FFmpeg = opus.FFmpeg
const Opus = opus

// ytdl events
const evn = [
    'info',
    'progress',
    'abort',
    'request',
    'response',
    'error',
    'redirect',
    'retry',
    'reconnect',
]
/**
 * Create an opus stream for your video with provided encoder args
 * @param url - YouTube URL of the video
 * @param options - YTDL options
 * @example const ytdl = require("discord-better-ytdl-core")
 * const stream = ytdl("VIDEO_URL", {
 *     seek: 3,
 *     encoderArgs: ["-af", "bass=g=10"],
 *     opusEncoded: true
 * })
 * VoiceConnection.play(stream, {
 *     type: "opus"
 * })
 */
const StreamDownloader = (url, options) => {
    try {
        if (!url) {
            throw new Error('No input url provided')
        }
        if (typeof url !== 'string') {
            throw new SyntaxError(`input URL must be a string. Received ${typeof url}!`)
        }
        options !== null && options !== void 0 ? options : (options = {})
        let FFmpegArgs = [
            '-analyzeduration',
            '0',
            '-loglevel',
            '0',
            '-f',
            `${typeof options.fmt === 'string' ? options.fmt : 's16le'}`,
            '-ar',
            '48000',
            '-ac',
            '2',
        ]
        if (!isNaN(options.seek)) {
            FFmpegArgs.unshift('-ss', options.seek.toString())
        }
        if (Array.isArray(options.encoderArgs)) {
            FFmpegArgs = FFmpegArgs.concat(options.encoderArgs)
        }
        const transcoder = new FFmpeg({
            args: FFmpegArgs,
            shell: false,
        })

        const inputStream = ytdl(url, options)      //ytdlp.execStream([url, '-f', 'mp3'])

        // inputStream.on('progress', (progress) =>
        //     console.log(
        //         progress.percent,
        //         progress.totalSize,
        //         progress.currentSpeed,
        //         progress.eta
        //     )
        // ).on('ytDlpEvent', (eventType, eventData) =>
        //     console.log(eventType, eventData)
        // ).on('error', (error) => console.error(error))
        // .on('close', () => console.log('closed'))

        inputStream.on('error', () => transcoder.destroy())
        const output = inputStream.pipe(transcoder)
        if (options && !options.opusEncoded) {
            for (const event of evn) {
                inputStream.on(event, (...args) => output.emit(event, ...args))
            }
            output.on('close', () => transcoder.destroy())
            return output
        }
        const opus = new Opus.Encoder({
            rate: 48000,
            channels: 2,
            frameSize: 960,
        })
        const outputStream = output.pipe(opus)
        output.on('error', (e) => outputStream.emit('error', e))
        for (const event of evn) {
            inputStream.on(event, (...args) => outputStream.emit(event, ...args))
        }
        outputStream.on('close', () => {
            transcoder.destroy()
            opus.destroy()
        })
        return outputStream
    } catch (e) { console.log(e) }
}
/**
 * Creates arbitraryStream
 * @param stream Any readable stream source
 * @param options Stream options
 * @example const streamSource = "https://listen.moe/kpop/opus"
 * let stream = ytdl.arbitraryStream(streamSource, {
 *     encoderArgs: ["-af", "asetrate=44100*1.25"],
 *     fmt: "mp3"
 * })
 *
 * stream.pipe(fs.createWriteStream("kpop.mp3"))
 */
const arbitraryStream = (stream, options) => {
    if (!stream) {
        throw new Error('No stream source provided')
    }
    options !== null && options !== void 0 ? options : (options = {})
    let FFmpegArgs
    if (typeof stream === 'string') {
        FFmpegArgs = [
            '-reconnect',
            '1',
            '-reconnect_streamed',
            '1',
            '-reconnect_delay_max',
            '5',
            '-i',
            stream,
            '-analyzeduration',
            '0',
            '-loglevel',
            '0',
            '-f',
            `${typeof options.fmt === 'string' ? options.fmt : 's16le'}`,
            '-ar',
            '48000',
            '-ac',
            '2',
        ]
    }
    else {
        FFmpegArgs = [
            '-analyzeduration',
            '0',
            '-loglevel',
            '0',
            '-f',
            `${typeof options.fmt === 'string' ? options.fmt : 's16le'}`,
            '-ar',
            '48000',
            '-ac',
            '2',
        ]
    }
    if (!isNaN(options.seek)) {
        FFmpegArgs.unshift('-ss', options.seek.toString())
    }
    if (Array.isArray(options.encoderArgs)) {
        FFmpegArgs = FFmpegArgs.concat(options.encoderArgs)
    }
    let transcoder = new FFmpeg({
        args: FFmpegArgs,
        shell: false,
    })
    if (typeof stream !== 'string') {
        transcoder = stream.pipe(transcoder)
        stream.on('error', () => transcoder.destroy())
    }
    if (options && !options.opusEncoded) {
        transcoder.on('close', () => transcoder.destroy())
        return transcoder
    }
    const opus = new Opus.Encoder({
        rate: 48000,
        channels: 2,
        frameSize: 960,
    })
    const outputStream = transcoder.pipe(opus)
    outputStream.on('close', () => {
        transcoder.destroy()
        opus.destroy()
    })
    return outputStream
}

StreamDownloader.arbitraryStream = arbitraryStream

const DiscordYTDLCore = Object.assign(StreamDownloader, ytdl)

export default DiscordYTDLCore