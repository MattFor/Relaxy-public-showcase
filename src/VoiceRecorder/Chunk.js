'use strict'

import opus from '@discordjs/opus'
const OpusEncoder = opus.OpusEncoder

import { Readable, Writable } from 'stream'
import { getChunkTimeMs, getLastStopTime, secondsToBuffer, syncStream } from './VoiceUtilities.js'

export default class Chunk extends Writable {
    constructor(lifeTimeMs, sampleRate, numChannels, getUserSpeakingTime, options) {
        const adjustedOptions = Object.assign({
            length: 1048576,
            highWaterMark: 32,
            dropInterval: 1e3
        }, options)
    
        super(adjustedOptions)
    
        this.getUserSpeakingTime = getUserSpeakingTime
        const chunkTimeMs = 20
        const bytesPerElement = 2
        this._readableOptions = adjustedOptions
        this._encoder = new OpusEncoder(sampleRate, numChannels)
        this.encodingOptions = {
            numChannels,
            sampleRate,
            chunkSize: (chunkTimeMs / 1000) * sampleRate * numChannels * Uint8Array.BYTES_PER_ELEMENT * bytesPerElement,
            bytesPerElement,
        }
        this._highWaterMark = adjustedOptions.highWaterMark
        this._bufArrLength = adjustedOptions.length
        this._bufArr = []
        this._waiting = null
        this.fadeOutInterval = setInterval(() => {
            this.fadeOutCheck(lifeTimeMs)
        }, 5000)
    }

    get startTimeOfNextChunk() {
        return this._startTimeOfNextChunk
    }

    set startTimeOfNextChunk(time) {
        if (this._startTimeOfChunkBefore && time)
            syncStream(this._bufArr, this._startTimeOfChunkBefore, time, this.encodingOptions)

        this._startTimeOfNextChunk = this._startTimeOfChunkBefore = time
    }

    get startTimeMs() {
        return this._bufArr[0]?.startTime ?? Date.now()
    }

    _write(chunk, encoding, callback) {
        const userStartedSpeaking = this.getUserSpeakingTime()
        const userJustBeganSpeaking = userStartedSpeaking !== this._startTimeOfChunkBefore
        
        if (userJustBeganSpeaking)
            this.startTimeOfNextChunk = userStartedSpeaking

        const addTime = this.getStartTimeOfNextChunk()
        chunk = this.decodeChunk(chunk)
        const startTimeOfNewChunk = userJustBeganSpeaking ? addTime : getLastStopTime(this._bufArr)
        
        this._bufArr.push({
            chunk,
            encoding,
            startTime: startTimeOfNewChunk,
            stopTime: startTimeOfNewChunk + getChunkTimeMs(chunk, this.encodingOptions.sampleRate, this.encodingOptions.numChannels, this.encodingOptions.bytesPerElement)
        })

        this.checkAndDrop(callback)
        this.emit('wrote')
    }

    _writev(chunks, callback) {
        this.emit('wrote')
    }

    _destroy(error, callback) {
        clearInterval(this.fadeOutInterval)
        super._destroy(error, callback)
    }

    drop() {
        if (this._bufArr.length > this._bufArrLength)
            this.emit('drop', this._bufArr.splice(0, this._bufArr.length - this._bufArrLength).length)
    }

    rewind(startTime, stopTime) {
        const ret = new Readable({
            highWaterMark: this._readableOptions.highWaterMark, read: () => {
                for (let i = this.writeSkipAndDelay(ret, startTime); i < this._bufArr.length && this._bufArr[i].startTime < stopTime; ++i) {
                    const element = this._bufArr[i]
                    const resp = ret.push(element.chunk, element.encoding)

                    if (!resp)
                        break
                }
    
                ret.push(null)
            }
        })

        return ret
    }

    writeSkipAndDelay(ret, startTime) {
        for (let i = 0; i < this._bufArr.length; ++i) {
            const element = this._bufArr[i]

            if (element.startTime >= startTime) {
                // add delay time till start time of user
                const delayTimeSec = (element.startTime - startTime) / 1000

                if (delayTimeSec > 0) {
                    const buffers = secondsToBuffer(delayTimeSec, this.encodingOptions)
                    for (const buffer of buffers)
                        ret.push(buffer, this._bufArr[0].encoding)
                }
            
                return i
            }
        }

        return this._bufArr.length
    }

    checkAndDrop(callback) {
        if (this._bufArr.length > this._bufArrLength) {
            this._waiting = callback
            this.drop()
        } else
            callback()
    }
    
    getStartTimeOfNextChunk() {
        const time = this.startTimeOfNextChunk || getLastStopTime(this._bufArr) || Date.now()
        this._startTimeOfNextChunk = undefined
        return time
    }

    decodeChunk(chunk) {
        return this._encoder.decode(chunk)
    }

    fadeOutCheck(lifeTime) {
        const newDate = Date.now()
        let dropped = 0

        while (dropped < this._bufArr.length && (newDate - this._bufArr[dropped].startTime) > lifeTime) {
            ++dropped
        }

        if (dropped) {
            this._bufArr.splice(0, dropped)
            this.emit('drop', dropped)
        }
    }
}