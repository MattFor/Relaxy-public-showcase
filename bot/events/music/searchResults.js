'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'
import Player from '../../../src/MusicPlayer/Player.js'

const optimizeTrackMapString = (String) => {
    try {
        String = String.replaceAll('~', '\\~').replaceAll('|', '\\|').replaceAll('_', '\\_').replaceAll('*', '\\*').replaceAll('`', '\\`')
    } catch {}

    let split = String.split('\n')
    let reference_indexes = 0
    let temporary_string

    for (let i = 0; i < split.length; i++) {
        temporary_string += split[i]

        if (temporary_string.length > 2047)
            return split.slice(reference_indexes, 1).join('\n')

        reference_indexes++
    }

    return String
}

/**
 * Emitted when =search is used
 * @param {Relaxy} client 
 * @param {Discord.Message} message 
 * @param {String} query
 * @param {Player.Player.Track[]} tracks
 */
export default async(client, message, query, tracks) => {
    let trackMapToOptimizedString = optimizeTrackMapString(tracks.map((track, i) => `${i < 15 ? `[śFLAG1Ś]${i + 1}.[śFLAG1Ś] - [ąFLAG2Ą][${track.title}](${track.url})[ąFLAG2Ą]` : ``}`).join('\n').toString())
    trackMapToOptimizedString = trackMapToOptimizedString.replaceAll('[śFLAG1Ś]', '\`').replaceAll('[ąFLAG2Ą]', '**')

  return client.send(message.channel, null, [{
        color: client.data.embedColor,
        author: {
          name: `Searches for: ${client.utils.firstLetterUp(query)}`,
          icon_url: client.config.text.links.musicImage
        },
        footer: client.data.footer,
        timestamp: new Date(),
        thumbnail: { url: tracks[0].thumbnail },
        description: trackMapToOptimizedString
      }
    ])
}