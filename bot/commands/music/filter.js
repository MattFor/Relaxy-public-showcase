'use strict'

import fs from 'fs'
import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


const config = JSON.parse(fs.readFileSync('./bot/configuration/key.ini').toString())
const filters = config.filters
const filtersDescription = `${Object.values(config.filters).map(filter => `\`${filter}\``).join(', ')}.`

export default {
    name: 'filter',
    args: true,
    slash: new Discord.SlashCommandBuilder()
        .addStringOption(option => option.setName('filter_name').setDescription('Search for filter names with =help filter.').setRequired(true)),
    description_slash: 'Shows current song\'s lyrics or the searched song\'s lyrics.',
    usage: '=filter (filter name)',
    description: `Apply a filter to the song currently playing and all others after that.\n**Available filters:**\n**${filtersDescription}**`,
    cooldown: 10, 
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        const queue = client.module.music.getQueue(message.guild.id)
        if (!message.member.voice.channel)
            return new client.class.error('NotConnected', interaction ?? message)

        if (!queue) 
            return new client.class.error('NotPlaying', interaction ?? message)

        if (queue ? queue.state === 'recording' : false)
            return new client.class.error('RecordingA', interaction ?? message)

        if (message.guild.me.voice && message.guild.me.voice.channel && (message.member.voice.channel.full && message.guild.me.voice.channel.id !== message.member.voice.channel.id) && message.guild.me.voice.channel.id !== message.member.voice.channel.id)   
            return new client.class.error('Voice channel is full!', interaction ?? message)

        const filter = args[0]
        if (!filter) 
            return new client.class.error('NoFilter', interaction ?? message)

        const filterToUpdate = Object.values(filters).find((f) => f.toString().toLowerCase() === filter.toLowerCase())
        if (!filterToUpdate) 
            return new client.class.error('NoFilterName', interaction ?? message)

        const filterRealName = Object.keys(filters).find((f) => filters[f] === filterToUpdate).toLowerCase()
        const queueFilters = queue._activeFilters
        if (queueFilters.size > 3) 
            return new client.class.error('TooManyFilters', interaction ?? message)

        const filtersUpdated = {}
        filtersUpdated[filterRealName] = queueFilters.includes(filterRealName) ? false : true
        queue.setFilters(filtersUpdated)

        return new client.class.error(`${filtersUpdated[filterRealName] ? 'Adding' : 'Removing'} ${args[0]}. The longer the song the longer this'll take.`, interaction ?? message)
    }
}