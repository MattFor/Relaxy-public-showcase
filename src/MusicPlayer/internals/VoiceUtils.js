'use strict'

import { Collection } from 'discord.js'
import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice'
import { StreamDispatcher } from './StreamDispatcher.js'

const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
    const newUdp = Reflect.get(newNetworkState, 'udp')
    clearInterval(newUdp?.keepAliveInterval)
}

class VoiceUtils {
    constructor() {
        /**
         * The cache where voice utils stores stream managers
         * @type {Collection<Snowflake, StreamDispatcher>}
         */
        this.cache = new Collection()
    }

    /**
     * Joins a voice channel, creating basic stream dispatch manager
     * @param {StageChannel|VoiceChannel} channel The voice channel
     * @param {object} [options={}] Join options
     * @returns {Promise<StreamDispatcher>}
     */
    async connect(channel, options) {
        const conn = await this.join(channel, options)
        const sub = new StreamDispatcher(conn, channel, options.maxTime)
        this.cache.set(channel.guild.id, sub)
        return sub
    }

    /**
     * Joins a voice channel
     * @param {StageChannel|VoiceChannel} [channel] The voice/stage channel to join
     * @param {object} [options={}] Join options
     * @returns {VoiceConnection}
     */
    async join(channel, options = {}) {
        const conn = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: !!options.deaf,
            debug: true,
        })

        conn.on('debug', (debug) => {
            console.log(debug)
        })
        
        conn.on('stateChange', (oldState, newState) => {
            const networking = Reflect.get(newState, 'networking')
            if (networking)
                networking.on('stateChange', networkStateChangeHandler)

            const oldNetworking = Reflect.get(oldState, 'networking')
            if (oldNetworking)
                oldNetworking.off('stateChange', networkStateChangeHandler)
        })
        
        try {
            return entersState(
                conn,
                VoiceConnectionStatus.Ready,
                options.maxTime ?? 20000
            )
        } catch (error) {
            conn.destroy()
            throw error
        }
    }

    /**
     * Disconnects voice connection
     * @param {VoiceConnection} connection The voice connection
     * @returns {void}
     */
    disconnect(connection) {
        if (connection instanceof StreamDispatcher)
            return connection.voiceConnection.destroy()
        return connection.destroy()
    }

    /**
     * Returns Discord Player voice connection
     * @param {Snowflake} guild The guild id
     * @returns {StreamDispatcher}
     */
    getConnection(guild) {
        return this.cache.get(guild)
    }
}

export { VoiceUtils }
