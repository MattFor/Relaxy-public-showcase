'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'trade',
    usage: '=trade user(MENTION/ID ONLY!) ITEM_ID (money + money_count) / ITEM_ID',
    permissionsBOT: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
    description: 'Trade an item with another user! Follow one of these command structures:\n**=trade MattFor 1 2**\n`OR`\n**=trade MattFor 1 money 300**\nPro tip: should you want to trade for nothing, just do money0 ;)',
    args: true,
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        return client.module.profiles.ProcessTrade(message, args)
    }
}