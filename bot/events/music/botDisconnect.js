'use strict'

import Relaxy from '../../../src/Relaxy.js'

/**
 * Emitten when the bot is kicked from a channel.
 * @param {Relaxy} client 
 */
export default async(client, queue) => {
    if (queue.state === 'recording') 
        return
    
    return new client.class.error('Music stopped, you kicked me from the channel!', queue.message)
}