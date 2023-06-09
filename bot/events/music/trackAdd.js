'use strict'

import Relaxy from '../../../src/Relaxy.js'
import Player from '../../../src/MusicPlayer/Player.js'

/**
 * Emitted when a track is added to the queue.
 * @param {Relaxy} client 
 * @param {Player.Queue} queue
 * @param {Player.Track} track
 */
export default (client, queue, track) => {
    const message = queue.message

    if (queue.SKIPPED)
        return queue.SKIPPED = false

    return client.send(message.channel, null, [{
            thumbnail: {
                url: 'attachment://file.gif'
            },
            author: {
                name: 'Added to the queue:',
                icon_url: client.config.text.links.musicImage
            },
            color: client.data.embedColor,
            title: track.title,
            url: track.url,
            description: `Server: **${client.utils.cstr(message.guild.name)}**\nChannel: **${client.utils.cstr(message.guild.members.cache.find(m => m.user.id === track.requestedBy.id).voice.channel.name)??'Unavailable.'}**\nRequested by: **${track.requestedBy}**`
        }
    ], [{
        attachment: track.thumbnail === '' ? './additions/images/mp3.gif' : track.thumbnail,
        name: 'file.gif'
    }])
}