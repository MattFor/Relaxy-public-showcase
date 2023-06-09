'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle a guild being created.
     * @param {Relaxy} client 
     * @param {Discord.Guild} guild
     */
    async run(client, guild) {
        return client.core.joinNewGuild(guild)
    }
}