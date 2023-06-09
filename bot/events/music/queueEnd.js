'use strict'

import Relaxy from '../../../src/Relaxy.js'
import Player from '../../../src/MusicPlayer/Player.js'

/**
 * Emitted when the queue is empty.
 * @param {Relaxy} client 
 * @param {Player.Player.Queue} queue 
 */
export default async(client, queue) => {
    if (queue.EMPTY) return
    return new client.class.error('Music stopped, queue ended!', queue.message)
}