'use strict'

import { AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, StreamType, VoiceConnectionStatus, VoiceConnectionDisconnectReason } from '@discordjs/voice'
import { TypedEmitter as EventEmitter } from 'tiny-typed-emitter'
import { Util } from '../utils/Util.js'

class StreamDispatcher extends EventEmitter {
    /**
     * Creates new connection object
     * @param {VoiceConnection} connection The connection
     * @param {VoiceChannel|StageChannel} channel The connected channel
     * @private
     */
    constructor(connection, channel, connectionTimeout = 20000) {
        super()
        this.connectionTimeout = connectionTimeout
        this.readyLock = false
        /**
         * The voice connection
         * @type {VoiceConnection}
         */
        this.voiceConnection = connection;
        /**
         * The audio player
         * @type {AudioPlayer}
         */
        this.audioPlayer = createAudioPlayer();
        /**
         * The voice channel
         * @type {VoiceChannel|StageChannel}
         */
        this.channel = channel;
        /**
         * The paused state
         * @type {boolean}
         */
        this.paused = false;
        this.voiceConnection.on('stateChange', async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    try {
                        await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, this.connectionTimeout);
                    }
                    catch (_a) {
                        try {
                            this.voiceConnection.destroy();
                        } catch {}
                    }
                }
                else if (this.voiceConnection.rejoinAttempts < 5) {
                    await Util.wait((this.voiceConnection.rejoinAttempts + 1) * 5000);
                    this.voiceConnection.rejoin();
                }
                else {
                    try {
                        this.voiceConnection.destroy();
                    } catch {}
                }
            }
            else if (newState.status === VoiceConnectionStatus.Destroyed) {
                this.end();
            }
            else if (!this.readyLock && (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)) {
                this.readyLock = true;
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, this.connectionTimeout);
                }
                catch (_b) {
                    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed)
                    try {
                        this.voiceConnection.destroy();
                    } catch {}
                }
                finally {
                    this.readyLock = false;
                }
            }
        });
        this.audioPlayer.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Playing) {
                if (!this.paused)
                    return void this.emit('start', this.audioResource);
            }
            else if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                if (!this.paused) {
                    void this.emit('finish', this.audioResource);
                    this.audioResource = null;
                }
            }
        });
        this.audioPlayer.on('debug', (m) => void this.emit('debug', m));
        this.audioPlayer.on('error', (error) => void this.emit('error', error));
        this.voiceConnection.subscribe(this.audioPlayer);
    }

    /**
     * Creates stream
     * @param {Readable|Duplex|string} src The stream source
     * @param {object} [ops={}] Options
     * @returns {AudioResource}
     */
    createStream(source, options = {}) {
        const { type = StreamType.Arbitrary, data } = options
        const audioResource = createAudioResource(source, {
            inputType: type,
            metadata: data,
            inlineVolume: true,
        })
        return audioResource
    }

    /**
     * The player status
     * @type {AudioPlayerStatus}
     */
    get status() {
        return this.audioPlayer.state.status
    }

    /**
     * Disconnects from voice
     * @returns {void}
     */
    disconnect() {
        try {
            this.audioPlayer.stop(true)
            try {
                this.voiceConnection.destroy()
            } catch {}
        } catch {}
    }

    /**
     * Stops the player
     * @returns {void}
     */
    end() {
        this.audioPlayer.stop()
    }
    
    /**
     * Pauses the stream playback
     * @param {boolean} [interpolateSilence=false] If true, the player will play 5 packets of silence after pausing to prevent audio glitches.
     * @returns {boolean}
     */
    pause(interpolateSilence) {
        const success = this.audioPlayer.pause(interpolateSilence)
        this.paused = success
        return success
    }

    /**
     * Resumes the stream playback
     * @returns {boolean}
     */
    resume() {
        const success = this.audioPlayer.unpause()
        this.paused = !success
        return success
    }

    /**
     * Play stream
     * @param {AudioResource<Track>} [resource=this.audioResource] The audio resource to play
     * @returns {Promise<StreamDispatcher>}
     */
    async playStream(resource = this.audioResource) {
        if (!this.audioResource)
            this.audioResource = resource

        if (this.voiceConnection.state.status !== VoiceConnectionStatus.Ready)
            try {
                await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, this.connectionTimeout)
            } catch (err) {
                return void this.emit('error', err)
            }

        try {
            this.audioPlayer.play(resource)
        } catch (e) {
            this.emit('error', e)
        }

        return this
    }

    /**
     * Sets playback volume
     * @param {number} value The volume amount
     * @returns {boolean}
     */
    setVolume(value) {
        if (!this.audioResource || isNaN(value) || value < 0 || value > Infinity)
            return false
        this.audioResource.volume.setVolumeLogarithmic(value / 100)
        return true
    }

    /**
     * The current volume
     * @type {number}
     */
    get volume() {
        if (!this.audioResource || !this.audioResource.volume)
            return 100
        const currentVol = this.audioResource.volume.volume
        return Math.round(Math.pow(currentVol, 1 / 1.660964) * 100)
    }

    /**
     * The playback time
     * @type {number}
     */
    get streamTime() {
        if (!this.audioResource)
            return 0
        return this.audioResource.playbackDuration
    }
}

export { StreamDispatcher as StreamDispatcher }
