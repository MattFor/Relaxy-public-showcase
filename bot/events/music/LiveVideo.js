'use strict'

import Relaxy from '../../../src/Relaxy.js'

/**
 * Emitted when someone tries to play a livestream video.
 * @param {Relaxy} client 
 */
export default async(client, message) => {
    return new client.class.error('Cannot play a live video!', message)
}