'use strict'

import Mongoose from 'mongoose'

export default Mongoose.model('Server', new Mongoose.Schema({
    id: { type: String },
    prefixes: { type: Array, default: ['='] },
    disabedcommands: { type: Array, default: [] },
    announcements: { type: Boolean, default: false },
    plugins: {
        type: Object,
        default: {
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
                    }
                }
            },
            autoroles: [],
            raid: {
                enabled: false,
                on: false,
                ban: false,
                threshhold: 25,
                timeperiod: 300_000,
                account_existance: 2_678_400_000 // MONTH
            },
            warningtiers: {
                '1': {},
                '2': {},
                '3': {},
                '4': {},
                '5': {},
                '6': {},
                '7': {},
                '8': {},
                '9': {},
                '10': {},
                '11': {},
                '12': {},
                '13': {},
                '14': {},
                '15': {},
                '16': {},
                '17': {},
                '18': {},
                '19': {},
                '20': {},
                '21': {},
                '22': {},
                '23': {},
                '24': {},
                '25': {},
                '26': {},
                '27': {},
                '28': {},
                '29': {},
                '30': {}
            }
        }
    },
    restrictors1: { type: Object, default: {} },
    restrictors2: { type: Object, default: {} },
    restrictors3: { type: Object, default: {} },
    restrictors4: { type: Object, default: {} },
    reaction_role_messages: { type: Array, default: [] },
    achievements: {
        channel: ''
    },
    welcome_channel: {
        type: Object,
        default: {
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
    },
    mute_id: { type: String, default: '' },
    privates: { type: Array, default: [] },
    mutes: { type: Array, default: [] },
    redirects: { type: Array, default: [] },
    music_options: {
        type: Object,
        default: {
            leaveOnEnd: false,
            leaveOnStop: true,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 0,
            autoSelfDeaf: true,
            useSafeSearch: false,
            ytdlDownloadOptions: {},
            bufferingTimeout: 500
        }
    },
    forum: {
        type: Object,
        default: {
            enabled: false,
            channels: []
        }
    },
    caseCount: { type: Number, default: 0 },
    recording: { type: Boolean, default: false },
    lockeddown: { type: Boolean, default: false },
    warnings: { type: Object, default: {} },
    messages: { type: Number, default: 0 },
    commands: { type: Number, default: 0 }
}))