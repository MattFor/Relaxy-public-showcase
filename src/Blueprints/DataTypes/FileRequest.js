'use strict'

import Discord from 'discord.js'


export default class FileRequest {
    /**
     * Pack information to be sent to relaxy.
     * @param {Discord.message} message 
     */
    constructor(message) {
        this.name = message.content.split(' ')[1]
        this.command = message.content.split(' ')[0]
        this.authorID = message.author.id

        const attachment = message.attachments.first() || null

        this.data = attachment ? attachment : message.content.slice(1).trim().split(/ +/g).slice(1, message.content.slice(1).trim().split(/ +/g).length)
        
        if (!attachment) {
            this.data.shift()
            this.data = this.data.join(' ')
        }

        this.return = message
        this.type = attachment > 0 ? `${attachment.url.split(".")[attachment.url.split(".").length - 1]}` : 'txt'
        this.convert = `${message.content.split(' ')[1].replace(/[\\/:*?\"<>|]/g, "").substring(0,240)}.${attachment ? attachment.url.split(".")[attachment.url.split(".").length - 1] : 'txt'}`
    }
}