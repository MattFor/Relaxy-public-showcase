'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    name: 'help',
    aliases: ['commands'],
    slash: new Discord.SlashCommandBuilder().addStringOption(option => option.setName('command_name').setDescription('Name or alias of the command to search.').setRequired(false)),
    usage: '=help commandname (optional)',
    description: 'Get a list of all commands or information about a single command.',
    permissionsBOT: ['EMBED_LINKS', 'ATTACH_FILES'],
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, message, args, guild, interaction) {
        if (args[0]) {
            const command = client.collections.commands.get(args[0].toLowerCase()) || client.collections.aliases.get(args[0].toLowerCase())

            if (!command)
                if (interaction)
                    return { embeds: [new client.class.error('There\'s no command like that!', 1)] }
                else 
                    return new client.class.error('There\'s no command like that!', interaction ?? message)

            let file = []
            let embed = new client.imports.discord.EmbedBuilder()
                .setColor(client.data.embedColor)
                .setTimestamp()
                .setTitle(`**${guild.prefixes[0]}${command.name} explanation:**`)
                .addFields([{ name: 'Usage:', value: `${guild.prefixes[0]}${command.usage.slice(1, command.usage.length)}` }])
                .setFooter(client.data.footer)
                .setThumbnail('https://cdn.discordapp.com/attachments/775450442989568061/786180226967142480/9826172.gif')

            if (client.imports.fs.existsSync(`./additions/images/commands/${command.name}.png`)) {
                file.push(new Discord.AttachmentBuilder(`./additions/images/commands/${command.name}.png`, { name :`${command.name}.png` }))
                embed.setImage(`attachment://${command.name}.png`)
            }

            let description = command.name === 'welcomechannel' ? command.description.split('XXXX')[0] : command.description

            if (command.aliases) {
                description += '\n\n**Aliases:**   **'

                let alias_length = command.aliases.length

                for (let i = 0; i < alias_length; i++)
                    description += `\`${command.aliases[i]}\`, `

                description = `${description.slice(0, -2)}.**\n`
            }

            if (command.cooldown)
                embed.addFields([{ name: 'Cooldown', value: `**Time: \`${client.imports.time(command.cooldown * 1000)}\`.**` }])

            if (command.nsfw)
                embed.addFields([{ name: 'NSFW', value: '**This command can only be used in nsfw channels.**' }])

            if (command.args)
                embed.addFields([{ name: 'Arguments', value: '**This command requires arguments.**' }])
            else
                embed.addFields([{ name: 'Arguments', value: '**This command doesn\'t require arguments.**' }])

            if (command.name === 'welcomechannel')
                embed.addFields([{ name: 'Available options:', value: command.description.split('XXXX')[1] }])

            if (command.permissions) {
                embed.addFields([{ name: 'User permissions:', value: `${command.permissions ? command.permissions.map((permission) => {
                    return `\`${permission}\``
                }).join(', ') : 'None'}.`}])
            }

            if (command.permissionsBOT) {
                embed.addFields([{ name: 'Relaxy permissions:', value: `${command.permissionsBOT ? command.permissionsBOT.map((permission) => {
                    return `\`${permission}\``
                }).join(', ') : 'None'}.`}])
            }

            embed.setDescription(description)


            if (interaction)
                return { embeds: [embed], files: file }

            return client.send(message.channel, null, [embed], file)
        }

        let embed = new client.imports.discord.EmbedBuilder()
            .setColor(client.data.embedColor)
            .setTimestamp()
            .setTitle('List of commands:', 'https://cdn.discordapp.com/attachments/775450442989568061/786180226967142480/9826172.gif')
            .setFooter(client.data.footer)
            .setThumbnail('https://media.tenor.com/images/822fb670841c6f6582fefbb82e338a50/tenor.gif')
            .setDescription(`The main prefix on this server is **\`${guild.prefixes[0]}\`**.\nDefault global prefix is **\`${client.config.text.defaultPrefix}\`**.\nTo use a command type it like this **${guild.prefixes[0]}\`command\`**  f.e  **=image**.\nSome commands have aliases, cooldowns or can only be used in __nsfw__ channels.\nTo see the specifics of any command type **=help \`command\`**.\n**[My Patreon link :)](https://www.patreon.com/MattFor)**`)

        let command_count = 0

        client.imports.fs.readdirSync('./commands').forEach(dir => {
            if (dir === 'administrator' && message.author.id !== client.config.keys.owner)
                return

            let commands = client.imports.fs.readdirSync(`./commands/${dir}`)
            let CommandsOfficial = []

            for (let category of commands)
                CommandsOfficial.push(client.collections.commands.get(category.slice(0, -3)))

            embed.addFields([{ name: `${client.utils.firstLetterUp(dir)}:`, value: `${CommandsOfficial.map((command) => {
                if (command) {
                    command_count++
                    return `\`${command.name}${command.leaveout ? ' [Out of order]' : ''}\`, `
                }
            }).join('').slice(0, -2)}.`}])
        })

        embed.setAuthor({ name: `Command count: ${command_count}` })
        embed.addFields([{ name: 'Special exceptions:', value: client.imports.fs.readFileSync('./bot/configuration/help_special_exceptions.ini').toString() }])


        if (interaction)
            return { embeds: [embed] };

        return client.send(message.channel, null, [embed]);
    }
}