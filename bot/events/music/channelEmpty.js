'use strict'

import Relaxy from '../../../src/Relaxy.js'

/**
 * Emitted when the bot is alone in a voice channel.
 * @param {Relaxy} client 
 */
export default async(client, queue) => {
    if (queue.state === 'recording') return

    let error_message = 'Music stopped, noone in the vc!'

    if (queue.state === 'idle')
        error_message = 'Left the voice chat, noone was in with me!'
        
    return new client.class.error(error_message, queue.message)
}