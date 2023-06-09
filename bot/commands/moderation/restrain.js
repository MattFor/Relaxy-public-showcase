'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'restrain',
    usage: '=restrain type [roles1] from [roles2]',
    permissions: ['MANAGE_ROLES'],
    description: '**Type**:\n`1` - if you DO have [roles2] you cannot have [roles1]\n`2` - if you DON\'T have [roles1] you cannot have [roles2]\n`3` - if you DO have [roles2] you can have [roles1]\n`4` - if you DON\'T have [roles2] you can have [roles1]\n\n[roles1] or [roles2] is just a list of roles separated by spaces, can be either a role id, an @ or the role name.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {

        const type = Number(args.shift())

        if (![1, 2, 3, 4].includes(type)) return new client.class.error('Invalid type!', interaction ?? message)

        const content = client.utils.cleanup(args.join(' ').toLowerCase().split('from'))

        const roles1 = client.utils.cleanup(content[0].split(' '))
        const roles2 = client.utils.cleanup(content[1].split(' '))

        var roles_to_add = []
        var roles_to_remove = []
        var roles_to_addRemoved = []
        var roles_to_removeRemoved = []
        var flag = []

        var count = 0

        roles1.forEach(role => {

            let role_gotten = message.guild.roles.cache.find(r => r.id === client.utils.nums(role)) ?
                message.guild.roles.cache.find(r => r.id === client.utils.nums(role)) :
                message.guild.roles.cache.find(r => r.name === role.replaceAll('-', ' ')) ?
                message.guild.roles.cache.find(r => r.name === role.replaceAll('-', ' ')) : null

            if (!role_gotten) {
                count++
                return flag.push(count)
            }

            count++
            role_gotten.ID = count
            return roles_to_add.push(role_gotten)
        })


        if (flag.length > 0) return new client.class.error(`description Roles: [${flag.map((r) => { return `\`${roles1[r-1]}\`` }).join(', ')}] are invalid!`, message)

        flag = []
        count = 0

        roles2.forEach(role => {

            let role_gotten = message.guild.roles.cache.find(r => r.id === client.utils.nums(role)) ?
            message.guild.roles.cache.find(r => r.id === client.utils.nums(role)) :
            message.guild.roles.cache.find(r => r.name === role.replaceAll('-', ' ')) ?
            message.guild.roles.cache.find(r => r.name === role.replaceAll('-', ' ')) : null

            if (!role_gotten) {
                count++
                return flag.push(count)
            }
            
            count++
            role_gotten.ID = count
            return roles_to_remove.push(role_gotten)
        })

        if (flag.length > 0) return new client.class.error(`description Roles: [${flag.map((r) => { return `\`${roles2[r-1]}\`` }).join(', ')}] are invalid!`, message)

        flag = []

        switch (type) {
            case 1: {

                let _a = guild.restrictors1

                roles_to_add.forEach(role => {
                    roles_to_remove.forEach(r => {
                        if (!_a[role.id] || _a[role.id].length === 0) {
                            _a[role.id] = []
                            role.ADDED = true
                        }
                        if (_a[role.id].includes(r.id)) {
                            _a[role.id].splice(_a[role.id].indexOf(r.id), 1)
                            r.ADDED = false
                        } else {
                            r.ADDED = true
                            _a[role.id].push(r.id)
                        }
                        if (_a[role.id].length === 0 ) {
                            _a[role.id] = []
                            return role.ADDED = false
                        }
                    })
                })

                client.save(guild.id, { to_change: 'restrictors1', value: _a })
                return new client.class.error(`description From now on if you **DO** have these roles:\n${roles_to_remove.map((r) => { return `**${r}${r.ADDED ? '`[ADDED]`' : '`[REMOVED]`'}**` })}\nYou will **NOT** be able to get these ones from Reaction Roles:\n${roles_to_add.map((r) => { return `**${r}${r.ADDED ? '`[ADDED]`' : '`[REMOVED]`'}**` })}`, message)
            }
            case 2: {

                let _a = guild.restrictors2

                roles_to_add.forEach(role => {
                    roles_to_remove.forEach(r => {
                        if (!_a[role.id] || _a[role.id].length === 0) {
                            _a[role.id] = []
                            role.ADDED = true
                        }
                        if (_a[role.id].includes(r.id)) {
                            _a[role.id].splice(_a[role.id].indexOf(r.id), 1)
                            r.ADDED = false
                        } else {
                            r.ADDED = true
                            _a[role.id].push(r.id)
                        }
                        if (_a[role.id].length === 0 ) {
                            _a[role.id] = []
                            return role.ADDED = false
                        }
                    })
                })
                client.save(guild.id, { to_change: 'restrictors2', value: _a })
                return new client.class.error(`description From now on if you **DON'T** have these roles:\n${roles_to_add.map((r) => { return `**${r}${r.ADDED ? '`[ADDED]`' : '`[REMOVED]`'}**` })}\nYou will **NOT** be able to get these ones from Reaction Roles:\n${roles_to_remove.map((r) => { return `**${r}${r.ADDED ? '`[ADDED]`' : '`[REMOVED]`'}**` })}`, message)
            }
            case 3: {

                let _a = guild.restrictors3

                roles_to_add.forEach(role => {
                    roles_to_remove.forEach(r => {
                        if (!_a[role.id] || _a[role.id].length === 0) {
                            _a[role.id] = []
                            role.ADDED = true
                        }
                        if (_a[role.id].includes(r.id)) {
                            _a[role.id].splice(_a[role.id].indexOf(r.id), 1)
                            r.ADDED = false
                        } else {
                            r.ADDED = true
                            _a[role.id].push(r.id)
                        }
                        if (_a[role.id].length === 0 ) {
                            _a[role.id] = []
                            return role.ADDED = false
                        }
                    })
                })

                client.save(guild.id, { to_change: 'restrictors3', value: _a })
                return new client.class.error(`description From now on if you **DO** have these roles:\n${roles_to_remove.map((r) => { return `**${r}${r.ADDED ? '`[ADDED]`' : '`[REMOVED]`'}**` })}\nYou **WILL** be able to get these ones from Reaction Roles:\n${roles_to_remove.map((r) => { return `**${r}${r.ADDED ? '`[ADDED]`' : '`[REMOVED]`'}**` })}`, message)
            }
            case 4: {

                let _a = guild.restrictors4

                roles_to_add.forEach(role => {
                    roles_to_remove.forEach(r => {
                        if (!_a[role.id] || _a[role.id].length === 0) {
                            _a[role.id] = []
                            role.ADDED = true
                        }
                        if (_a[role.id].includes(r.id)) {
                            _a[role.id].splice(_a[role.id].indexOf(r.id), 1)
                            r.ADDED = false
                        } else {
                            r.ADDED = true
                            _a[role.id].push(r.id)
                        }
                        if (_a[role.id].length === 0 ) {
                            _a[role.id] = []
                            return role.ADDED = false
                        }
                    })
                })

                client.save(guild.id, { to_change: 'restrictors4', value: _a })
                return new client.class.error(`description From now on if you **DON'T** have these roles:\n${roles_to_remove.map((r) => { return `**${r}${r.ADDED ? '`[ADDED]`' : '`[REMOVED]`'}**` })}\nYou **WILL** not be able to get these ones from Reaction Roles:\n${roles_to_add.map((r) => { return `**${r}${r.ADDED ? '`[ADDED]`' : '`[REMOVED]`'}**` })}`, message)
            }
        }
    }
}