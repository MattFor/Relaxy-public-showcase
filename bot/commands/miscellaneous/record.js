'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'

export default {
    name: 'record',
    alisases: ['rec', 'startrecord', 'startrec'],
    permissionsBOT: ['CONNECT', 'SPEAK', 'ATTACH_FILES'],
    usage: '=record',
    description: 'Relaxy starts recording the current voice channel, doesn\'t work if any music is playing.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return client.module.recorder.Record(message)
    }
}