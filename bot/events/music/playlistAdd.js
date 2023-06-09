'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'
import Player from '../../../src/MusicPlayer/Player.js'

/**
 * Emitted when a playlist is added to the queue.
 * @param {Relaxy} client 
 * @param {Discord.Message} message 
 * @param {Player.Queue} queue 
 * @param {Player.Player.Playlist} playlist 
 */
export default async(client, message, queue, playlist) => {
    
    let flag = false

    setTimeout(() => {
        if (queue.tracks.length - 1 === playlist.tracks.length && queue.current.title !== playlist.tracks[0].title) return flag = true

        if (flag) return

        return client.send(message.channel, null, [{
                color: client.data.embedColor,
                author: {
                    name: `${client.utils.firstLetterUp(playlist.title)} consisting of ${playlist.tracks.length + 1} songs has been added to the queue!`,
                    icon_url: client.config.text.links.musicImage
                }
            }]
        )
    }, 100)
}