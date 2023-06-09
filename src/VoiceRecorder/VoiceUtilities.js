'use strict'

export function addSilentTime(bufArr, timeMs, encoding, options) {
    let endTimeBefore = getLastStopTime(bufArr)
    if (timeMs <= 0 || !endTimeBefore)
        return

    const silentBuffers = secondsToBuffer(timeMs / 1_000, options)
    if (!silentBuffers.length)
        return

    const step = timeMs / silentBuffers.length
    for (const chunk of silentBuffers) {
        bufArr.push({ chunk, encoding, startTime: endTimeBefore, stopTime: endTimeBefore + step })
        endTimeBefore += step
    }
}

export function secondsToBuffer(seconds, options) {
    const bytes = secondsToBytes(seconds, options.sampleRate, options.numChannels, options.bytesPerElement)
    return bytesToBuffer(bytes, options.chunkSize)
}

export function syncStream(bufArr, chunkStartTimeBefore, chunkStartTimeNew, encodingOptions) {
    const timeFromStartToStart = chunkStartTimeNew - chunkStartTimeBefore
    const recordTime = getRecordTimeTillEnd(bufArr, chunkStartTimeBefore, encodingOptions.sampleRate, encodingOptions.numChannels, encodingOptions.bytesPerElement)
    addSilentTime(bufArr, timeFromStartToStart - recordTime, 'buffer', encodingOptions)
}

export function getLastStopTime(bufArr) {
    return bufArr[bufArr.length - 1]?.stopTime
}

function bytesToBuffer(bytes, chunkSize) {
    const silentPerChunk = Math.floor(bytes / chunkSize)
    const buffers = []

    for (let i = 0; i < silentPerChunk; ++i)
        buffers.push(Buffer.alloc(chunkSize))

    return buffers
}

function secondsToBytes(silenceTimeSec, sampleRate, numChannels, bytesPerElement) {
    const totalSamples = silenceTimeSec * sampleRate
    return totalSamples * numChannels * bytesPerElement
}

export function getChunkTimeMs(chunk, sampleRate, numChannels, bytesPerElement) {
    const totalSamples = chunk.byteLength / bytesPerElement / numChannels
    return (totalSamples / sampleRate) * 1_000
}

function getRecordTimeTillEnd(bufArr, startTime, sampleRate, numChannels, bytesPerElement) {
    return bufArr.reduce((accTime, element) => {
        const time = element.startTime < startTime ? 0 : getChunkTimeMs(element.chunk, sampleRate, numChannels, bytesPerElement)
        return accTime + time
    }, 0)
}