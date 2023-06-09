'use strict'

import { Options, IntentsBitField, Partials } from 'discord.js'
import Relaxy from '../src/Relaxy.js'

const intentions = [
    'Guilds',
    'GuildMembers',
    'GuildModeration',
    'GuildBans',
    'GuildEmojisAndStickers',
    'GuildIntegrations',
    'GuildInvites',
    'GuildVoiceStates',
    'GuildPresences',
    'GuildMessages',
    'GuildMessageReactions',
    'DirectMessages',
    'DirectMessageReactions',
    'MessageContent'
]

const intents = new IntentsBitField()
for (let x of intentions)
    intents.add(x)

const client = new Relaxy({
    defaultClient: {
        fetchAllMembers: true,
        intents: intents,
        partials: [Partials.Channel, Partials.Message, Partials.Reaction],
        makeCache: Options.cacheWithLimits({
            GuildMemberManager: {
                maxSize: 1000
            },
            UserManager: {
                maxSize: 1000
            }
        }),
    },
    process: process,
})

client.setMaxListeners(12)
client.loadCommands()

setInterval(async() => {
    if (!client.logs.debug)
        return 

    return new Promise(() => {
    client.log(`\n\n-------------------------------------
[Shard Uptime: ${client.imports.time(client.uptime)}]
[Process uptime: ${client.imports.time(process.uptime() * 1000)}]

Packets: ${client.data.recent_packets}
WM Managed: ${client.monitor.mutes}
Unmutes: ${client.monitor.unmutes}
Connections: ${client.voice.size !== 0 ? client.voice.adapters.size : '0'}
Queues: ${client.module.music.queues.size}
Reminds: ${client.monitor.reminds}

{Memory total: ${process.memoryUsage().heapTotal / 1024 / 1024}MB}
{Memory used: ${process.memoryUsage().heapUsed / 1024 / 1024}MB}
-------------------------------------`)
})
}, 60 * 60 * 1000)