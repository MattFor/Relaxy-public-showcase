'use strict'

import Mongoose from 'mongoose'

import Server from '../../Blueprints/Database/Server.js'
import Member from '../..//Blueprints/Database/Member.js'
import Profile from '../../Blueprints/Database/Profile.js'
import ForumChannel from '../../Blueprints/Database/ForumChannel.js'
import HeartBoardPost from '../../Blueprints/Database/HeartBoardPost.js'


export default class DBHandler {

    constructor(client) {
        this.client = client
    }

    /**
     * Get a user Schema from the database.
     * @param {Number} userID 
     * @returns {Promise<Mongoose.Document>}
     */
    async User(userID) {
        let userDB = await Profile.findOne({ id: userID })
        
        if (userDB) return userDB

        userDB = new Profile({ id: userID })

        await userDB.save()

        return userDB
    }

    async getGuilds(item) {
        return item ? await Server.find(item) : await Server.find({}) || null
    }

    async getUsers(item) {
        return item ? await Profile.find(item) : await Profile.find({}) || null
    }

    /**
     * Get a server Schema from the database.
     * @param {Number} guildID 
     * @returns {Promise<Mongoose.Document>}
     */
    async Guild(guildID) {
        let guildDB = await Server.findOne({ id: guildID })

        if (guildDB) return guildDB

        guildDB = new Server({ 
            id: guildID,
            prefixes: ['='],
            disabedcommands: [],
            announcements: false,
            plugins: {
                welcome_message: {
                    enabled: false,
                    wmessage: '',
                    wmessage_id: '',
                    wmessage_channel: '',
                    status_message_id: '',
                    roles: false,
                    role_emojis: [],
                    role_roles: []
                },
                person_exceptions: [],
                allowed_people: [],
                clearing_channels: [],
                restricted_channels: [],
                heart_board: {
                    enabled: false,
                    channel_id: '',
                    type: 3,
                    postIDs: []
                },
                leveling: {
                    enabled: false,
                    type: 0,
                    channel: ''
                },
                censoring: {
                    enabled: false,
                    autobanning: 0,
                    censorPool: [],
                    renaming: true,
                    channel: ''
                },
                dm_welcome_leave: {
                    enabled: false,
                    welcome: '',
                    leave: ''
                },
                modlog: {
                    enabled: false,
                    events: {
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
                },
                autoroles: []
            },
            restrictors1: {},
            restrictors2: {},
            restrictors3: {},
            restrictors4: {},
            reaction_role_messages: [],
            achievements: {
                channel: ''
            },
            welcome_channel: {
                type: 0,
                enabled: false,
                messageWELCOME: 'Hi |U|, welcome to |G|!',
                messageLEAVE: 'Bye bye |U|, hope you\'ve had a great time here!',
                topWELCOME: 'Welcome!',
                topLEAVE: 'Goodbye!',
                bottomWELCOME: 'Glad to see you here!',
                bottomLEAVE: 'Farewell friend!',
                channelWELCOME: '',
                channelLEAVE: ''
            },
            mute_id: '',
            privates: [],
            mutes: [],
            redirects: [],
            music_options: {
                leaveOnEnd: true,
                leaveOnStop: true,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 0,
                autoSelfDeaf: true,
                useSafeSearch: true,
                ytdlDownloadOptions: {},
                bufferingTimeout: 500
            },
            forum: {
                enabled: false,
                channel: ''
            },
            caseCount: 0,
            recording: false,
            lockeddown: false,
            warnings: [],
            messages: 0,
            commands: 0
        })

        await guildDB.save()

        return guildDB
    }


    /**
     * Get a Member Schema from the database.
     * @param {Number} userID 
     * @param {Number} guildID
     * @returns {Promise<Mongoose.Document>}
     */
    async Member(userID, guildID) {
        let memberDB = await Member.findOne({ id: userID, guildID: guildID })

        if (memberDB) return memberDB

        memberDB = new Member({ id: userID, guildID: guildID })

        await memberDB.save()

        return memberDB
    }


    /**
     * Get a heartboard Schema from the database.
     * @param {Boolean} embed 
     * @param {Number} originalID 
     * @param {Number} embedID 
     * @param {Number} userID 
     * @param {Number} channelID 
     * @param {Number} guildID 
     * @param {Number} likes 
     * @param {Array<Number>} original_reacts 
     * @param {Array<Number>} embed_reacts 
     * @returns {Promise<Mongoose.Document>}
     */
    async HeartBoard(embed, originalID, embedID, userID, channelID, guildID, likes, original_reacts, embed_reacts) {
        let hbp = await HeartBoardPost.findOne({ original_id: originalID })

        if (hbp) return hbp

        let userDB = !embed ? new HeartBoardPost({
                user_id: userID,
                embed_id: embedID,
                original_id: originalID,
                channelID: channelID,
                guildID: guildID,
                likes: likes,
                original_reacts: original_reacts,
                embed_reacts: embed_reacts,
                excludes: likes
            }) :
            new HeartBoardPost({
                user_id: userID,
                embed_id: embedID,
                channelID: channelID,
                guildID: guildID,
                likes: likes,
                original_reacts: original_reacts,
                embed_reacts: embed_reacts,
                excludes: likes
            })

        await userDB.save()

        return userDB
    }


    /**
     * Get ALL members from a specified guild.
     * @param {Number} guildID 
     * @returns {Promise<Mongoose.Document>}
     */
    async findGuildMembers(guildID) {
        return Member.find({ guildID: guildID })
    }


    /**
     * Get ALL heartboard posts/messages from a guild.
     * @param {Number} guildID 
     * @returns {Promise<Mongoose.Document>}
     */
    async findHeartboards(guildID) {
        return HeartBoardPost.find({ guildID: guildID })
    }


    /**
     * Find a heartboard post on the database
     * @param {Number} original_message_id
     * @returns {Mongoose.Document | Null}
     */
    async findHeardBoard(original_message_id) {
        return await HeartBoardPost.find({ original_id: original_message_id }) || null
    }


    /**
     * Delete a HeartBoardPost from the database.
     * @param {Number} message_id
     * @returns {Promise}
     */
    async deleteHeartBoardPost(message_id) {
        return HeartBoardPost.deleteOne({ original_id: message_id })
    }

    /**
     * Get ALL users from the database.
     * @returns {Promise<Mongoose.Document>}
     */
    async findAllUsers() {
        if (this.client.caches.databaseUsersAll)
            return this.client.caches.databaseUsersAll
        let users = await Profile.find({})
        this.client.caches.databaseUsersAll = users
        return this.client.caches.databaseUsersAll
    }

    async deleteForumChannel(channel, guild) {
        return await ForumChannel.deleteOne({ id: channel, guild: guild })
    }

    async findForumChannel(channel, guild) {
        return await ForumChannel.findOne({ id: channel, guild: guild }) || null
    }

    async findForumChannels(guild) {
        return await ForumChannel.find({ guild: guild }) || null
    }

    async ForumChannel(channel, guild, emoji, roles, pending, approved) {
        let fc = await ForumChannel.findOne({ id: channel, guild: guild })

        if (fc) return fc

        let forum = new ForumChannel({
            id: channel,
            guild: guild,
            emoji: emoji,
            roles: roles,
            checks: {
                len: 0,
                matches: [],
                variable_case: true,
            },
            approved_tag: approved,
            pending_tag: pending,
            responses: {
                accept: '',
                reject: '',
                len: 'Sorry |U|, **|T|** has been rejected for being over the length requirement.'
            },
            hideWhenUnavailable: false,
            sensitive: {
                enabled: false,
                channel: ''
            }
        }) 

        await forum.save()

        return forum
    }
}