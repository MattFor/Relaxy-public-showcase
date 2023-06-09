'use strict'

//////////////////////////////////////////////////////////
///////////////   CORE MODULE IMPORTS    //////////////// 
////////////////////////////////////////////////////////
import RC_Core from './Core.js'
import RC_Utilities from './Utilities.js'
import { ClusterClient as RC_ClusterClient } from 'discord-hybrid-sharding'

//////////////////////////////////////////////////////////
//////////////   HANDLER MODULE IMPORTS   /////////////// 
////////////////////////////////////////////////////////
// Client
import RM_H_C_Database from './Handlers/Client/Database.js'
import RM_H_C_Requests from './Handlers/Client/Requests.js'
import RM_H_C_Profiles from './Handlers/Client/Profiles.js'
import RM_H_C_FileInteractions from './Handlers/Client/FileInteractions.js'
// Service
import RM_H_S_Events from './Handlers/Service/Events.js'
import RM_H_S_ClientManagerComms from './Handlers/Service/ClientManagerComms.js'

//////////////////////////////////////////////////////////
///////////////   VOICE MODULE IMPORTS   //////////////// 
////////////////////////////////////////////////////////
import RM_V_MusicPlayer from './MusicPlayer/Player.js'
import RM_V_VoiceRecorder from './VoiceRecorder/RecordingFactory.js'

//////////////////////////////////////////////////////////
/////////////   ITEM BLUEPRINT IMPORTS    /////////////// 
////////////////////////////////////////////////////////
import RI_Snake from './Blueprints/Games/Snake.js'
import RI_Minesweeper from './Blueprints/Games/Minesweeper.js'
import RI_ErrorEmbed from './Blueprints/Relaxy/Embeds/Error.js'
import RI_ModLogEmbed from './Blueprints/Relaxy/Embeds/Modlog.js'
import RI_HeartBoardPostEmbed from './Blueprints/Relaxy/Embeds/HeartBoardPost.js'

//////////////////////////////////////////////////////////
/////////////  ROUTINE BLUEPRINT IMPORTS  /////////////// 
////////////////////////////////////////////////////////
import RI_R_Poll from './Blueprints/Relaxy/Routines/Poll.js'
import RI_R_CustomEmbed from './Blueprints/Relaxy/Routines/CustomEmbed.js'

//////////////////////////////////////////////////////////
/////////////    DATA TYPE BLUEPRINT IMPORTS   ////////// 
////////////////////////////////////////////////////////
import RI_DT_FileRequest from './Blueprints/DataTypes/FileRequest.js'

//////////////////////////////////////////////////////////
/////////////////     OTHER IMPORTS    ////////////////// 
////////////////////////////////////////////////////////
import Time from 'pretty-ms'
import Request from 'request'
import Mongoose from 'mongoose'
import Discord from 'discord.js'
import FileSystem from 'fs-extra'
import Canvacord from 'canvacord'
import Beautify from 'json-beautify'
import Progressbar from 'string-progressbar'
import Translator from '@iamtraction/google-translate'


//////////////////////////////////////////////////////////
///////////////////    CONSTANTS    /////////////////////
////////////////////////////////////////////////////////
const MODE_SPECIAL_NORMAL = -1
const MODE_NORMAL = 0
const MODE_DEBUG = 1
const MODE_MAINTENANCE = 2
const MODE_SILENT = 3
const MODE_OFFLINE = 4
const modlogEvents = {
    other: {
        enabled: false,
        channel: ''
    },
    warning: {
        enabled: false,
        channel: ''
    },
    memberMuted: {
        enabled: false,
        channel: ''
    },
    memberUnmuted: {
        enabled: false,
        channel: ''
    },
    channelUpdate: {
        enabled: false,
        channel: ''
    },
    channelCreate: {
        enabled: false,
        channel: ''
    },
    channelDelete: {
        enabled: false,
        channel: ''
    },
    emojiCreate: {
        enabled: false,
        channel: ''
    },
    emojiDelete: {
        enabled: false,
        channel: ''
    },
    emojiUpdate: {
        enabled: false,
        channel: ''
    },
    guildBanAdd: {
        enabled: false,
        channel: ''
    },
    guildBanRemove: {
        enabled: false,
        channel: ''
    },
    guildMemberAdd: {
        enabled: false,
        channel: ''
    },
    guildMemberRemove: {
        enabled: false,
        channel: ''
    },
    guildMemberUpdate: {
        enabled: false,
        channel: ''
    },
    inviteCreate: {
        enabled: false,
        channel: ''
    },
    inviteDelete: {
        enabled: false,
        channel: ''
    },
    messageDelete: {
        enabled: false,
        channel: ''
    },
    messageUpdate: {
        enabled: false,
        channel: ''
    },
    roleCreate: {
        enabled: false,
        channel: ''
    },
    roleDelete: {
        enabled: false,
        channel: ''
    },
    roleUpdate: {
        enabled: false,
        channel: ''
    },
    voiceStateUpdate: {
        enabled: false,
        channel: ''
    },
    messageDeleteBulk: {
        enabled: false,
        channel: ''
    },
    stickerCreate: {
        enabled: false,
        channel: ''
    },
    stickerDelete: {
        enabled: false,
        channel: ''
    },
    stickerUpdate: {
        enabled: false,
        channel: ''
    },
    threadCreate: {
        enabled: false,
        channel: ''
    },
    threadDelete: {
        enabled: false,
        channel: ''
    },
    threadUpdate: {
        enabled: false,
        channel: ''
    },
    channelPinsUpdate: {
        enabled: false,
        channel: ''
    }
}
const humanReadableEvents = {
    'other': 'Other event.',
    'warning': 'Member warned.',
    'memberMuted': 'Member muted.',
    'memberUnmuted': 'Member unmuted.',
    'channelUpdate': 'Channel updated.',
    'channelCreate': 'Channel created.',
    'channelDelete': 'Channel deleted.',
    'emojiCreate': 'Emoji created.',
    'emojiDelete': 'Emoji deleted.',
    'emojiUpdate': 'Emoji updated.',
    'guildBanAdd': 'Member banned.',
    'guildBanRemove': 'Member unbanned.',
    'guildMemberAdd': 'Member joined.',
    'guildMemberRemove': 'Member left.',
    'guildMemberUpdate': 'Member updated.',
    'inviteCreate': 'Invite created.',
    'inviteDelete': 'Invite deleted.',
    'messageDelete': 'Message deleted.',
    'messageUpdate': 'Message edited.',
    'roleCreate': 'Role created.',
    'roleDelete': 'Role deleted.',
    'roleUpdate': 'Role updated.',
    'voiceStateUpdate': 'Voice chat interaction.',
    'messageDeleteBulk': 'Mass message deletion.',
    'stickerCreate': 'Sticker created.',
    'stickerDelete': 'Sticker deleted.',
    'stickerUpdate': 'Sticker updated.',
    'threadCreate': 'Thread created.',
    'threadDelete': 'Thread deleted.',
    'threadUpdate': 'Thread updated.',
    'channelPinsUpdate': 'Channel pins updated.'
}

const toNormalPerm = (str) => {
    return str.split('_').map((word, i) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }).join('')
}


export default class Relaxy extends Discord.Client {
    /**
     * Start a new instance of the Relaxy.
     * @param {NodeJS.Process} options.process
     * @param {Discord.ClientOptions} options.defaultClient
     */
    constructor(options) {
        super(options.defaultClient)

        /**
         * Packages included with the Relaxy class
         * @param {Time} imports.time pretty-ms
         * @param {FileSystem} imports.fs fs-extra
         * @param {Request} imports.request request
         * @param {Discord} imports.discord discord.js
         * @param {Beautify} imports.beautify json-beautify
         * @param {Mongoose} imports.mongoose mongoose
         * @param {Canvacord} imports.canvacord canvacord
         * @param {Translator} imports.translator @iamtraction/google-translate
         * @param {Progressbar} imports.progressbar string-progressbar
         */
        this.imports = {
            'time': Time,
            'fs': FileSystem,
            'request': Request,
            'discord': Discord,
            'beautify': Beautify,
            'mongoose': Mongoose,
            'canvacord': Canvacord,
            'translator': Translator,
            'progressbar': Progressbar
        }


        /**
         * Objects that can be constructed with class Relaxy 
         * @param {RI_ErrorEmbed} class.error Typical Relaxy error embed
         * @param {RI_ModLogEmbed} class.modlog Modlog embed used in the modlog queues
         * @param {RI_HeartBoardPostEmbed} class.heartboardpost A heartboardpost
         * Games
         * @param {RI_Snake} class.snake
         * @param {RI_Minesweeper} class.minesweeper
         * Routines
         * @param {RI_R_Poll} class.pol
         * @param {RI_R_CustomEmbed} class.customEmbed
         * Data types
         * @param {RI_DT_FileRequest} class.fileRequestPacket
         */
        this.class = {
            'error': RI_ErrorEmbed,
            'modlog': RI_ModLogEmbed,
            'heartboardpost': RI_HeartBoardPostEmbed,

            'snake': RI_Snake,
            'minesweeper': RI_Minesweeper,

            'poll': RI_R_Poll,
            'customEmbed': RI_R_CustomEmbed,

            'fileRequestPacket': RI_DT_FileRequest
        }


        /**
         * Vast collections used to store important data
         * @param {Discord.Collection} collections.commands
         * @param {Discord.Collection} collections.interactionCommands
         * @param {Discord.Collection} collections.aliases
         * @param {Discord.Collection} collections.starts
         * @param {Discord.Collection} collections.cooldowns
         * @param {Discord.Collection} collections.voiceChatTimes
         */
        this.collections = {
            'forums': new Discord.Collection(),
            'starts': new Discord.Collection(),
            'aliases': new Discord.Collection(),
            'commands': new Discord.Collection(),
            'cooldowns': new Discord.Collection(),
            'voiceChatTimes': new Discord.Collection(),
            'starterMessages': new Discord.Collection(),
            'levelingCooldowns': new Discord.Collection(),
            'interactionCommands': new Discord.Collection(),
        }

        this.config = JSON.parse(FileSystem.readFileSync('./bot/configuration/key.ini').toString())

        this.logs = {
            'raw': false,
            'debug': false,
            'eventNames': false,
            'databaseSaves': false
        }

        this.caches = {
            'databaseUsersAll': null,
        }

        this.stats = {
            'messagesCleared': 0,
            'channelsCleared': 0,
            'membersMuted': 0,
            'membersUnmuted': 0,
            'remindsCompleted': 0,
            'globalLevelUps': 0,
            'serverLevelUps': 0,
            'recentPackets': 0,
            'welcome_message': 0
        }

        this.data = {
            'allUsersCache': null,

            'ready': false,
            'refreshStatus': true,

            'id': 0,
            'shard_count': 0,
            'embedColor': 16738740,
            'startTime': Date.now(),

            'footer': {},
            'chat_log': {},
            'server_cache': {},
            'modlog_posts': {},
            'database_queue': {},
            'raid_prevention': {},
            'entrance_messages': {},

            'snakeGames': [],
            'slashCommands': [],
            'snakeGameChannelIds': [],

            'status': '',
            'modlogEvents': modlogEvents,
            'loggerDisplayName': 'Shard [NOT_SET]',
            'humanReadableEvents': humanReadableEvents,
        }

        this.data.footer = { text: `Relaxy! version ${this.config.keys.version} made by MattFor#9884`, iconURL: this.config.text.links.relaxyImage }

        this.core = new RC_Core(this)
        this.utils = new RC_Utilities(this)

        /**
         * Object containing different Relaxy modules which handle particular tasks
         * @param {RM_RequestManager|null} module.relaxyRequestManager Handles incoming requests to Relaxy's Requests discord server
         * @param {RM_V_MusicPlayer} module.music Handles music related interactions
         * @param {RM_V_VoiceRecorder} module.recorder Handles voice recording interactions
         * 
         * @param {RM_H_C_Database} module.database Handles database interactions
         * @param {RM_H_C_Profiles} module.profiles Handles Relaxy profile interactions
         * @param {RM_H_C_FileInteractions} module.files Handles communication between client managers
         * 
         * @param {RM_H_S_Events} module.processEventManager Handles node process events
         * @param {RM_H_S_ClientManagerComms} module.clusterCommunicator Handles communication between the Cluster manager and its shards
         */
        this.module = {
            'relaxyRequestManager': null,

            'music': new RM_V_MusicPlayer(this, {
                leaveOnEnd: false,
                autoSelfDeaf: true
            }),
            'recorder': new RM_V_VoiceRecorder(this),

            'database': new RM_H_C_Database(this),
            'profiles':  new RM_H_C_Profiles(this),
            'files': new RM_H_C_FileInteractions(this),

            'processEventManager': new RM_H_S_Events(this, process),
            'clusterCommunicator': new RM_H_S_ClientManagerComms(this)
        }

        this.module.files.start()
        process.on('message', message => this.module.clusterCommunicator.process(message))
        this.wait_for_start = setInterval(async () => {
            clearInterval(this.wait_for_start)

            this.log(`${this.logs.debug ? 'Not showing' :  'Showing'} debug information`)
            Mongoose.set('strictQuery', true)
            return Mongoose.connect('mongodb://127.0.0.1:27017/relaxy', { useNewUrlParser: true, useUnifiedTopology: true })
                .then(async () => {
                    this.log('Database connection resolved!')
                    this.cluster = new RC_ClusterClient(this)
                    this.log(await this.login(this.config.TOKEN) === this.config.TOKEN ? 'Login successful' : 'Authentication failed', 'DEBUG')
                }).catch((e) => {
                    console.log(e)
                    this.log('Database connection severed!')
                })
        }, 1)
    }


    deleteSlashCommands = () => {
        if (this.data.id !== 0) return 
        this.clog('They will be back soon (hopefully!)', 'SLASH COMMANDS DELETED', 'bad')
        this.application.commands.set([]).then(() => {
            this.log('Slash commands have been deleted!')
        }).catch(e => console.log(e))
    }


    postSlashCommands = () => {
        if (this.data.id !== 0) return
        this.clog(null, 'SLASH COMMANDS RESTORED', 'good')
        let slash = []
        for (const command of this.data.slashCommands) {
            try {
                command.slash.setName(command.name).setDescription(command.description_slash??command.description)
                if (this.config.text.slashCategories.includes(command.dir)) {
                    this.log(`${command.name} has been activated.`)
                    slash.push(command.slash.toJSON())
                }
            } catch (e) {
                console.log(e)
            }
        }

        return (async () => {
            this.rest.put(
                Discord.Routes.applicationCommands(this.user.id), 
                { body: slash }
            ).then(() => {
                this.log('Slash commands have been successfully initiated!')
            }).catch(err => {
                console.log(err)
            })
        })()
    }

    /**
     * Check if the desired user has the correct permissions.
     * @param {Boolean} isRelaxy Check if the message author is Relaxy.
     * @param {Discord.Message} message A Discord message.
     * @param {Array<String>} permissions Array of discord permissions.
     * @param {Number} type Reference number used in the line 330 of RM_Handler.js
     * @param {Discord.GuildChannel} channel Discord channel
     * @returns 
     */
    checkPermissions(message, permissions_user, permission_bot, type, channel, exempt) {
        let actual_permissions_user = []
        let actual_permissions_bot = []

        let perms_for_user = ''

        if (permissions_user)
            for (let perm of permissions_user) {
                actual_permissions_user.push(toNormalPerm(perm))
            }

        let perms_for_relaxy = ''

        if (permission_bot)
            for (let perm of permission_bot) {
                actual_permissions_bot.push(toNormalPerm(perm))
            }

        let perm_embed = new this.imports.discord.EmbedBuilder()
            .setColor(this.data.embedColor)
            .setTitle('Missing permissions!')
            .setFooter({ text: `Relaxy! version ${this.config.keys.version} made by MattFor#9884`, iconURL: this.config.text.links.relaxyImage})

        switch (type) {
            case 1:
                {
                    if (channel) {
                        let channel_premissions = null

                        try {
                            channel_premissions = channel.permissionsFor(message.guild.me).toArray()
                        } catch {}

                        for (let permission of actual_permissions_bot)
                            if (!channel_premissions.includes(permission) && !perms_for_relaxy.includes(permission))
                                perms_for_relaxy += `\`${permission}\`, `
                        
                        try {
                            channel_premissions = channel.parent.permissionsFor(message.guild.me).toArray()
                        } catch {}

                        for (let permission of actual_permissions_bot) {
                            if (!channel_premissions.includes(permission) && !perms_for_relaxy.includes(permission))
                                perms_for_relaxy += `\`${permission}\`, `

                            if (!message.guild.me.permissions.has([this.imports.discord.PermissionFlagsBits[permission]]))
                                perms_for_relaxy += `\`${permission}\`, `
                        }
                    }

                    break
                }
            default:
                {
                    if (permissions_user)
                        for (const permission of actual_permissions_user)
                            if (!message.member.permissions.has(this.imports.discord.PermissionFlagsBits[permission]))
                                perms_for_user += `\`${permission}\`, `

                    if (permission_bot)
                        for (const permission of actual_permissions_bot) 
                            if (!message.guild.me.permissions.has([this.imports.discord.PermissionFlagsBits[permission]]))
                                perms_for_relaxy += `\`${permission}\`, `

                    break
                }
        }

        let return_perms = {
            user: false,
            bot: false
        }

        if (message.guild.me.permissions.has([this.imports.discord.PermissionFlagsBits['Administrator']])) {
            perms_for_relaxy = null
        }

        if (message.member.permissions.has([this.imports.discord.PermissionFlagsBits['Administrator']])) {
            perms_for_user = null
        }

        if (perms_for_relaxy) {
            return_perms.bot = true
            perm_embed.setThumbnail(this.user.displayAvatarURL({ dynamic: true, size: 4096 }))
            perm_embed.addFields([{ name: 'Missing permissions for Relaxy:', value: `${perms_for_relaxy.slice(0, -2)}.` }])
        }

        if (perms_for_user) {
            return_perms.user = true
            perm_embed.setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 4096 }))
            perm_embed.addFields([{ name: 'You have missing permissions to use this command:', value :`${perms_for_user.slice(0, -2)}.` }])
        }

        if (!exempt && (perms_for_user || perms_for_relaxy))
            this.send(message.channel, null, [perm_embed])

        return return_perms
    }

    /**
     * Handle the creation of a new server
     * @param {Discord.Guild} guild 
     */
    async newGuild(guild) {
        try {
            this.data.server_cache[guild.id] = {}
            this.data.modlog_posts[guild.id] = []
            this.data.database_queue[guild.id] = []
            this.data.raid_prevention[guild.id] = []
            this.data.entrance_messages[guild.id] = []

            setInterval(async () => {
                if (this.data.database_queue[guild.id].length === 0) 
                    return
          
                try {
                    const server = await this.module.database.Guild(guild.id);
                    for (const { to_change, value } of this.data.database_queue[guild.id]) {
                        const splitKey = to_change.split('.')
                        const lastKey = splitKey.pop()
                        let obj = server
            
                        for (const key of splitKey)
                            obj = obj[key]
            
                        obj[lastKey] = value
                        server.markModified(to_change)

                        if (this.logs.databaseSaves)
                            console.log(to_change, lastKey)
                    }
          
                    if (Object.keys(this.data.database_queue[guild.id]).length !== 0) {
                        this.data.database_queue[guild.id] = []
                        return server.save()
                    }
                } catch (e) {
                  console.log(e)
                }
              }, 200)
        } catch (e) {
            console.log(e)
        }
    }

    async save(guild_id, ...args) {
        if (this.data.database_queue[guild_id]) {
            this.data.database_queue[guild_id].push(...args)
            await new Promise(resolve => setTimeout(resolve, 200))
        }
    }


    /**
     * Send a message to a channel.
     * `FORMAT:` message_text, embeds[], files[]
     * @param {Discord.GuildChannel || Discord.User} channel
     * @param {Array<String ||&& Discord.EmbedBuilder ||&& Discord.AttachmentBuilder>} content
     * @returns {Promise<Discord.Message>}
     */
    async send(channel, ...content) {
        if (typeof channel === 'object')
            return channel.send({ content: content[0]??null, embeds: content[1]??[], files: content[2]??[] }, { stickers: content[3]??[] })
        return { content: content[0]??null, embeds: content[1]??[], files: content[2]??[], ephemeral: false }
    }


    /**
     * Send a message to a channel.
     * `FORMAT:` message_text, embeds[], files[]
     * @param {Discord.Message} message
     * @param {Array<String ||&& Discord.EmbedBuilder ||&& Discord.AttachmentBuilder>} content
     * @returns {Promise<Discord.Message>}
     */
    async edit(message, ...content) {
        return message.edit({ content: content[0]??null, embeds: content[1]??[], files: content[2]??[] })
    }


    clearServerCache() {
        setInterval(() => {
            return new Promise(async() => {
                this.guilds.cache.forEach(async guild => {
                    for (let [key, value] of this.data.server_cache[guild.id])
                        setInterval(() => {
                            delete this.data.server_cache[guild.id][key]
                        }, value)
                })
            })
        }, 20000)
    }


    setActivity(text, type) {
        return this.user.setActivity({ name: text, type: this.imports.discord.ActivityType[type], shardId: this.data.id })
    }


    /**
     * Cache and record all users/servers to MongoDB.
     * @returns {Promise}
     */
    async startQueues() {
        this.guilds.cache.forEach(async(guild) => {
            this.data.server_cache[guild.id] = {}
            this.data.modlog_posts[guild.id] = []
            this.data.database_queue[guild.id] = []
            this.data.raid_prevention[guild.id] = []
            this.data.entrance_messages[guild.id] = []

            setInterval(async () => {
                if (this.data.database_queue[guild.id].length === 0) 
                    return
          
                try {
                    const server = await this.module.database.Guild(guild.id);
                    for (const { to_change, value } of this.data.database_queue[guild.id]) {
                        const splitKey = to_change.split('.')
                        const lastKey = splitKey.pop()
                        let obj = server
            
                        for (const key of splitKey)
                            obj = obj[key]
            
                        obj[lastKey] = value
                        server.markModified(to_change)

                        if (this.logs.databaseSaves)
                            console.log(to_change, lastKey)
                    }
          
                    if (Object.keys(this.data.database_queue[guild.id]).length !== 0) {
                        this.data.database_queue[guild.id] = []
                        return server.save()
                    }
                } catch (e) {
                  console.log(e)
                }
              }, 200)

            if (guild?.me?.voice?.channel) 
                return guild.me.voice.disconnect()
        })

        this.log('Server database [DONE]')

        let emoji_list = this.emojis.cache.map(emoji => emoji.id)
        this.cluster.send({ type: 'NOTIF_emojisReceived', data: emoji_list })

        this.log('Emojis cache [DONE]')
    }


    /**
     * Use all of the data sent by the manager.
     * @param {Object} data 
     */
    startUp(data) {
        this.data.loggerDisplayName = `Shard ${data.shardId}`
        this.data.id = data.shardId
        this.data.shard_count = data.shards
        return this.setStatus(data.status)
    }


    /**
     * Set the status of the bot.
     * @param {String} status 
     */
    async setStatus(status) {
        this.log('Status updated.')
        
        status = status === MODE_SILENT ? MODE_NORMAL : status

        if (this.data.id === 0)
            switch (status) {
                case MODE_SPECIAL_NORMAL:
                    this.clog(this.config.text.relaxyLogs.MODE_SPECIAL_NORMAL, 'BACK ONLINE', 'good')
                    break
                case MODE_NORMAL:
                    this.clog(this.config.text.relaxyLogs.MODE_NORMAL, 'NORMAL MODE', 'good')
                    break   
                case MODE_DEBUG:
                    this.clog(this.config.text.relaxyLogs.MODE_DEBUG, 'DEBUG MODE')
                    break
                case MODE_MAINTENANCE:
                    this.clog(this.config.text.relaxyLogs.MODE_MAINTENANCE, 'MAINTENANCE MODE', 'bad')
                    break
                case MODE_OFFLINE:
                    this.clog(this.config.text.relaxyLogs.MODE_OFFLINE, 'SHUTTING DOWN', 'bad')
            }

        this.data.status = status

        switch (status) {
            case MODE_OFFLINE:
                this.guilds.cache.forEach(async guild => {
                    let fcs = await this.module.database.findForumChannels(guild.id)

                    fcs.forEach(async fc => {
                        if (fc.hideWhenUnavailable) {
                            let channel = await guild.channels.fetch(fc.id, { cache: false, limit: 1  })

                            if (!channel)
                                return

                            channel.permissionOverwrites.create(guild.roles.everyone, {
                                'ViewChannel': false
                            })

                            return this.log(`Hid ${channel.name}`)
                        }
                    })
                })
                break
            case MODE_NORMAL:
                this.guilds.cache.forEach(async guild => {
                    let fcs = await this.module.database.findForumChannels(guild.id)

                    fcs.forEach(async fc => {
                        if (fc.hideWhenUnavailable) {
                            let channel = await guild.channels.fetch(fc.id, { cache: false, limit: 1  })

                            if (!channel)
                                return

                            channel.permissionOverwrites.create(guild.roles.everyone, {
                                'ViewChannel': true
                            })

                            return this.log(`Unhid ${channel.name}`)
                        }
                    })
                })
        }
    }



    setVersion(version) {
        this.config.BOTVER = version
        this.config.keys.version = version
    }

    initiateRequestManager() {
        this.log('Request handling initiated!')
        this.module.relaxyRequestManager = new RM_H_C_Requests(this)
    }

    /**
     * Log a message to the console. 
     * @param {String} message 
     */
    log(message, type) {
        if (typeof message === 'object') {
            console.log(`${type??'INFO'} ${this.data.loggerDisplayName}`)
            return console.log(message)
        }

        console.log(`${type??'INFO'} ${this.data.loggerDisplayName} ${message}`)
    }

    async loadCommands() {
        FileSystem.readdirSync('./bot/commands').forEach(async dirs => {
            for (const file of FileSystem.readdirSync(`./bot/commands/${dirs}`)) {
                const command = await import (`../bot/commands/${dirs}/${file}`)

                if (command.default.aliases)
                    command.default.aliases.forEach(async alias => {
                        return this.collections.aliases.set(alias, command.default)
                    })

                command.default.dir = dirs
                if (command.default.slash) {
                    this.collections.interactionCommands.set(command.default.name, command.default)
                    if (this.data.id === 0)
                        this.data.slashCommands.push(command.default)
                }

                this.collections.commands.set(command.default.name.toLowerCase(), command.default)
            }
        })

        const discordEvents = FileSystem.readdirSync('./bot/events/discord')
        for (const file of discordEvents) {
            const event = await import (`../bot/events/discord/${file}`)
            const eventName = file.split('.')[0]

            if (['ready'].includes(eventName)) {
                this.once(eventName, (...args) => event.default.run(this, ...args))
                continue
            }

            this.on(eventName, (...args) => {
                if (eventName !== 'raw' && this.logs.eventNames)
                    console.log(eventName)
                event.default.run(this, ...args)
            })
        }

        const playerEvents = FileSystem.readdirSync('./bot/events/music')
        for (const file of playerEvents) {
            const music_player_event = await import (`../bot/events/music/${file}`)
            this.module.music.on(file.split('.')[0], music_player_event.default.bind(null, this))
        }
    }

    /**
     * Fetch a discord user.
     * @param {Number|String} userId
     * @returns {Promise<Discord.User>|null}
     */
    async getUser(userID) {
        const cached = this.users.cache.get(userID)
        if (cached)
            return cached
        const user = await this.users.fetch(userID, { cache: true, limit: 1  })
        return user??null
    }

    /**
     * Fetch a server member.
     * @param {Discord.Guild} guild
     * @param {Number|String} userId
     * @returns {Promise<Discord.GuildMember>|null}
    */
    async getMember(guild, userID) {
        if (!userID || !guild) 
            return null

        const cached = guild.members.cache.get(userID)
        if (cached)
            return cached

        let member = await guild.members.fetch({ user: userID, cache: true, limit: 1  })
        try {
            if (member)
                member = member.first()
        } catch {
            return null
        }

        return member??null
    }

    /**
     * Fetch a message from a channel.
     * @param {Discord.TextChannel|Discord.ThreadChannel} channel
     * @param {Number|String} messageID
     * @param {Boolean} starter
     * @returns {Promise<Discord.User>|null}
    */
    async getMessage(channel, messageID, starter) {
        if ((!messageID && !starter) || !channel) 
            return null
        let cached = channel.messages.cache.get(messageID) || this.collections.starterMessages.get(channel.id)

        if (cached)
            return cached

        let message

        if (starter) {
            message = await channel.fetchStarterMessage()
            this.collections.starterMessages.set(channel.id, messageID)
        } else {
            message = await channel.messages.fetch(messageID, { cache: false, limit: 1  })
            if (message)
                message = message.first()
        }

        return message??null
    }

    async getForum(channelID, guildID) {
        let cached = this.collections.forums.find(f => f.id === channelID)

        if (cached)
            return cached

        let forum = await this.module.database.findForumChannel(channelID, guildID)
        this.collections.forums.set(channelID, forum)

        return forum??null
    }

    /**
     * Send a message to #relaxy-log
     * @param {String} message 
     * @param {String} type 
     * @returns {Promise<Discord.Message>}
     */
    async clog(message, title, type, overwrite) {
        return this.send(this.channels.cache.get('1052357652048515132'), null, [overwrite??{
            color: type === 'bad' ? 16711680 : type === 'good' ? 65280 : 16738740,
            title: title,
            description: message,
            footer: {
                text: 'Event emitted', iconURL: this.config.text.links.relaxyImage
            }, 
            timestamp: new Date()
        }]).catch(() => {})
    }
}