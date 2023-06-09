'use strict'

import Discord from 'discord.js'
import Relaxy from '../../Relaxy.js'
import fs from 'fs'


export default class Request {
    /**
     * Construct a Relaxy request.
     * @param {Discord.Message} message 
     * @param {Relaxy} client 
     */
    constructor(message, client) {
        let r = Number(fs.readFileSync('./bot/configuration/request_number.ini').toString()) + 1

        fs.writeFileSync('./bot/configuration/request_number.ini', r.toString())

        this.time = Date.now()
        this.number = r
        this.author_id = message.author.id
        this.content = message.content
        this.attachment = message.attachments.first()
        this.shard_id = client.data.id
    }
}