'use strict'

import Manager from '../src/Manager.js'
import fs from 'fs'

const config = JSON.parse(fs.readFileSync('./bot/configuration/key.ini').toString())
const RelaxyManager = new Manager({
    respawn: true,
    mode: 'process',
    process: process,
    token: config.keys.token,
    dirname: config.paths.projectDir,
    client_file: config.paths.clientFile,
    shardArgs: config.keys.client.execArgs2,
    totalShards: config.keys.manager.shardCount,
    execute_arguments: config.keys.client.execArgs,
    shardsPerCluster: config.keys.manager.shardsPerCluster,
})

const shardReadyTimer = setInterval(() => {
    if (RelaxyManager.readyShards.length !== RelaxyManager.totalShards) 
        return

    clearInterval(shardReadyTimer)
    setTimeout(() => RelaxyManager.info('Cluster Manager', 'All shards have spawned!'), 3000)
}, 1000)