'use strict'

import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
    /**
     * @param {Relaxy} client 
     * @param {Discord.Interaction} interaction 
     */
    async run(client, interaction) {
        client.module.database.Guild(interaction.guild.id).then(async Guild => {

            if (Guild.disabedcommands.includes(interaction.commandName.toLowerCase())) 
                return interaction.reply({ embeds: [new client.class.error(`${interaction.commandName} has been disabled on this server!`, 1)], ephemeral: true })

            const cmd = client.collections.interactionCommands.get(interaction.commandName)
            const args = interaction.options.data.map(obj => { return obj.value })

            const message = {
                deletable: true,
                attachments: new client.imports.discord.Collection(),
                member: interaction.member,
                id: interaction.id,
                guild: client.guilds.cache.get(interaction.guild.id),
                channel: client.channels.cache.get(interaction.channelId),
                author: interaction.member.user,
                INTERACTION: true
            }

            let allowed = await client.utils.isAllowedUser(Guild, message)

            if (allowed === 0 && allowed !== -1)
                return interaction.reply({ embeds: [{
                    color: client.data.embedColor,
                    description: 'Cannot use Relaxy.'
                }], ephemeral: true })

            let exempt = client.utils.isExempt(Guild, message)

            if (client.utils.isRestricted(Guild, message.channel.id) && !exempt)
                return interaction.reply({ embeds: [{
                    color: client.data.embedColor,
                    description: 'This channel is restricted.'
                }], ephemeral: true })

            if (cmd?.nsfw && !client.channels.cache.get(interaction.channelId)?.nsfw && !exempt)
                return interaction.reply({ embeds: [{
                    color: client.data.embedColor,
                    description: `${message.member}, the **${interaction.commandName}** command can only be used in nsfw enabled channels!`
                }], ephemeral: true })

            message.guild.me = await message.guild.members.fetchMe()

            let command = await cmd.run(client, message, args, Guild, interaction)

            return interaction.reply(command).catch((e) => { console.log(e) })
        })
    }
}