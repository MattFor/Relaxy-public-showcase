'use strict'

import * as net from 'net'
import { resolve } from 'path'
import Chunk from './Chunk.js'
import archiver from 'archiver'
import ffmpeg from 'fluent-ffmpeg'
import { randomUUID } from 'crypto'
import { PassThrough } from 'stream'
import { platform, tmpdir } from 'os'

class VoiceRecorder {
    constructor(options = {}, discordClient) {
        this.discordClient = discordClient;
        this.writeStreams = {};
        const { maxUserRecordingLength = 100, maxRecordTimeMs = 10, sampleRate = 16000, channelCount = 2 } = options;
        this.options = {
            maxUserRecordingLength: maxUserRecordingLength * 1024 * 1024,
            maxRecordTimeMs: maxRecordTimeMs * 60 * 1000,
            sampleRate,
            channelCount
        }
    }

    /**
     * 
     * @param {Voice.VoiceConnection} connection 
     * @returns 
     */
    startRecording(connection, guildId) {
        if (this.writeStreams[guildId])
            return

        const listener = (userId) => {
            var _a;
            const streams = (_a = this.writeStreams[guildId]) === null || _a === void 0 ? void 0 : _a.userStreams[userId];
            if (streams)
                return

            this.startRecordStreamOfUser(guildId, userId, connection)
        }

        this.writeStreams[guildId] = {
            userStreams: {},
            listener
        }

        connection.receiver.speaking.on('start', listener)
    }

    startRecordStreamOfUser(guildId, userId, connection) {
        const serverStream = this.writeStreams[guildId];
        if (!serverStream) {
            return;
        }
        const recordStream = new Chunk(this.options.maxRecordTimeMs, this.options.sampleRate, this.options.channelCount, () => connection.receiver.speaking.users.get(userId), {
            highWaterMark: this.options.maxUserRecordingLength,
            length: this.options.maxUserRecordingLength
        });
        const opusStream = connection.receiver.subscribe(userId, {
            end: {
                behavior: 1,
                duration: this.options.maxRecordTimeMs,
            },
        });
        opusStream.on('error', (error) => {
            console.error(error, `Error while recording voice for user ${userId} in server: ${guildId}`);
        });
        opusStream.on('end', () => {
            this.stopUserRecording(guildId, userId);
        });
        opusStream.pipe(recordStream, { end: false });
        serverStream.userStreams[userId] = { out: recordStream, source: opusStream };
    }

    stopRecording(connection, guildId) {
        const serverStreams = this.writeStreams[guildId]

        if (!serverStreams)
            return

        try { 
            connection.receiver.speaking.removeListener('start', serverStreams.listener)
        } catch {}

        for (const userId in serverStreams.userStreams)
            this.stopUserRecording(guildId, userId)

        delete this.writeStreams[guildId]
    }

    stopUserRecording(guildId, userId) {
        const serverStreams = this.writeStreams[guildId]
        if (!serverStreams)
            return

        const userStream = serverStreams.userStreams[userId]
        if (!userStream)
            return

        userStream.source.destroy()
        userStream.out.destroy()
        delete serverStreams.userStreams[userId]
    }

    async getRecordedVoice(writeStream, guildId, exportType = 'single', minutes = 10, userVolumes = {}) {
        const serverStream = this.writeStreams[guildId];
        if (!serverStream) {
            console.warn(`server with id ${guildId} does not have any streams`, 'Record voice');
            return false;
        }
        const minStartTimeMs = this.getMinStartTime(guildId);
        if (!minStartTimeMs) {
            return false;
        }
        const recordDurationMs = Math.min(Math.abs(minutes) * 60 * 1000, this.options.maxRecordTimeMs);
        const endTimeMs = Date.now();
        const maxRecordTime = endTimeMs - recordDurationMs;
        const startRecordTime = Math.max(minStartTimeMs, maxRecordTime);
        const recordMethod = (exportType === 'single' ? this.generateMergedRecording : this.generateSplitRecording).bind(this);
        return recordMethod(serverStream.userStreams, startRecordTime, endTimeMs, writeStream, userVolumes);
    }

    async getRecordedVoiceAsBuffer(guildId, exportType = 'single', minutes = 10, userVolumes = {}) {
        const bufferStream = new PassThrough()
        const buffers = []

        const bufferPromise = new Promise((resolve) => {
            bufferStream.on('finish', resolve)
            bufferStream.on('error', resolve)
        })

        bufferStream.on('data', (data) => {
            buffers.push(data)
        })

        const result = await this.getRecordedVoice(bufferStream, guildId, exportType, minutes, userVolumes)
        if (!result)
            return Buffer.from([])

        await bufferPromise
        return Buffer.concat(buffers)
    }

    getRecordedVoiceAsReadable(guildId, exportType = 'single', minutes = 10, userVolumes = {}) {
        const passThrough = new PassThrough({ allowHalfOpen: true })
        void this.getRecordedVoice(passThrough, guildId, exportType, minutes, userVolumes)
        return passThrough
    }

    generateMergedRecording(userStreams, startRecordTime, endTime, writeStream, userVolumes) {
        return new Promise((resolve, reject) => {
            const { command, openServers } = this.getFfmpegSpecs(userStreams, startRecordTime, endTime, userVolumes);
            if (!openServers.length) {
                return resolve(false);
            }
            command
                .on('end', () => {
                openServers.forEach(server => server.close());
                resolve(true);
            })
                .on('error', (error) => {
                openServers.forEach(server => server.close());
                reject(error);
            })
                .outputFormat('mp3')
                .writeToStream(writeStream, { end: true });
        })
    }

    async generateSplitRecording(userStreams, startRecordTime, endTime, writeStream, userVolumes) {
        const archive = archiver('zip')
        const userIds = Object.keys(userStreams)

        if (!userIds.length)
            return false

        for (const userId of userIds) {
            const passThroughStream = this.getUserRecordingStream(userStreams[userId].out.rewind(startRecordTime, endTime), userId, userVolumes)
            const username = await this.getUsername(userId)

            archive.append(passThroughStream, {
                name: `${username}.mp3`
            })
        }

        return new Promise((resolve, reject) => {
            archive.on('end', () => resolve(true)).on('error', reject).pipe(writeStream, { end: true })
            archive.finalize()
        })
    }

    async getUsername(userId) {
        if (this.discordClient) 
            try {
                const { username } = await this.discordClient.users.fetch(userId)
                return username
            } catch (error) {
                console.error(`Username of userId: ${userId} can't be fetched!`, error)
            }

        return userId
    }

    getUserRecordingStream(stream, userId, userVolumes) {
        const passThroughStream = new PassThrough({ allowHalfOpen: false })

        ffmpeg(stream).inputOptions(this.getRecordInputOptions()).audioFilters([{
            filter: 'volume',
            options: ((this.getUserVolume(userId, userVolumes)) / 100).toString()
        }]).outputFormat('mp3').output(passThroughStream, { end: true }).run()

        return passThroughStream
    }

    getUserVolume(userId, userVolumes) {
        var _a;
        return (_a = userVolumes === null || userVolumes === void 0 ? void 0 : userVolumes[userId]) !== null && _a !== void 0 ? _a : 100;
    }

    getMinStartTime(guildId) {
        var _a, _b;
        let minStartTime
        const userStreams = (_b = (_a = this.writeStreams[guildId]) === null || _a === void 0 ? void 0 : _a.userStreams) !== null && _b !== void 0 ? _b : {};
        
        for (const userId in userStreams) {
            const startTime = userStreams[userId].out.startTimeMs
            if (!minStartTime || (startTime < minStartTime))
                minStartTime = startTime
        }

        return minStartTime
    }

    getFfmpegSpecs(streams, startRecordTime, endTimeMs, userVolumesDict) {
        let ffmpegOptions = ffmpeg();
        const amixStrings = [];
        const volumeFilter = [];
        const openServers = [];
        for (const userId in streams) {
            const stream = streams[userId].out;
            try {
                const output = `[s${volumeFilter.length}]`;
                const { server, url } = this.serveStream(stream, startRecordTime, endTimeMs);
                ffmpegOptions = ffmpegOptions
                    .addInput(url)
                    .inputOptions(this.getRecordInputOptions());
                volumeFilter.push({
                    filter: 'volume',
                    options: [(this.getUserVolume(userId, userVolumesDict) / 100).toString()],
                    inputs: `${volumeFilter.length}:0`,
                    outputs: output,
                });
                openServers.push(server);
                amixStrings.push(output);
            }
            catch (e) {
                console.error(e, 'Error while saving user recording');
            }
        }
        return {
            command: ffmpegOptions.complexFilter([
                ...volumeFilter,
                {
                    filter: `amix=inputs=${volumeFilter.length}`,
                    inputs: amixStrings.join(''),
                }
            ]),
            openServers,
        };
    }

    getRecordInputOptions() {
        return [`-f ${VoiceRecorder.PCM_FORMAT}`, `-ar ${this.options.sampleRate}`, `-ac ${this.options.channelCount}`]
    }
    
    serveStream(stream, startRecordTime, endTimeMs) {
        let socketPath = '', url = ''

        if (platform() === 'win32')
            socketPath = url = `\\\\.\\pipe\\${randomUUID()}`
        else {
            socketPath = resolve(VoiceRecorder.tempPath, `${randomUUID()}.sock`)
            url = `unix:${socketPath}`
        }

        const server = net.createServer((socket) => stream.rewind(startRecordTime, endTimeMs).pipe(socket))
        server.listen(socketPath)

        return {
            url,
            server
        }
    }
}

VoiceRecorder.PCM_FORMAT = 's16le'
VoiceRecorder.tempPath = tmpdir()
export default VoiceRecorder