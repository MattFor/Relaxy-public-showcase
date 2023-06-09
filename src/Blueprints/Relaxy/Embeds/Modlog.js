'use strict'

import fs from 'fs'


const footer_image_url = JSON.parse(fs.readFileSync('./bot/configuration/key.ini')).image


export default class ModLogEmbed {
    constructor(options, files) {
        let embed = {
            color: options.color === 'bad' ? 16711680 : options.color === 'good' ? 65280 : 16738740,
            title: `**Event |** \`${options.event}\``,
            footer: { text: 'Event emitted', iconURL: footer_image_url },
            timestamp: new Date()
        }

        if (options.thumbnail)
            embed.thumbnail = { url: options.thumbnail }

        if (options.fields)
            embed.fields = options.fields

        if (options.description)
            embed.description = options.description

        if (options.title)
            embed.title = options.title
        
        if (options.author)
            embed.author = options.author

        if (options.image)
            embed.image = options.image

        return embed
    }
}