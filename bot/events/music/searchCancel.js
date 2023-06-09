'use strict'

import Discord from 'discord.js'
import Player from '../../../src/MusicPlayer/Player.js'

/**
 * Emitted when =search's query times out.
 * @param {Relaxy} client 
 * @param {Discord.Message} message 
 */
export default async(client, message) => {
    return new client.class.error('Input timeout, please enter the command again if you want to play music!', message)
}