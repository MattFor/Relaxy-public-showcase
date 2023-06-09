'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Handle a guild being deleted.
     * @param {Relaxy} client 
     * @param {Discord.Guild} guild
     */
    run(client, guild) {
        client.log(`Left ${guild.name??'Unavailable'}`, 'ERROR')

        if (client.data.id !== 0)
            return

        return client.clog(`${guild.name} - \`${guild.id}\``, 'LEFT GUILD', 'bad')
    }
}