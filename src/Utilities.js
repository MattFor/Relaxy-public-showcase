'use strict'

import fixer from 'dirty-json'
import Mongoose from 'mongoose'
import fs_extra from 'fs-extra'
import Relaxy from './Relaxy.js'
import Discord from 'discord.js'

import isUrl from 'is-url'
import www from 'weird-to-normal-chars'
import ftc from 'replace-special-characters'
import { normalizeWhiteSpaces } from 'normalize-text'

const mainChars = '[\\u265F\\u203C\\u2049\\u2122\\u2139\\u2194-\\u2199\\u21A9\\u21AA\\u231A\\u231B\\u2328\\u23CF\\u23E9-\\u23F3\\u23F8-\\u23FA\\u24C2\\u25AA\\u25AB\\u25B6\\u25C0\\u25FB-\\u25FE\\u2600-\\u2604\\u260E\\u2611\\u2614\\u2615\\u2618\\u261D\\u2620\\u2622\\u2623\\u2626\\u262A\\u262E\\u262F\\u2638-\\u263A\\u2648-\\u2653\\u2660\\u2663\\u2665\\u2666\\u2668\\u267B\\u267E\\u267F\\u2692-\\u2697\\u2699\\u269B\\u269C\\u26A0\\u26A1\\u26AA\\u26AB\\u26B0\\u26B1\\u26BD\\u26BE\\u26C4\\u26C5\\u26C8\\u26CE\\u26CF\\u26D1\\u26D3\\u26D4\\u26E9\\u26EA\\u26F0-\\u26F5\\u26F7-\\u26FA\\u26FD\\u2640\\u2642\\u2702\\u2705\\u2708-\\u270D\\u270F\\u2712\\u2714\\u2716\\u271D\\u2721\\u2728\\u2733\\u2734\\u2744\\u2747\\u274C\\u274E\\u2753-\\u2755\\u2757\\u2763\\u2764\\u2795-\\u2797\\u27A1\\u27B0\\u27BF\\u2934\\u2935\\u2B05-\\u2B07\\u2B1B\\u2B1C\\u2B50\\u2B55\\u3030\\u303d\\u3297\\u3299]'
const contChars = '\\u2695\\uFE0F|\\uD83C\\uDF93|\\uD83C\\uDFEB|\\u2696\\uFE0F|\\uD83C\\uDF3E|\\uD83C\\uDF73|\\uD83D\\uDD27|\\uD83C\\uDFED|\\uD83D\\uDCBC|\\uD83D\\uDD2C|\\uD83D\\uDCBB|\\uD83C\\uDFA4|\\uD83C\\uDFA8|\\u2708\\uFE0F|\\uD83D\\uDE80|\\uD83D\\uDC8B|\\uD83D\\uDE92|\\u2764\\uFE0F|\\uD83D\\uDC66|\\uD83D\\uDC67|\\uD83D\\uDC68|\\uD83D\\uDC69|\\uD83D\\uDC6A|\\uD83D\\uDC91|\\u2620\\uFE0F|\\u2640|\\u2642'
const flagSuppl = '(?:\\uDB40\\uDC67\\uDB40\\uDC62\\uDB40[\\uDC65-\\uDC77]\\uDB40[\\uDC63-\\uDC6F]\\uDB40[\\uDC67-\\uDC74]\\uDB40\\uDC7F)?'
const EMOJIS = RegExp('(\\uD83C[\\uDDE6-\\uDDFF])?(\\u00a9|\\u00ae|' + mainChars.replace(/\]^/, '\\u265F]') +
    '|\\ud83c[\\ud000-\\udfff]|\\ud83d[\\ud000-\\udfff]|\\ud83e[\\ud000-\\udfff]|[#*0-9]\\uFE0F\\u20E3)\\uFE0F?(\\ud83c[\\udffb-\\udfff])?(\\u200d(\\u00a9|\\u00ae|' + contChars +
    '|\\ud83c[\\ud000-\\udfff]|\\ud83d[\\ud000-\\udfff]|\\ud83e[\\ud000-\\udfff]|[#*0-9]\\uFE0F\\u20E3)\\uFE0F?)*' + flagSuppl, 'g')


export default class Util {
    /**
     * Util used for cleaning arrays and other uses.
     * @param {Relaxy} client 
     */
    constructor(client) {
        this.client = client
        this.events = client.data.modlogEvents
    }

    async isSuspiciousUser(guild, message) {
        try {
            if (guild.plugins.raid.on && this.client.data.raid_prevention[guild.id].includes(message.author.id)) {
                // Raid protection on and user is suspected.
                await message.delete().catch(() => {})
                return true
            }

            return false
        } catch {
            await this.client.save(guild.id, { to_change: 'plugins.raid', value: {
                enabled: false,
                on: false,
                ban: false,
                threshhold: 25,
                timeperiod: 300_000,
                account_existance: 2_678_400_000 // MONTH
            }})

            this.client.save(guild.id, { to_change: 'plugins.raid.enabled', value: false })
            return false
        }
    }

    /**
     * Check if a person / role is in excemptions and can use any command.
     * @param {Mongoose.Schema} guild
     * @param {Discord.Message} message 
     */
    isExempt(guild, message) {
        if (!message.member)
            return false

        if (guild.plugins.person_exceptions.includes(message.author.id))
            return true

        return guild.plugins.person_exceptions.some(
            (roleID) => message.member.roles.cache.has(roleID)
        )
    }

    /**
     * Chceck if a channel is restricted.
     * @param {Mongoose.Schema} guild
     * @param {Number} channel_id
     * @returns {Boolean}
     */
    isRestricted(guild, channel_id) {
        return guild.plugins.restricted_channels.includes(channel_id)
    }

    /**
     * Return a relaxy formatted date
     * @param {Date} date 
     * @returns {String}
     */
    formatDate(date) {
        return date.toISOString().split('.')[0].replaceAll('-', '/').replace('T', '-')
    }


    /**
     * Generate a random token from 32 characters.
     * @returns {String}
     */
    genToken() {
        return [...Array(32)].map(i => (~~(Math.random()*32)).toString(32)).join('')
    }

    escapeRegEx(string){
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    /**
     * Chceck if emojis unicode is valid
     * @param {String} string 
     * @returns {Array<String>}
     */
    isValidEmoji(string) {
        let _a = this.cleanup(string.split(' '))
        let _b = _a.length
        let _c = 0
        let _d = null

        for (let i = 0; i < _b; i++) {
            if (_a[i].match(/^(:[^:\s]+:|<:[^:\s]+:[0-9]+>|<a:[^:\s]+:[0-9]+>)+$/)) {
                if (this.client.config.emojiCache.indexOf(_a[i].split(':')[2].replace('>', '')))
                    _c++
            } else if (_a[i].match(EMOJIS)) {
                _c++
            } else _d = []
        }

        return _d !== null ? _d : _c === _a.length ? _a : null
    }

    /**
     * Get the first set of numbers from a string.
     * @param {String} string 
     * @returns {String}
     */
    nums(string) {
        try {
            return string.match(/\d+/g)[0]
        } catch { 
            return null 
        }
    }

    /**
     * Get all of the channels from a modlog as well as verify existing ones
     * @param {Mongoose.Document} guild 
     * @returns 
     */
    async modlogChannels(guild) {
        let channels = []

        for (const [key, value] of Object.entries(this.events)) {
            if (!guild.plugins.modlog.events[key])
                await this.client.save(guild.id, { to_change: `plugins.modlog.events.${key}`, value: {
                    enabled: false,
                    channel: ''
                }})

            if (value.channel.length > 0)
                channels.push(value.channel)
        }

        return channels
    }

    /**
     * Check if a person / role is allowed to use Relaxy.
     * @param {Mongoose.Schema} guild
     * @param {Discord.Message} message 
     */
    async isAllowedUser(guild, message) {
        if (guild.plugins.allowed_people.includes(message.author.id))
            return 1

        const allowed_length = guild.plugins.allowed_people.length
        for (let i = 0; i < allowed_length; i++) {
            if (message?.member?.roles?.cache.has(guild.plugins.allowed_people[i]))
                return 1
        }

        if (guild.plugins.allowed_people.length === 0)
            return -1

        return 0
    }

    /**
     * Remove all '' spaces from an array
     * @param {Array<String>} array 
     * @returns {Array<String>}
     */
    cleanup(array) {
        return array.filter(item => item !== '')
    }

    /**
     * Make the first character of a string uppercase 
     * @param {String} string 
     * @returns {String}
     */
    firstLetterUp(string) {
        try {
            let result = `${string.charAt(0).toUpperCase()}${string.slice(1)}`
            return result
        } catch {
            return string
        }
    }

    /**
     * Check if a url ends with png.
     * @param {String} msgAttach 
     * @returns {Boolean}
     */
    attachIsImage(msgAttach) {
        let url = msgAttach.url
        return url.indexOf('png', url.length - 3) !== -1
    }

    /**
     * Stop program execution for a set amount of time.
     * @param {Number} ms 
     */
    async sleep(ms) {
        await new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Count all files in a directory.
     * @param {String} directory 
     * @returns {Number}
     */
    fileCount(directory) {
        let fCount = 0

        fs_extra.readdir(`${directory}`, (e, files) => {
            files.forEach(f => {
                fCount++
            })
        })

        return fCount
    }

    censorCheck(args, guild, showIndex, test) {
        if (!guild.plugins.censoring.enabled && !test)
            return false

        let link_flag = guild.plugins.censoring.censorPool.includes('links')
        let invite_flag = guild.plugins.censoring.censorPool.includes('invites')

        let check = this.norm(args.join('')
            .replaceAll('4', 'a').replaceAll('1', 'i').replaceAll('!', 'i')
            .replaceAll(/[$&+,:;=?@#|'<>.^*()%/[\]\\-]/g, '')
            .replaceAll(/g{2,}/g, 'gg').replaceAll(/i+/g, 'i')).toLowerCase()
        
        let checks = check.match(/[^iIgG]+/g)

        if (checks)
            for (const c of checks)
                if (c.length > 1) {
                    let bucket = new Set(c)
                    for (const z of bucket.keys())
                        try {
                            for (const m of check.match(new RegExp(`${z}+`, 'g'))) 
                                check = check.replaceAll(m, z)
                        } catch {}
                }

        let i = 0
        for (const word of guild.plugins.censoring.censorPool) {
            if (check.includes(word[0] === word[word.length - 1] === '*' ? `${word}`.slice(1, word.length - 2).replaceAll('-', ' ') : word))
                if (word.length < 4 && !this.norm(args.join('')).includes(word))
                    continue
                else
                    return showIndex ? [i] : true
            i++
        }

        if (link_flag)
            for (const word of args)
                if (this.isValidEmoji(word).length === 0 && isUrl(word))
                    return true

        if (invite_flag)
            for (const word of args)
                if (word.match(/(https?:\/\/|http?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite|discord.com\/invite)\/[^\s\/]+?(?=\b)/))
                    return true

        return false
    }

    /**
     * Create an extendable by field list
     * @param {String} text 
     */
    createDescription(text, embed, limit=4500, nullFields) {
        text = text.slice(0, limit)
        embed.description = text.slice(0, 2048)

        if (text.length > 2048) {
            let i = 0
            while (true) {
                if ((i + 1) * 1024 > text.length || embed.fields.length > 6)
                    break

                embed.fields.push({ name: `Continuation #${i + 1}`, value: text.slice((i + 1) * 1024, (i + 2) * 1024) })
                i++
            }
        }

        if (nullFields && embed.fields.length === 0)
            embed.fields = null

        if (embed.description.length < 3)
            embed.description = 'None.'

        return embed
    }

    /**
     * Make a nice list out users/roles
     */
    async makeList(list, cache, userMember, additional) {
        let result_str = ''

        for (const item of list) {
            let user = userMember === 0 ? await this.client.getUser(item).catch(() => {}) : await this.client.getMember(userMember, item).catch(() => {})
            let to_add = `${user??cache.get(item)??''}, `
            if (to_add.length > 3)
                result_str += to_add
        }

        return result_str.length > 3 ? `${result_str.slice(0, result_str.length - 2)}.`.slice(0, 6000) : additional ? additional : 'None.'
    }

    /**
     * Retrieve a role by id, name or mention.
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Number} index Arguments index
     * @returns {Discord.Role}
     */
    role(message, args, index) {

        if (message.INTERACTION)
            return message.guild.roles.cache.get(args[0])

        if (index && index > args.length - 1)
            index = args.length - 1

        let c1 = message.guild.roles.cache.find(r => r.name === args.join(' ') || ((index !== null) ? args[(index !== null) ? index : 0].includes(r.name) : false))
        let c2 = message.mentions.roles.size > 1 ? message.mentions.roles.at(1) ? message.mentions.roles.at(1) : (index !== null) ? message.mentions.roles.at(index) : null : message.mentions.roles.first()
        let c3 = message.guild.roles.cache.get(this.nums(args[(index !== null) ? index : 0]))

        return c1 || c2 || c3 || null
    }

    /**
     * Retrieve a user by id, username or mention.
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Number} index Arguments index
     * @returns {Promise<Discord.User>}
     */
    async user(message, args, index) {

        if (index && index > args.length - 1)
            index = args.length - 1

        if (index > 0)
            args.slice(0, index)

        let c1 = message.mentions.members.size > 1 ? (index !== null) ? message.mentions.members.at(index) : message.mentions.members.at(1) : null
        let c2 = await this.client.getUser(this.nums(args[(index !== null) ? index : 0])).catch(() => {})

        return c1 || c2 || null
    }

    /**
     * Retrieve a member by id, username or mention.
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Number} index Arguments index
     * @returns  {Promise<Discord.GuildMember>}
     */
    async member(message, args, index) {
        if (message.INTERACTION)
            return await this.client.getMember(message.guild, args[index !== null ? index : 0])

        const user_id = args.join(' ').match(/[0-9]+/g)?.[0]??null

        let discriminator = ''
        let args_cpy = [...args]
        let arg_str = args_cpy.join(' ')

        if (index > 0)
            args_cpy.slice(0, index)

        let c1 = await message.guild.members.search({ query: (index !== null) ? args_cpy[index] : arg_str, limit: 10, cache: false }).catch(() => {}) ?? null
        c1 = c1?.find(m => m.nickname ? m.nickname.split(' ').length === args.length : m.user.username.split(' ').length === args.length) ?? null
        const c2 = message.mentions.members.size > 1 && (index !== null) ? message.mentions.members.at(index) : message.mentions.members.at(1) ?? null
        let c3 = await this.client.getMember(message.guild, this.nums(args_cpy[index !== null ? index : 0])).catch(() => {})??null

        c3 = c3??await this.client.getMember(message.guild, this.nums(args_cpy[index !== null ? index : 0])).catch(() => {})??null

        if (arg_str.match(/#[0-9]{4}/g)) {
            discriminator = arg_str.match(/#[0-9]{4}/g)[0]
            let extra_search = await message.guild.members.search({ query: args_cpy.join(' ').replace(discriminator, ''), limit: 20, cache: false }).catch(() => {})
            if (extra_search) {
                const result = extra_search.find(u => discriminator.includes(u.user.discriminator))
                if (result?.user.username.split(' ').length === args.length)
                    return result
            }
        }

        let result = c3 || c2 || c1 || null

        while (args_cpy.length > 0 && !result) {
            if (c1?.size > 0) {
                const result1 = c1.first()
                if (result1?.user.username.split(' ').length === args.length)
                    return result1
            }

            if (args_cpy.length <= 0)
                return null

            args_cpy.shift()
            c1 = await message.guild.members.search({ query: args_cpy.join(' '), limit: 1, cache: false }).catch(() => {})
            await this.sleep(500)
        }

        if (result?.user?.username?.split(' ').length <= args.length || user_id && result)
            return result

        return null
    }

    /**
     * Retrieve a channel by id, username or mention.
     * @param {Discord.Message} message 
     * @param {String[]} args 
     * @param {Number} index Arguments index
     * @returns {Discord.GuildChannel}
     */
    channel(message, args, index = null) {
        let argIndex = (index !== null && index <= args.length - 1) ? index : 0
        let byId = message.guild.channels.cache.get(this.nums(args[argIndex]))
        let byName = message.guild.channels.cache.find(c => c.name === args[argIndex])
        let byMention = (message.mentions.channels.size > 0 ) ? ((index !== null && message.mentions.channels.at(index)) ? message.mentions.channels.at(index) : message.mentions.channels.first()) : null
      
        return byId || byName || byMention || null
    }

    /**
     * @param {Discord.Message} message 
     */
    getImages(message) {
        return message.attachments
            .filter(({ proxyURL }) => /\.(gif|jpe?g|png|webp)$/i.test(proxyURL))
            .map(({ proxyURL }) => proxyURL)
    }

    /**
     * Get the shard-wide server count.
     * @returns {Promise<Number>}
     */
    async getServerCount() {
        const req = await this.client.cluster.fetchClientValues('guilds.cache.size')
        return req.reduce((acc, guildCount) => acc + guildCount, 0)
    }

    /**
     * Get the shard-wide user count.
     * @returns {Promise<Number}
     */
    async getUserCount() {
        return (await this.client.cluster.broadcastEval(c => { 
            return c.guilds.cache.map(g => { return g.memberCount??0  }).reduce((acc, count) => { return acc + count }) 
        })).reduce((acc, userCount) => acc + userCount, 0)
    }

    cstr(str) {
        const escapedChars = ['~', '|', '_', '*', '`']
        return str ? str.replace(new RegExp(`[${escapedChars.join('\\')}]`, 'g'), '\\$&') : undefined
    }

    /**
     * Calculate the global rank of a user.
     * @param {Discord.Message} message 
     * @param {Mongoose.Schema} user 
     * @returns {Promise<Number>}
     */
    async calculateGlobalRank(message, user) {
        const globals = await this.client.module.database.findAllUsers()
        const array = globals.map((global) => `${global.level}.${global.id}`)
        array.shift()
        const sortedArray = this.radix(array)
        const userRank = sortedArray.indexOf(`${user.level}.${message.author.id}`)
        return userRank
    }

    /**
     * Get a human readable string of the event emmited with VoiceStateUpdate.
     * @param {Discord.VoiceState} oldMember 
     * @param {Discord.VoiceState} newMember 
     * @returns {String}
     */
    getVoiceState(oldMember, newMember) {
        const states = {
            selfDeaf: ['Deafened themselves', 'Undeafened themselves'],
            selfMute: ['Muted themselves', 'Unmuted themselves'],
            streaming: ['Started streaming', 'Stopped streaming'],
            serverDeaf: ['Was deafened by staff', 'Was undeafened by staff'],
            serverMute: ['Was muted by staff', 'Was unmuted by staff']
        }
    
        let state = Object.keys(states).find(key => oldMember[key] !== newMember[key])
        state = state ? `\`${states[state][Number(newMember[state])]}\`` : ''
    
        if (!state)
            if (oldMember.channel?.id !== newMember.channel?.id)
                state = '`Switched voice channel`'
            else
                state = newMember.channel ? '`Joined voice channel`' : '`Left voice channel`'

        return state
    }

    next_level(level) {
        return Math.floor(74 * Math.pow(1.3, level + 1) * 0.85)
    }

    radix(arr) {
        const results = []
        const buckets = Array.from({ length: 10 }, () => []);
        let power = 0

        if (arr.length <= 1)
            return arr

        while (true) {
            let isDone = true
            for (const num of arr)
                if (num >= 10 ** power) {
                    buckets[Math.floor(num / 10 ** power) % 10].push(num)
                    isDone = false
                } else
                    results.push(num)

            if (isDone)
                break

            arr.length = 0
            buckets.forEach(bucket => arr.push(...bucket))
            buckets.forEach(bucket => bucket.length = 0)
            power += 1
        }

        return results.concat(arr).reverse()
    }

    get_time(str) {
        // Convert input string to a number
        let time = Number(this.client.utils.nums(str))
        
        // Check if time is a valid number or string and if it matches the time_table array
        if (typeof time !== 'number' && !this.client.config.text.timeTable.includes(str.toLowerCase().replaceAll(time.toString(), '').replaceAll(' ', '')))
            return undefined

        // Remove whitespace from input string and set time_format to an empty string
        str = str.replaceAll(' ', '')
        let time_format = ''

        // Loop through each element in the time_table array
        for (let i = 0; i < this.client.config.text.timeTable.length; i++) {
            // Check if input string contains time_table element
            if (str.includes(this.client.config.text.timeTable[i])) {
            // If time_format is an empty string, set it to the time_table element and perform necessary calculations based on the time value
                if (time_format === '') {
                    time_format = this.client.config.text.timeTable[i]     
                    // If time is not defined, set it to 1 and time_format to "day"
                    if (!time) {
                        time = 1
                        time_format = 'day'
                    }
                    
                    // Convert time to milliseconds
                    time = time * 1000
                    
                    // Use a switch statement to check the time_format and convert the time to the appropriate value based on the time_format
                    switch (time_format) {
                    case 'm':
                    case 'min':
                    case 'minute':
                    case 'minutes':
                        return time * 60
                    case 'h':
                    case 'hr':
                    case 'hour':
                    case 'hours':
                        return time * 60 * 60
                    case 'day':
                    case 'days':
                        return time * 60 * 60 * 24
                    case 'week':
                    case 'weeks':
                        return time * 60 * 60 * 24 * 7
                    case 'month':
                    case 'months':
                        return time * 60 * 60 * 24 * 30
                    case 'y':
                    case 'year':
                        return time * 60 * 60 * 24 * 365
                    default:
                        return time
                    }
                } // If time_format is not an empty string, check if input string equals time_table element and convert time to the appropriate value based on the time_format
                else if (str === this.client.config.text.timeTable[i]) {
                    switch (time_format) {
                    case 'm':
                    case 'min':
                    case 'minute':
                    case 'minutes':
                        return 1000 * 60
                    case 'h':
                    case 'hr':
                    case 'hour':
                    case 'hours':
                        return 1000 * 60 * 60
                    case 'day':
                    case 'days':
                        return 1000 * 60 * 60 * 24
                    case 'week':
                    case 'weeks':
                        return 1000 * 60 * 60 * 24 * 7
                    case 'month':
                    case 'months':
                        return 1000 * 60 * 60 * 24 * 30
                    case 'y':
                    case 'year':
                        return 1000 * 60 * 60 * 24 * 365
                    default:
                        return 1000 * 60 * 60 * 6
                    }
                }
            }
        }

        // If time_format is still an empty string after the loop, return time in milliseconds
        return time * 1000
    }

    norm(string) {
        switch (typeof string) {
            case 'string':
                return ftc(www.weirdToNormalChars(string))
            case 'array':
                return ftc(www.weirdToNormalChars(string.join(' ')))
            default:
                return null
        }
    }

    objectify(data) {
        const formattedData = normalizeWhiteSpaces(data)
            .replace(/export default/g, '') 
            .replace(/[\n\r]+/g, '') 
            .replaceAll(/\s+/, ' ') 
            .replaceAll('"https":"\\/\\/', '"https://')
            .replace(/([\{\[\,\:\}])\s+/g, '$1') 
            .replace(/\,\]/g, ']')
            .replace(/\,\}/g, '}')  
            .replaceAll('""', '') 
            .replaceAll('--TTTTewdqccrfqw--', ':')
            .replaceAll('--DOWNSPACE--', '\n')
            .replaceAll('FLAG"', 'FLAG') 
            .replaceAll('\\=', '\\n')
            .replace(/FLAG(\W+)/g, '$1') 
            .replace(/\(\s+"/g, '(')
            .replace(/"\s+\)/g, ')')
            .replaceAll('<>', ',')

        return fixer.parse(formattedData)
    }
}