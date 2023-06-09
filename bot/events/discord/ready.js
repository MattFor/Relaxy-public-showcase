'use strict'

import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * Emitted at bot logon.
     * @param {Relaxy} client
     */
    async run(client) {
        let timeout = 0
        const readyInterval = setInterval(() => {
            if (client.data.ready || timeout >= 20) {
                clearInterval(readyInterval)
                return client.core.Status()
            }
            timeout++
        }, 100)

        client.core.WelcomeMessage() 
        client.core.Modlogs()
        client.core.Reminds()
        client.core.Mutes()
        await client.startQueues()
        client.core.ClearingChannels()

        setTimeout(() => {
            client.log(`Ready on ${client.guilds.cache.size} Servers with ${client.guilds.cache.map(g => g.memberCount).reduce((acc, count) => { return acc + count })} total members.`)
        }, 150)
    }
}