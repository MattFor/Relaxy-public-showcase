'use strict'

import Relaxy from '../../Relaxy.js'
import Child_Process from 'child_process'

export default class EventManager {

    /**
     * Handle all errors, debugs and keep the process running at all costs, stdout all informations.
     * @param {Relaxy} client 
     * @param {Child_Process.ChildProcess} process 
     */
    constructor(client, process) {

        process.on('exit', (code) => {
            console.log(`ERROR ${client.data.loggerDisplayName} EXIT CODE ${code}`)
        })

        process.on('warning', warning => {
            if (warning.name.includes('Experimental')) return
            console.log(`WARN ${client.data.loggerDisplayName} ${warning}`)
        })

        process.on('uncaughtException', err => {
            console.log(`ERROR ${client.data.loggerDisplayName} ${err ? err.stack ? err.stack : err : 'Undefined uncaught exception'}`)
        })

        process.on('unhandledRejection', (err) => {
            console.log(`ERROR ${client.data.loggerDisplayName} ${err ? err.stack ? err.stack : err : 'Undefined uncaught exception'}`)
        })

        client.on(client.imports.discord.Events.Error, err => {
            console.log(`ERROR ${client.data.loggerDisplayName} ${err.message}\n${err.stack}`)
        })

        client.on(client.imports.discord.Events.Warn, warning => {
            console.log(`WARN ${client.data.loggerDisplayName} ${warning ? warning : 'Unrecognizable warning'}`)
        })

        client.on(client.imports.discord.Events.Invalidated, () => {
            client.log(`ERROR ${client.data.loggerDisplayName} Session invalidated!`)
        })

        client.on(client.imports.discord.Events.Debug, debug => {
            if (client.logs.debug || debug.includes('Heartbeat')) return
            console.log(`DEBUG ${client.data.loggerDisplayName} ${debug}`)
        })

        setTimeout(() => {
            client.ws.on('debug', debug => console.log )

            client.log('Starting RestAPI logging.', 'DEBUG')

            client.rest.on(client.imports.discord.RESTEvents.InvalidRequestWarning, rl => {
                console.log(rl)
                console.log(`ERROR ${client.data.loggerDisplayName} ${rl}`)
            })

            let responses = 0

            setInterval(() => {
                client.log(`Sent ${responses} requests in the past 30 minutes.`, 'DEBUG')
                responses = 0
            }, 30 * 60 * 1000)

            client.rest.on(client.imports.discord.RESTEvents.Response, () => {
                // console.log(`DEBUG ${client.data.loggerDisplayName} ${res}`)
                responses++
            })

            client.rest.on(client.imports.discord.RESTEvents.RateLimited, rl => {
                console.log(`WARN ${client.data.loggerDisplayName} RATE LIMIT HIT\n\nLimit: ${rl.limit}\nMethod used: ${rl.method}\nPath: ${rl.path}\nRoute: ${rl.route}\nTime to reset ${rl.timeToReset}`)
            })

            // client.rest.on(client.imports.discord.RESTEvents.Debug, debug => {
            //     if (client.data.REST_debug) {
            //         if (client.data.status === 2) return console.log(debug)
            //         console.log(`DEBUG ${client.data.loggerDisplayName} ${debug}`)
            //     }
            // })
        }, 5000)
    }
}