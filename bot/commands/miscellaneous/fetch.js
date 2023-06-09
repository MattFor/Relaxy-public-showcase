'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'fetch',
    args: true,
    usage: '=fetch filename',
    description: 'Relaxy returns the file you saved with filename.',
    permissionsBOT: ['ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return client.module.files.give(new client.class.fileRequestPacket(message))
    }
}