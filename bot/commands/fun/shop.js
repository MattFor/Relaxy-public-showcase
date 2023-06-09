'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'shop',
    usage: '=shop',
    description: '**Show the Relaxy shop!**',
    cooldown: 7,
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return client.module.profiles.getShopEmbed(message).then((shop) => {
            return client.send(message.channel, null, shop[0], shop[1])
        })
    }
}