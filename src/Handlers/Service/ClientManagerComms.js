'use strict'

import Relaxy from '../../Relaxy.js'

export default class RelaxyClient_ControllerManager {
    constructor(client) {
        /**
         * @type {Relaxy} client
         */
        this.client = client
    }

    async process(message) {
        if (!message.type) return

        switch (message.type) {
            //// REQUESTS //// 
            case 'REQ_startup':
                return this.client.startUp(message.data)
            case 'REQ_SET_ready':
                return this.client.data.ready = true
            case 'REQ_SET_ready':
                return this.client.data.ready = true
            case 'REQ_showRawPackets':
                return this.client.logs.raw = !this.client.logs.raw
            case 'REQ_showDatabaseQueries':
                return this.client.logs.databaseSaves = !this.client.logs.databaseSaves
            case 'REQ_showEventNames':
                return this.client.logs.eventNames = !this.client.logs.eventNames
            case 'REQ_refreshConfig':
                if (this.client.config !== message.config) 
                    return this.client.config = message.config
                return
            case 'REQ_showDependencies':
                return this.client.module.music.emit('debug', this.client.module.music, `\n\n${this.client.module.music.scanDeps()}`)
            case 'REQ_deleteSlashCommands':
                return this.client.deleteSlashCommands()
            case 'REQ_postSlashCommands':
                return this.client.postSlashCommands()
            case 'REQ_SET_relaxyRequests':
                const guild = await this.client.guilds.fetch('1034514185922564106').catch(() => {})
                if (!guild) return 
                this.client.cluster.send({ type: 'REQ_SET_relaxyRequestShardId' })
                return this.client.initiateRequestManager()
            case 'REQ_UPDATE_status':
                if (message.data === null) {
                    this.client.log(`Turning status refreshing ${this.client.data.refreshStatus ? 'OFF' : 'ON'}`, 'INFO')
                    return this.client.data.refreshStatus = !this.client.data.refreshStatus
                }
                return this.client.setStatus(message.data)
            case 'REQ_UPDATE_version':
                if (this.client.data.id === 0)
                    this.client.clog(`**${this.client.config.keys.version} -> ${message.data}**`, 'keys.version UPDATE', 'good')
                return this.client.setVersion(message.data)
            case 'REQ_showUseNew':
                return this.client.cluster.send({
                    type: 'REQ_showUseNewPart',
                    data: this.client.module.music.getStats()
                })    
            case 'REQ_UPDATE_debug':
                this.client.log(`${this.client.logs.debug ? 'Not showing' :  'Showing' } debug information`)
                return this.client.logs.debug = !this.client.logs.debug

            //// MESSAGES ////
            case 'MSG_relaxyRequest':
                return this.client.module.relaxyRequestManager.Receive(message.request)
            case 'MSG_showServers':
                this.client.cluster.send({ type: 'NOTIF_showGuilds', guilds: this.client.guilds.cache.size })
                const guilds = this.client.guilds.cache.map(guild => `${guild.name} - [${guild.id}]`).join('\n')
                return this.client.log(`\nNumber of this shard's servers: ${this.client.guilds.cache.size}\n${guilds}`)
            case 'MSG_showOwners':
                this.client.log('\n')
                return this.client.guilds.cache.forEach(async guild => this.client.log(`${guild.name} - ${(await guild.fetchOwner())?.user?.tag} - ${guild.ownerId}`))
            
            //// NOTIFICATIONS //// 
            case 'NOTIF_relaxyRequestDelivered':
                return this.client.send(this.client.users.cache.get(this.client.config.keys.owner), message.data)
            case 'NOTIF_relaxyRequestComplete':
                const user = this.client.users.cache.get(message.authorID)
                return this.client.send(user, `Hey **${user}** your request [ID: \`#${message.number}\`] has been ${message.accepted ? '**ACCEPTED!**' : '**REJECTED!**'}`, [{
                    color: this.client.data.embedColor,
                    title: 'Response:',
                    description: message.reason,
                    footer: this.client.data.footer,
                    image: { url: message.attachment ? message.attachment.contentType.includes('image') ? message.attachment.url : null : null }
                }], message.attachment ? message.attachment.contentType.includes('image') ? [] : [message.attachment] : [])
                    .then(() => this.client.cluster.send({ type: 'NOTIF_relaxyRequestDelivered', data: `SUCCESS! request \`#${message.number}\` has been sent through!`}))
                    .catch(() => this.client.cluster.send({ type: 'NOTIF_relaxyRequestDelivered', data: `ERROR request \`#${message.number}\` has failed!`}))
            case 'NOTIF_coreUpdate':
                if (!this.client.data.id === 0) return
                await this.client.send(`${this.client.utils.firstLetterUp(message.core_part_name)}.js has been updated!\nA core part of Relaxy has been changed, the bot will now be restarted.`, 'CLIENT CORE PART: [HOT RELOAD]', 'good')
                return this.client.cluster.send({ type: 'NOTIF_coreUpdate' })
            case 'NOTIF_cmdDelete':
            case 'NOTIF_cmdAdd':
            case 'NOTIF_cmdUpdate':
                try {
                    let tmp = message.file_path.split('\\')
                    const cmd_type = tmp[tmp.length - 2]

                    this.client.imports.fs.readdirSync('./commands').forEach(async dirs => {
                        if (dirs !== cmd_type) 
                            return

                        const commands = this.client.imports.fs.readdirSync(`./commands/${dirs}`)

                        for (const file of commands) {
                            if (file.split('.')[0].toLowerCase() !== message.command_name)
                                continue

                            const command = await (async () => {
                                await new Promise(resolve => setTimeout(resolve, 1000))
                                
                                return await import (`../../../commands/${cmd_type}/${file}?foo=${
                                    (() => {
                                        let result = ""
                                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

                                        for (var i = 0; i < 20; i++)
                                            result += characters.charAt(Math.floor(Math.random() * 62))

                                        return result
                                    })()
                                }`)
                            })()

                            switch (message.type) {
                                case 'NOTIF_cmdDelete':
                                    
                                    if (command.default.aliases)
                                        command.default.aliases.forEach(async alias => {
                                            return this.client.collections.aliases.delete(alias)
                                        })

                                    if (command.default.slash) {
                                        this.client.collections.interactionCommands.delete(command.default.name)
    
                                        if (this.client.data.id === 0)
                                            this.client.data.slashCommands = this.client.data.slashCommands.filter(c => c.name !== command.default.name)
                                    }

                                    return this.client.collections.commands.delete(command.default.name.toLowerCase())

                                case 'NOTIF_cmdUpdate':

                                    if (command.default.aliases)
                                        command.default.aliases.forEach(async alias => {
                                            return this.client.collections.aliases.set(alias, command.default)
                                        })

                                    if (command.default.slash) {
                                        this.client.collections.interactionCommands.set(command.default.name, command.default)

                                        if (this.client.data.id === 0) {
                                            this.client.data.slashCommands = this.client.data.slashCommands.filter(c => c.name !== command.default.name)

                                            this.client.data.slashCommands.push(command.default)
                                        }
                                    }

                                    return this.client.collections.commands.set(command.default.name.toLowerCase(), command.default)

                                case 'NOTIF_cmdAdd':

                                    if (command.default.aliases)
                                        command.default.aliases.forEach(async alias => {
                                            return this.client.collections.aliases.set(alias, command.default)
                                        })

                                    if (command.default.slash) {
                                        this.client.collections.interactionCommands.set(command.default.name, command.default)

                                        if (this.client.data.id === 0) {
                                            this.client.data.slashCommands = this.client.data.slashCommands.filter(c => c.name !== command.default.name)

                                            this.client.data.slashCommands.push(command.default)
                                        }
                                    }

                                    return this.client.collections.commands.set(command.default.name.toLowerCase(), command.default)

                                default:
                                    this.client.log('Unknown occurence adding command through HOT RELOAD')
                            }
                        }
                    })

                    if (this.client.data.id === 0)
                        this.client.clog(`${this.client.utils.firstLetterUp(message.command_name)} has just been ${{'NOTIF_cmdDelete': 'Deleted', 'NOTIF_cmdAdd': 'Added', 'NOTIF_cmdUpdate': 'Updated'}[message.type].toLowerCase()}!`, 'COMMAND: [HOT RELOAD]', { 'NOTIF_cmdDelete': 'bad', 'NOTIF_cmdAdd': 'good', 'NOTIF_cmdUpdate': null }[message.type])

                    return this.client.log(`${{'NOTIF_cmdDelete': 'Deleted', 'NOTIF_cmdAdd': 'Added', 'NOTIF_cmdUpdate': 'Updated'}[message.type]} ${message.command_name} successfully!`)
                } catch {
                    return this.client.log(`${message.command_name} ${{'NOTIF_cmdDelete': 'DELETE', 'NOTIF_cmdAdd': 'ADD', 'NOTIF_cmdUpdate': 'UPDATE'}[message.type]} ERROR!`)
                }
            case 'NOTIF_eventAdd':
            case 'NOTIF_eventDelete':
            case 'NOTIF_eventUpdate':
                try {
                    let tmp = message.file_path.split('\\')
                    const event_type = tmp[tmp.length - 2]

                    this.client.imports.fs.readdirSync('./events/discord').forEach(async dirs => {
                        if (dirs !== event_type) return

                        for (const file of this.client.imports.fs.readdirSync(`./events/${dirs}`)) {
                            if (file.split('.')[0].toLowerCase() !== message.event_name)
                                continue

                            const event = import (`../../../events/${event_type}/${file}`)

                            switch (message.type) {
                                case 'NOTIF_eventDelete':
                                    return this.client.removeListener(file.split('.')[0], (...args) => event.default.run(this.client, ...args))

                                case 'NOTIF_eventAdd':
                                case 'NOTIF_eventUpdate':
                                    return this.client.on(file.split('.')[0], (...args) => event.default.run(this.client, ...args))
                            }
                        }
                    })    

                    if (this.client.data.id === 0)
                        this.client.clog(`${this.client.utils.firstLetterUp(message.event_name)} has just been ${{'NOTIF_eventDelete': 'Deleted', 'NOTIF_eventAdd': 'Added', 'NOTIF_eventUpdate': 'Updated'}[message.type].toLowerCase()}!`, 'EVENT: [HOT RELOAD]', { 'NOTIF_eventDelete': 'bad', 'NOTIF_eventAdd': 'good', 'NOTIF_eventUpdate': null }[message.type])

                    return this.client.log(`${{'NOTIF_eventDelete': 'Deleted', 'NOTIF_eventAdd': 'Added', 'NOTIF_eventUpdate': 'Updated'}[message.type]} ${message.event_name} successfully!`)
                } catch {
                    return this.client.log(`${message.command_name} ${{'NOTIF_eventDelete': 'DELETE', 'NOTIF_eventAdd': 'ADD', 'NOTIF_eventUpdate': 'UPDATE'}[message.type]} ERROR!`)
                }
        }
    }
}