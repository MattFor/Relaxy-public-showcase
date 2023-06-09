'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


const category_reference = {
    'fun': 0,
    'image': 1,
    'miscellaneous': 2,
    'moderation': 3,
    'music': 4
}


export default {
    name: 'disable',
    aliases: ['dcmd'],
    undergoingchange: false,
    cooldown: 10,
    permissions: ['MANAGE_GUILD'],
    usage: '=disable (list of commands separated by spaces OR the name/list of categories of commands to disable)',
    description: 'Disable series or singular commands.\nAvailable categories:\n- fun\n- image\n- miscellaneous\n- moderation\n- music\nIf you do not provide any arguments it will show args[i] list of currently disabled commands.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (!args[0]) {
            let fields = [{
                name: 'Fun:', value: ''
            },{
                name: 'Image:', value: ''
            },{
                name: 'Miscellaneous:', value: ''
            },{
                name: 'Moderation:', value: ''
            },{
                name: 'Music:', value: ''
            }]
            
            client.imports.fs.readdirSync('./commands').forEach(async dirs => {
                const commands = client.imports.fs.readdirSync(`./commands/${dirs}`)
                for (const file of commands) {
                    const command_name = file.split('.')[0]
                    const command = client.collections.commands.get(command_name)??client.collections.aliases.get(command_name)

                    if (!command)
                        continue

                    if ((command.owner && message.author.id !== client.config.keys.owner) || command.leaveout) 
                        continue

                    if (guild.disabedcommands.includes(command.name)) 
                        fields[category_reference[dirs]].value += `\`${command.name}\`, `
                }
            })

            for (let i = 0; i < fields.length; i++)
                if (fields[i].value.length === 0) 
                    fields[i].value = '**No banned commands in this category.**'
                else 
                    fields[i].value = `${fields[i].value.slice(0, -2)}.`

                
            return client.send(message.channel, null, [{
                color: client.data.embedColor,
                title: 'Banned commands:',
                fields: fields,
                footer: client.data.footer
            }])
        }

        let flag = [], added = [], removed = [], arg_len = args.length

        for (let i = 0; i < arg_len; i++) {
            if (Object.keys(category_reference).includes(args[i]))
                client.imports.fs.readdirSync(`./commands/${args[i]}`).forEach(async file => {
                    const command_name = file.split('.')[0]
                    const command = client.collections.commands.get(command_name)??client.collections.aliases.get(command_name)

                    if (guild.disabedcommands.includes(command.name)) {
                        removed.push(command.name)
                        return guild.disabedcommands.splice(guild.disabedcommands.indexOf(command.name), 1)
                    }

                    added.push(command.name)
                    guild.disabedcommands.push(command.name)
                })

            const command = client.collections.commands.get(args[i].toLowerCase())??client.collections.aliases.get(args[i].toLowerCase())

            if (!command) {
                flag.push(args[i])
                continue
            }
            
            if (guild.disabedcommands.includes(command.name)) {
                removed.push(args[i])
                guild.disabedcommands.splice(guild.disabedcommands.indexOf(command.name), 1)
                continue
            }

            added.push(args[i])
            guild.disabedcommands.push(command.name)
        }

        if (flag.length > 0)
            return client.send(message.channel, null, [{
                color: client.data.embedColor,
                fields: [{ name: 'Those commands do not exist, try again:', value: `\`${flag.map(r => { return r }).join('`, `')}\`.`}]
            }])

        client.save(guild.id, { to_change: 'disabedcommands', value: guild.disabedcommands })

        let embed = {
            color: client.data.embedColor,
            fields: []
        }

        if (added.length > 0)
            embed.fields.push({ name: 'Added those commands:', value: `\`${added.map(r => { return r }).join('`, `')}\`.`})

        if (removed.length > 0)
            embed.fields.push({ name: 'Removed those commands:', value: `\`${removed.map(r => { return r }).join('`, `')}\`.`})

        return client.send(message.channel, null, [embed])
    }
}