'use strict'

import FileWatcher from 'watch'
import RelaxyManager from '../../Manager.js'

export default class FileWatchManager {
    /**
     * Watches for file changes inside commands and automatically 
     * Implements into the live version of the bot without having to restart it
     * [DOES NOT WORK ON CORE FUNCTIONS OF THE BOT]
     * @param {RelaxyManager} manager
     */
    constructor(manager) {
        this.manager = manager
    }

    start = async () => {
        return FileWatcher.createMonitor(this.manager.dirname, async (monitor) => {
            monitor.on('created', (file) => {
                let tmp = file.split('\\')

                if (!file.endsWith('js') || !['commands', 'events'].includes(tmp[tmp.length - 3])) 
                    return

                const file_name = tmp[tmp.length - 1].split('.')[0]

                if (file.includes('commands'))
                    return this.commandStatusChange(file_name, 'NOTIF_cmdAdd', file)

                return this.eventStatusChange(file_name, 'NOTIF_eventAdd', file)
            })

            monitor.on('removed', (file) => {
                let tmp = file.split('\\')

                if (!file.endsWith('js') || !['commands', 'events'].includes(tmp[tmp.length - 3])) 
                    return

                const file_name = tmp[tmp.length - 1].split('.')[0]

                if (file.includes('commands'))
                    return this.commandStatusChange(file_name, 'NOTIF_cmdDelete', file)

                return this.eventStatusChange(file_name, 'NOTIF_eventDelete', file)
            })

            monitor.on('changed', (file) => {
                let tmp = file.split('\\')

                if (!file.endsWith('js') || !['commands', 'events'].includes(tmp[tmp.length - 3]) && !file.includes('additions')) 
                    return

                const file_name = tmp[tmp.length - 1].split('.')[0]

                if (file.includes('additions'))
                    if (!file_name.includes('bot/configuration') && !file_name.includes('bin'))
                        return this.clientCoreStatusChange(file_name, file)
                    else    
                        return

                if (file.includes('commands'))
                    return this.commandStatusChange(file_name, 'NOTIF_cmdUpdate', file)

                return this.eventStatusChange(file_name, 'NOTIF_eventUpdate', file)
            })
        })
    }


    /**
     * Broadcast a message to the shards about either deletion, adding or change of a command dynamically.
     * @param {String} core_part 
     */
    clientCoreStatusChange = async(core_part, path) => {
        this.manager.broadcast({ type: 'NOTIF_coreUpdate', core_part_name: core_part, file_path: path })
            .then(() => {
                return this.manager.info('HOT RELOAD', `Changed status of ${core_part} successfully!`)
            }).catch((e) => {
                console.log(e)
                return this.manager.info('HOT RELOAD', `Error changing status of ${core_part}! [error logged]`)
            })
    }


    /**
     * Broadcast a message to the shards about either deletion, adding or change of a command dynamically.
     * @param {String} event 
     * @param {String} status Status f.e 'NOTIF_cmdUpdate', 'NOTIF_cmdDelete', 'NOTIF_cmdAdd'
     */
    eventStatusChange = async(event, status, path) => {
        this.manager.broadcast({ type: status, event_name: event, file_path: path })
            .then(() => {
                return this.manager.info('HOT RELOAD', `Changed status of ${event} successfully!`)
            }).catch((e) => {
                console.log(e)
                return this.manager.info('HOT RELOAD', `Error changing status of ${event}! [error logged]`)
            })
    }


    /**
     * Broadcast a message to the shards about either deletion, adding or change of a command dynamically.
     * @param {String} command 
     * @param {String} status Status f.e 'NOTIF_cmdUpdate', 'NOTIF_cmdDelete', 'NOTIF_cmdAdd'
     */
    commandStatusChange = async(command, status, path) => {
        this.manager.broadcast({ type: status, command_name: command, file_path: path })
            .then(() => {
                return this.manager.info('HOT RELOAD', `Changed status of ${command} successfully!`)
            }).catch((e) => {
                console.log(e)
                return this.manager.info('HOT RELOAD', `Error changing status of ${command}! [error logged]`)
            })
    }
}