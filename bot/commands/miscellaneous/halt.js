'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'

export default {
    name: 'halt',
    permissionsBOT: ['ATTACH_FILES'],
    usage: '=halt',
    description: 'Stop recording with Relaxy!\Recording also stops when you kick Relaxy! or all users leave a channel.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return await client.module.recorder.Halt(message).catch((e) => {console.log(e)})
    }
}