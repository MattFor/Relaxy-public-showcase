'use strict'

import Mongoose from 'mongoose'
import Discord from 'discord.js'
import Relaxy from '../../../src/Relaxy.js'


export default {
	name: 'warn',
	cooldown: 3,
	usage: '=warn user reason (tier[number here])',
	args: true,
	permissions: ['MODERATE_MEMBERS'],
	permissionsBOT: ['EMBED_LINKS', 'BAN_MEMBERS'],
	description: 'Warn a user (also sends event to the modlog), maximum reason length is 1024 characters.\nYou can assign a tier to a warning by mentioning "tier(number here from 0 - 30" f.e tier5.\nThis must be lower case and together, it will be later removed from the actual reason and add up to a user\'s threat level.\nIf a warning tier is above half of the highest tier on the server, it will count towards autobanning if it\'s enabled.',
    /**
     * @param {Relaxy} client 
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Mongoose.Document} guild 
     * @param {Discord.Interaction} interaction 
     */
	async run(client, message, args, guild, interaction) {
		let member = await client.utils.member(message, args, 0)??null

		if (!member)
			return new client.class.error('That user does not exist!', interaction ?? message)

        if (member.permissions.has(client.imports.discord.PermissionFlagsBits['Administrator']))
            return new client.class.error('Can\'t warn user with administrator privlidges!', interaction ?? message)

        if (member.roles.highest.position >= message.member.roles.highest.position)
            return new client.class.error('You can not warn a member that is equal to or higher than yourself!', interaction ?? message)

        args.shift()
		args = args.join(' ')

		if (typeof guild.warnings !== 'object')
			await client.save(message.guild.id, {
				to_change: 'warnings',
				value: {}
			})

		if (!guild.warnings[member.user.id])
			guild.warnings[member.user.id] = []

		let tiermatch = args.match(/(tier)\d{1,2}/gmi)
		let number = 0

		if (tiermatch) {
			number = Number(client.utils.nums(tiermatch[0]))
			if (number < 0 || number > 30)
				return new client.class.error('Minimum warning tier is 0, maximum is 30!', message)
		}

		let reason = args ? args.slice(0, 1024).replaceAll(tiermatch ? tiermatch[0] : 'XXXXXXXXXXXXXXX', '') : 'No reason provided.'

		guild.warnings[member.user.id].push({ reason: reason.length > 1 ? reason : 'None.', tier: tiermatch ? Number(client.utils.nums(tiermatch[0])) : 0, author: message.author.id, tag: member.user.tag })

		client.save(message.guild.id, {
			to_change: 'warnings',
			value: guild.warnings
		})

		let limit = guild.plugins.censoring.autobanning

		
        let maxThreat = Math.max(
            ...Object.values(guild.warnings)
            .flat()
            .filter(warn => typeof warn === 'object' && warn.author === client.user.id)
            .map(warn => warn.tier)
        )

        if (maxThreat < 3)
            maxThreat = 3

		let threat = 0
		for (const warn of guild.warnings[member.user.id])
			if (typeof warn === 'string' || typeof warn === 'object' && threat >= Math.ceil(maxThreat / 2) || typeof warn === 'object' && warn.author === client.user.id && warn.tier !== -1)
				threat++

		let max_threat_local = 0
		for (const warn of guild.warnings[member.user.id]) {
			if (typeof warn === 'object' && warn.tier > max_threat_local)
				max_threat_local = warn.tier
			if (typeof warn === 'string')
				max_threat_local = 3
		}

		let embed = new Discord.EmbedBuilder()
			.setColor(client.data.embedColor)
			.setTitle(`Warned ${member.nickname ? `${member.nickname}#${member.user.discriminator}` : `${member.user.username}#${member.user.discriminator}`}`)
			.addFields([
				{ name: 'By:', value: `**${message.member}**` },
				{ name: 'Reason:', value: `${reason.length > 1 ? reason : 'No reason provided.'}` },
				tiermatch ? { name: 'Tier:', value: `Warning tier: **\`(${number}/${maxThreat})\`**` } : null, 
				{ name: 'Additional:', value: `**${member}** **\`(${guild.warnings[member.user.id].length})\`** **\`[${threat}/${limit}]\`** **\`{${max_threat_local}/${maxThreat}}\`**` }
			].filter(f => f !== null))
			.setThumbnail(member.displayAvatarURL({
				dynamic: true,
				size: 4096
			}))
			.setFooter({ text: 'Event emitted', iconURL: client.config.text.links.relaxyImage })
			.setTimestamp()


		if (guild.plugins.modlog.enabled)
			client.data.modlog_posts[guild.id].push(['warning', embed])

        if (limit > 0 && threat >= limit) {
			if (member.roles.highest.position >= message.guild.me.roles.highest.position)
            	return new client.class.error('User exceeded allowed limit, but his role is higher than mine, cannot ban!', interaction ?? message)

			for (let i = 0; i < guild.warnings[member.user.id].length; i++)
				guild.warnings[member.user.id][i] = typeof guild.warnings[member.user.id][i] === 'string' ? { reason: guild.warnings[member.user.id][i], tier: -1, author: 'Unavailable', tag: 'Unavailable' } : { reason: guild.warnings[member.user.id][i].reason, tier: -1, author: guild.warnings[member.user.id][i].author, tag: guild.warnings[member.user.id][i].tag }

            await client.save(message.guild.id, {
                to_change: 'warnings',
                value: guild.warnings
            })

			embed.setTitle(`Banned ${member.nickname ? `${member.nickname}#${member.user.discriminator}` : `${member.user.username}#${member.user.discriminator}`}`)

			client.save(message.guild.id, {
				to_change: 'caseCount',
				value: ++guild.caseCount
			}, {
				to_change: 'warnings',
				value: guild.warnings
			})

			member.ban({ reason: 'Exceeding the Relaxy warn limit.' })

			if (guild.plugins.censoring.channel)
				try {
					return client.send(client.channels.cache.get(guild.plugins.censoring.channel), `${member} has been banned. **[Case: #${guild.caseCount}]**`, [embed])
				} catch {
					client.save(message.guild.id, {
						to_change: 'plugins.censoring.channel',
						value: ''
					})
				}

			return client.send(message.channel, `${member} has been banned. **[Case: #${guild.caseCount}]**`, [embed])
        } else {
			return client.send(message.channel, null, [embed])
		}
	}
}