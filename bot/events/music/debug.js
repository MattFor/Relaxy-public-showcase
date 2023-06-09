'use strict'

import Relaxy from '../../../src/Relaxy.js'

/**
 * @param {Relaxy} client
 * @param {String} message
 */
export default (client, queue, message) => {
    return client.log(message, 'DEBUG')
}