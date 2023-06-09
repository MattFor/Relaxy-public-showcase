'use strict'

//////////////////////////////////////////////////////////
////////////////// CORE IMPORTS /////////////////////////
////////////////////////////////////////////////////////
import os from 'os'
import fs from 'fs-extra'
import readline from 'readline'
import child_process from 'child_process'
import { RatelimitManager } from 'discord-cross-ratelimit'
import { ClusterClient, ClusterManager } from 'discord-hybrid-sharding'

//////////////////////////////////////////////////////////
////////////////// MANAGER IMPORTS //////////////////////
////////////////////////////////////////////////////////
import FileWatchManager from './Handlers/Service/FileWatcher.js'

//////////////////////////////////////////////////////////
////////////////// UTILITY IMPORTS //////////////////////
////////////////////////////////////////////////////////
import chalk from 'chalk'
import time from 'pretty-ms'
import pidUsage from 'pidusage'
import timeStamp from 'time-stamp'
import beautify from 'json-beautify'
import asciiLogo from 'asciiart-logo'
import captureConsole from 'capture-console'



// Global attributes
const MODE_SPECIAL_NORMAL = -1
const MODE_NORMAL = 0
const MODE_DEBUG = 1
const MODE_MAINTENANCE = 2
const MODE_SILENT = 3
const MODE_OFFLINE = 4

const statusText = {
    'normal': 'ONLINE',
    'debug': 'DEBUG MODE',
    'maintain': 'UNDER MAINTENANCE',
    'silent': 'ONLINE',
    'exit': 'OFFLINE'
}
const statusOperatingMode = {
    'normal': MODE_NORMAL,
    'debug': MODE_DEBUG,
    'maintain': MODE_MAINTENANCE,
    'silent': MODE_SILENT,
    'exit': MODE_OFFLINE
}


export default class RelaxyClusterManager extends ClusterManager {
    /**
     * Manager that handles all cluster interactions.
     * @param {String} options.client_file Path to client file.
     * @param {Number} options.totalShards Number of shards to spawn.
     * @param {Array<String>} options.execute_arguments Arguments to execute at cluster process startup.
     * @param {String} options.token Token used to login the cluster client.
     * @param {Boolean} options.respawn Whether or not shards should respawn when they die.
     * @param {NodeJS.Process} options.process Main process.
     */
    constructor(options) {
        super(options.client_file, {
            totalShards: options.totalShards,
            shardsPerCluster: options.shardsPerCluster,
            execArgv: options.execute_arguments,
            token: options.token,
            mode: options.mode,
            respawn: options.respawn,
            clusterOptions: { silent: true },
            shardArgs: options.shardArgs
        })

        this.log = (source, msg, color) => {
            const splitSource = source.split(' ')
            console.log(`[${chalk.grey(timeStamp('HH:mm:ss'))}] [${splitSource[0] === 'HOT' ? chalk.bold.yellow(splitSource[0]) : chalk.bold.magenta(splitSource[0])}${!splitSource[1].includes('Manager') ? chalk.bold.yellow(' ' + splitSource[1]) : chalk.bold.magenta(' ' + splitSource[1])}] => ${color(msg)}`)
        }
          
        this.info = (source, msg) => this.log(source, msg, chalk.green)
        this.warn = (source, msg) => this.log(source, msg, chalk.yellow)
        this.error = (source, msg) => this.log(source, msg, chalk.redBright)
        this.data = (source, msg) => this.log(source, msg, chalk.gray)
        this.debug = (source, msg) => this.log(source, msg, chalk.blueBright)

        // Display the logo of the bot on Cluster Manager construction
        console.log(asciiLogo({
            name: 'Relaxy!',
            font: 'Big',
            lineChars: 15,
            padding: 4,
            margin: 1
        }).render())

        /**
         * When the class was created.
         * @type {String}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.startTime = new Date().toString().slice(0, 24).replaceAll(':', '-').replaceAll(' ', '_')

        /**
         * No clue what the fuck this does
         * @type {Array<Number>}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.exception = [0]

        /**
         * Used to hold cluster server information for command 'servers'.
         * @type {Array<Number>}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.guilds = [0, 0]

        this.emojiReadyShards = 0
        this.emojiCache = []

        this.config = JSON.parse(fs.readFileSync('./bot/configuration/key.ini').toString())

        /**
         * Used to get Manager.js path.
         * @type {String}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.dirname = options.dirname

        /**
         * Queue of all cluster id showuse objects.
         * @type {Array<Object>}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.showUseQueueNew = []

        /**
         * Number in ms of when the showuse procedure started.
         * @type {Number}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.calculateStatsExecTime = null

        /**
         * How many shards are supposed to spawn.
         * @type {Number}
         * @memberof RelaxyClusterManager
         * @public
         */
        this.totalShards = options.totalShards

        /**
         * Array of client PID's
         * @type {Array<Number>}
         * @memberof RelaxyClusterManager
         * @public
         */
        this.readyShards = []

        /**
         * Cluster id of the cluster that the relaxy's request server is on.
         * @type {Number}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.relaxyRequestShardId = 0

        /**
         * If it's appropriate to display discord app interface errors.
         * @type {Boolean}
         * @memberof RelaxyClusterManager
         * @public
         */
        this.showDiscordErrors = false

        /**
         * Whether or not to display process informations.
         * @type {Boolean}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.showStats = false

        /**
         * Function that reads all input into the console window.
         * @type {readline.Interface}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.process_stdout_capture = readline.createInterface({ input: process.stdin })

        /**
         * Path to the log file of this run's stdout.
         * @type {String}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.logFilePath = `./logs/console/${this.startTime}.txt`

        /**
         * Writestream writing this run's stdout to the file mentioned above.
         * @type {fs.WriteStream}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.fileLogger = fs.createWriteStream(this.logFilePath)

        /**
         * Used to update the bot/configuration file.
         * @type {Function}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.updateConfig = () => {
            fs.writeFileSync('./bot/configuration/key.ini', beautify(this.config, null, 2, 80))
        }

        this.updateConfig()

        // Write the file used for logging this process's stdout.
        fs.writeFileSync(this.logFilePath, '__PLACEHOLDER__')

        /**
         * Cluster manager operating mode. [Influences Shards]
         * 0 - normal
         * 1 - debug
         * 2 - maintenance
         * 3 - silent
         * 4 - exit
         * @type {String}
         * @memberof RelaxyClusterManager
         * @private
         */
        this.operatingMode = 
            this.config.text.wmStatus.includes('DEBUG') ? MODE_DEBUG :
            this.config.text.wmStatus.includes('MAINTEN') ? MODE_MAINTENANCE : MODE_NORMAL

        if (fs.readFileSync('./bot/configuration/reset.ini').toString().includes('1')) {
            fs.writeFileSync('./bot/configuration/reset.ini', '0')
            this.operatingMode = MODE_SPECIAL_NORMAL
            this.config.text.wmStatus = this.config.text.wmStatus.replace('OFFLINE', 'ONLINE')
        }

        // Start capturing stdout into the file created earlier.
        captureConsole.startCapture(process.stdout, stdout => this.fileLogger.write(stdout.replaceAll(/\[\d{2}m/g, '')))

        process.on('message', console.log)
            .on('uncaughtException', console.log)
            .on('unhandledRejection', console.log)
            .on('warn', console.log)

        new RatelimitManager(this)
        this.debug('Cluster Manager', 'Created Rate Limit Manager!')

        new FileWatchManager(this).start().then(() => {
            setTimeout(() => {
                this.info('HOT RELOAD', 'Successfully started!')
            }, 1500)
        }).catch(err => {
            this.error('HOT RELOAD', err.message)
        })

        setInterval(() => {
            if (!(this.showUseQueueNew && this.showUseQueueNew.length === this.totalShards)) return
            return new Promise(async() => {
                let absolute_use = {
                    uptime: 0,
                    connections: 0,
                    users: 0,
                    queues: 0,
                    system: {
                        arch: process.arch,
                        platform: process.platform,
                        cpu: os.cpus().length,
                        memory: {
                            total: (process.memoryUsage().heapTotal / 1024 / 1024),
                            usage: (process.memoryUsage().heapUsed / 1024 / 1024),
                            rss: (process.memoryUsage().rss / 1024 / 1024),
                            arrayBuffers: (process.memoryUsage().arrayBuffers / 1024 / 1024)
                        },
                        uptime: process.uptime()
                    }
                }
                
                while (this.showUseQueueNew.length !== 0) {
                    let z = this.showUseQueueNew.shift()
                    absolute_use.connections += z.connections
                    absolute_use.users += z.users
                    absolute_use.queues += z.queues
                    absolute_use.system.cpu += z.system.cpu
                    absolute_use.system.memory.total += z.system.memory.total
                    absolute_use.system.memory.usage += z.system.memory.usage
                    absolute_use.system.memory.rss += z.system.memory.rss
                    absolute_use.system.memory.arrayBuffers += z.system.memory.arrayBuffers
                    this.info(`Cluster ${z.shard_id}`, `\nClient uptime: ${time(z.uptime)}\nChannel connections: ${z.connections}\nUsers held on cluster: ${z.users}\nRelaxy music queues: ${z.queues}\n-- Process information --\nArch: ${z.system.arch}\nPlatform: ${z.system.platform}\nCpu ${z.system.cpu}\nProcess uptime: ${time(z.system.uptime)}\nTotal memory: ${z.system.memory.total}mb\nTotal memory used: ${z.system.memory.usage}mb\nRSS: ${z.system.memory.rss}\nArray buffers: ${z.system.memory.arrayBuffers}\n\n[Calculation time] (${time(Date.now() - this.calculateStatsExecTime)})`)
                }
                
                this.info('Cluster Manager', `\n-- Process information --\nCpu ${os.cpus().length}\nProcess uptime: ${time(process.uptime() * 1000)}\nTotal memory: ${(process.memoryUsage().heapTotal / 1024 / 1024)}\nTotal memory used: ${(process.memoryUsage().heapUsed / 1024 / 1024)}\nRSS: ${(process.memoryUsage().rss / 1024 / 1024)}\nArray buffers: ${(process.memoryUsage().arrayBuffers / 1024 / 1024)}\n\n[Calculation time] (${time(Date.now() - this.calculateStatsExecTime)})`)
                this.info('Absolute usage', `\nChannel connections: ${absolute_use.connections}\nUsers: ${absolute_use.users}\nRelaxy music queues: ${absolute_use.queues}\n-- Process information --\nTotal memory: ${absolute_use.system.memory.total}mb\nTotal memory used: ${absolute_use.system.memory.usage}mb\nRSS: ${absolute_use.system.memory.rss}\nArray buffers: ${absolute_use.system.memory.arrayBuffers}\n\n[Calculation time] (${time(Date.now() - this.calculateStatsExecTime)})`)
                this.calculateStatsExecTime = null
                absolute_use = null
                this.showUseQueueNew = []
            })
        }, 5000)

        this.on('clusterCreate', cluster => this.handleClusterCreation(cluster))
        this.on('debug', debugInfo => {
            if ([MODE_DEBUG, MODE_MAINTENANCE, MODE_SILENT].includes(this.operatingMode))
                this.debug('Cluster Manager', debugInfo)
        })

        this.spawn({ amount: options.totalShards, timeout: -1 })
        this.process_stdout_capture.on('line', line => this.handleStdinCapture(line))
        this.emojisCacheWait = setInterval(() => {
            if (this.emojiReadyShards !== this.totalShards) return
            this.config.emojiCache = this.emojiCache
            this.updateConfig()
            clearInterval(this.emojisCacheWait)
            return this.info('Cluster Manager', 'All emojis received, updating config!')
        }, 100)
    }


    /**
     * Handle the creation of a new cluster.
     * @param {ClusterClient} cluster Cluster client.
     * @private
     */
    handleClusterCreation(cluster) {
        if (this.clusters.size === this.totalShards)
            setTimeout(() => {
                this.broadcast({ type: 'REQ_SET_relaxyRequests' })
            }, 5000)

        this.info('Cluster Manager', `Cluster #${cluster.id} online.`)

        cluster.on('death', (pcs) => {
            this.readyShards[cluster.id] = null
            this.error('Cluster Manager', `Cluster #${cluster.id} has died!\n[PID: ${pcs.pid}] [Exit code: ${pcs.exitCode}] [Signal code: ${pcs.signalCode}]`)
        })

        setInterval(() => cluster.send({ type: 'REQ_UPDATE_config', config: JSON.parse(fs.readFileSync('./bot/configuration/key.ini').toString()) }), 20000)

        cluster.on('message', async message => {
            switch (message.type) {
                //// REQUESTS ////
                case 'REQ_SET_relaxyRequestShardId':
                    return this.relaxyRequestShardId = cluster.id
                case 'REQ_showUseNewPart':
                    return this.showUseQueueNew.push(message.data)
                case 'REQ_UPDATE_config':
                    this.config = message.config
                    return this.updateConfig()
                case 'REQ_SET_searchResult':
                    if (message.searchresult < 2)
                        return this.exception[0] = this.exception[0] + 1
                    return this.exception = [this.totalShards, message.searchresult[1], message.searchresult[2]]

                //// MESSAGES ////
                case 'MSG_relaxyRequest':
                    this.info('Cluster Manager', `Request #${message.request.number} received from cluster #${cluster.id}!`)
                    return this.clusters.get(Number(this.relaxyRequestShardId)).send({ type: 'MSG_relaxyRequest', request: message.request })

                //// NOTIFICATIONS ////
                case 'NOTIF_relaxyRequestComplete':
                    return this.clusters.get(Number(message.shardID)).send(message)
                case 'NOTIF_relaxyRequestDelivered':
                    return this.clusters.get(0).send({ type: 'NOTIF_relaxyRequestDelivered', data: message.data })
                case 'NOTIF_emojisReceived':
                    this.emojiReadyShards++
                    message.data.forEach(e => this.emojiCache.push(e))
                    return this.info('Cluster Manager', `[Shard ${this.emojiReadyShards - 1}] emojis received!`)
                case 'NOTIF_showGuilds':
                    return this.guilds = [this.guilds[0] + 1, this.guilds[1] + message.guilds]
            }
        })

        cluster.on('spawn', clusterProcess => {
            let TEMP_wait_for_client_process = setInterval(() => {
                if (!clusterProcess)  return
                clearInterval(TEMP_wait_for_client_process)
                this.readyShards[this.readyShards.length] = clusterProcess.pid
                clusterProcess.stdout.on('data', chunk => this.displayShardStdout(JSON.stringify(chunk.toString())))
            }, 4400)

            this.broadcast({ type: 'REQ_SET_ready' })
        })

        cluster.on('disconnect', () => this.error('Cluster Manager', `Cluster #${cluster.id} disconnected!`))
        cluster.on('reconnecting', () => this.warn('Cluster Manager', `Cluster #${cluster.id} reconnecting!`))

        setTimeout(() => {
            cluster.send({
                type: 'REQ_startup',
                data: {
                    shardId: cluster.id,
                    shards: this.totalShards,
                    status: this.operatingMode
                }
            })
        }, 500)
    }


    /**
     * Handle capturing console input.
     * @param {String} line Line captured from stdin.
     * @private
     */
    handleStdinCapture(line) {
        let args = line.split(' ')
        switch (args[0].toLowerCase()) {
            // REQUESTS //
            case 'slash_delete':
                return this.broadcast({ type: 'REQ_deleteSlashCommands' })
            case 'slash_create':
                return this.broadcast({ type: 'REQ_postSlashCommands' })
            case 'raw':
                return this.broadcast({ type: 'REQ_showRawPackets' })
            case 'show_database':
                return this.broadcast({ type: 'REQ_showDatabaseQueries' })
            case 'event_names':
                return this.broadcast({ type: 'REQ_showEventNames' })
            case 'update_version':
                args.shift()
                this.config.keys.version = args.join(' ')
                this.updateConfig()
                this.broadcast({ type: 'REQ_UPDATE_version', data: this.config.keys.version })
                return this.info('Cluster Manager', `New version: ${this.config.keys.version}`)
            case 'debug':
                this.operatingMode !== MODE_SILENT ? 
                this.info('Cluster Manager', 'Debug mode on!') : 
                this.info('Cluster Manager', 'Debug mode off!')
                this.broadcast({ type: 'REQ_UPDATE_debug' })
                return this.operatingMode = this.operatingMode === MODE_SILENT ? MODE_NORMAL : MODE_SILENT
            case 'change_status':
                if (!args[1])
                    return this.broadcast({ type: 'REQ_UPDATE_status' })

                const operatingMode = args[1].toLowerCase()
                const splitStatus = this.config.text.wmStatus.split('**')
                switch (operatingMode) {
                    case 'normal':
                    case 'debug':
                    case 'maintain':
                    case 'silent':
                    case 'exit':
                        this.config.text.wmStatus = `${splitStatus[0]}**${statusText[operatingMode]}**${splitStatus[2]}**${splitStatus[3]}**`
                        this.operatingMode = statusOperatingMode[operatingMode]

                        const closeRelaxy = operatingMode === 'exit'

                        if (closeRelaxy) {
                            fs.writeFileSync('./bot/configuration/reset.ini', '1')
                            this.config.emojiCache = this.emojiCache
                        }

                        this.updateConfig()
                        if (closeRelaxy) this.updateConfig = () => { return void 0 }

                        this.broadcast({
                            type: 'REQ_UPDATE_status',
                            data: statusOperatingMode[operatingMode]
                        })
                        if (!closeRelaxy) return

                        // SHUTDOWN PROCEDURE //
                        this.broadcastEval(s => s.guilds.cache.forEach(async guild => { 
                            try { 
                                guild.me = await guild.members.fetchMe()
                                guild.me.voice.disconnect() 
                            } catch {} 
                        }))

                        let timePassed = 0
                        return setInterval(() => {
                            timePassed += 1000
                            switch (timePassed) {
                                case 20000:
                                    return this.info('Cluster Manager', '40 seconds left until Relaxy shuts down!')
                                case 40000:
                                    return this.info('Cluster Manager', '20 seconds left until Relaxy shuts down!')
                                default:
                                    if (timePassed >= 50000) {
                                        if (timePassed >= 60000) {
                                            this.error('Cluster Manager', 'Closing Relaxy!')
                                            child_process.exec('taskkill /f /im node.exe')
                                            return child_process.exec('taskkill /f /im cmd.exe')
                                        }

                                        return this.warn('Cluster Manager', `${(60000 - timePassed)/1000} seconds left until Relaxy shuts down!`)
                                    }
                            }
                        }, 1000)
                    default:
                        let customStatus = args
                        customStatus.shift()
                        customStatus = customStatus.join(' ')
                        this.config.text.wmStatus = `${this.config.text.wmStatus.split('**')[0]}**${customStatus}**${this.config.text.wmStatus.split('**')[2]}**${this.config.text.wmStatus.split('**')[3]}**`
                        this.updateConfig()
                        return this.info('Cluster Manager', 'Non-standard status updated!')
                }

            // DISPLAYS //
            case 'version':
                return this.info('Cluster Manager', this.config.keys.version)
            case 'show_owners':
                return this.clusters.forEach(cluster => cluster.send({ type: 'MSG_showOwners' }))
            case 'show_dependencies':
                return this.clusters.get(0).send({ type: 'REQ_showDependencies' })
            case 'help':
                return this.info('Cluster Manager', `\n${fs.readFileSync('./bot/configuration/help_manager.ini').toString()}`)
            case 'show_pids':
                this.info('Cluster Manager', this.readyShards.map((pid, shard_id) => `\nShard ${shard_id}: PID: ${pid}.`).join(''))
                return this.info('Cluster Manager', `Manager PID: ${process.pid}`)
            case 'show_use':
                this.calculateStatsExecTime = Date.now()
                return this.broadcast({ type: 'REQ_showUseNew' })
            case 'show_servers':
                let serverListInterval = setInterval(() => {
                    if (this.guilds[0] !== this.totalShards) return
                    clearInterval(serverListInterval)
                    let shard_servers = this.guilds[1]
                    setTimeout(() => {
                        return this.info('Cluster Manager', `The total number of servers is ${shard_servers}`)
                    }, 1000)

                    return this.guilds = [0, 0]
                }, 10)

                return this.clusters.forEach(cluster => cluster.send({ type: 'MSG_showServers' }))

            // VARIABLE 
            case 'show_discord_errors':
                this.info('Cluster Manager', `Turning DiscordApiErrors ${this.showDiscordErrors ? 'OFF' : 'ON'}!`)
                return this.showDiscordErrors = !this.showDiscordErrors
            
            case 'show_statistics':
                this.info('Cluster Manager', `${this.showStats ? 'Not ' : ''}showing statistics.`)
                return this.showStats = !this.showStats
        }
    }


    /**
     * Handle and process cluster's stdout.
     * @param {Buffer} chunk
     * @private
     */
    displayShardStdout(chunk) {
        chunk = JSON.parse(chunk)
        const isObject = typeof chunk === 'object'
        chunk = isObject ? chunk : chunk.replace('\n', '')//.replace('\r', '')

        if (this.operatingMode !== MODE_NORMAL || isObject)
            return console.log(chunk)

        const lowercaseChunk = chunk.toLowerCase()
        if (lowercaseChunk.includes('discord') && 
            !this.showDiscordErrors || 
            lowercaseChunk.includes('ModelType') ||
            lowercaseChunk.includes('undefined')) return

        const splitChunk = chunk.split(' ')
        if (['DATA', 'DEBUG', 'ERROR', 'WARN', 'INFO'].includes(splitChunk[0])) {
            const source = `${splitChunk[1]} ${splitChunk[2]}`
            switch (splitChunk[0]) {
                case 'INFO':
                    return this.info(source, splitChunk.slice(3,  splitChunk.length).join(' '))
                case 'DATA':
                    return this.data(source, splitChunk.slice(3,  splitChunk.length).join(' '))
                case 'DEBUG':
                    return this.debug(source, splitChunk.slice(3,  splitChunk.length).join(' '))
                case 'ERROR':
                    return this.error(source, splitChunk.slice(3,  splitChunk.length).join(' '))
                case 'WARN':
                    return this.warn(source, splitChunk.slice(3,  splitChunk.length).join(' '))
            }
        }
    }


    /**
     * Get human readable converted process information.
     * @param {pidUsage.Status} process_information Process Status.
     * @public
     * @returns {String}
     */
    getProcessInfoReadable(process_information) {
        const clusterInfo = this.readyShards.includes(process_information.pid) ? `[Cluster ${this.readyShards.indexOf(process_information.pid)}]` : `[Cluster Manager]`
        const cpuUse = `CPU USE: ${process_information.cpu}%`
        const memUse = `MEM USE: ${process_information.memory/1000000}MB`
        const ppid = `PPID: ${process_information.ppid}`
        const pid = `PID: ${process_information.pid}`
        const ctime = `CTIME: ${time(process_information.ctime)}`
        const runtime = `RUNTIME: ${time(process_information.elapsed)}`
        const computingTime = `COMPUTING TIME: ${time(Date.now() - process_information.timestamp)}`
        return `\n${clusterInfo}\n${cpuUse}\n${memUse}\n${ppid}\n${pid}\n${ctime}\n${runtime}\n${computingTime}`
    }
}