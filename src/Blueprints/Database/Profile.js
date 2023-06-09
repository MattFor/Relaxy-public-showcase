'use strict'

import Mongoose from 'mongoose'

export default Mongoose.model('Profile', new Mongoose.Schema({
    id: { type: String },
    money: { type: Number, default: 0 },
    registeredAt: { type: Number, default: Date.now() },
    lastAchievement: { type: String },
    achievements: {
        type: Object,
        default: {
            playedtrack: {
                achieved: false,
            },
            playedplaylist: {
                achieved: false,
            },
            setwelcome: {
                achieved: false,
            },
            saved: {
                achieved: false,
            },
            fetched: {
                achieved: false,
            },
            madepoll: {
                achieved: false,
            },
            got_heart: {
                achieved: false,
            },
            madeheartboard: {
                achieved: false,
            },
            lockeddown: {
                achieved: false,
            },
            image: {
                achieved: false,
            },
            lvldup: {
                achieved: false,
            },
        }
    },
    inventory: { type: Array, default: [] },
    exp: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    commands: { type: Number, default: 0 },
    reputation: { type: Array, default: [] },
    level: { type: Number, default: 0 },
    tradeout: { type: Boolean, default: false },
    levelout: { type: Boolean, default: false },
    dmout: { type: Boolean, default: true },
    reminds: { type: Array, default: [] },
}))