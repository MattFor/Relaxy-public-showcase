'use strict'

import Relaxy from '../../../src/Relaxy.js'
import Player from '../../../src/MusicPlayer/Player.js'

/**
 * Emitted when a track starts playing.
 * @param {Relaxy} client 
 * @param {Player.Player.Track} track
 */
export default (client, queue, track) => {
    const message = queue.message

    track = queue.current

    client.send(message.channel, null, [{
        thumbnail: {
            url: 'attachment://file.gif'
        },
        color: client.data.embedColor,
        title: track.title,
        url: track.url,
        description: `Server: **${client.utils.cstr(message.guild.name)}**\nChannel: **${client.utils.cstr(message.guild.me.voice.channel.name)}**\nRequested by: **${track.requestedBy}**`,
        author: {
            name: queue.JUMPED ? 'Jumped to:' : 'Now playing:',
            icon_url: client.config.text.links.musicImage
        }
    }], [{
        attachment: track.thumbnail === '' ? './additions/images/mp3.gif' : queue.current.thumbnail,
        name: 'file.gif'
    }])

    if (queue.JUMPED)
        queue.JUMPED = false
}