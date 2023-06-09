'use strict'

import Mongoose from 'mongoose'

export default Mongoose.model('Member', new Mongoose.Schema({
    id: { type: String, default: '' },
    guildID: { type: String, default: '' },
    recurrences: { type: String, default: '' },
    money: { type: Number, default: 0 },
    inventory: { type: Array, default: [] },
    exp: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    commands: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    dmout: { type: Boolean, default: false },
    last_message_channel_id: { type: String, default: '' }
}))