'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'save',
    args: true,
    cooldown: 2,
    usage: '=save filename file',
    description: 'Filename is the \'codename\' of the file you want to save.\nThe file can be either text, or any other kind of file! (except .txt)',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        if (!args[0] && !message.attachments.size > 0)
            return new client.class.error(`No files to save provided!`, interaction ?? message)

        if (!args[0] && message.attachments.size > 0)
            return new client.class.error(`No filename given!`, interaction ?? message)

        if (args[2] && message.attachments.size > 0)
            return new client.class.error(`Can store text OR something else, not both at once!`, interaction ?? message)

        if (args[0] && !args[1] && !message.attachments.size > 0)
            return new client.class.error(`File name given with no text to store!`, interaction ?? message)

        if (args[0].length > 40)
            return new client.class.error('The name of the file cannot exceed 40 characters!', interaction ?? message)

        client.module.profiles.Achievement(message, 'saved', guild)

        return client.module.files.give(new client.class.fileRequestPacket(message))
    }
}