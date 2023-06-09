'use strict'

import Mongoose from 'mongoose'

export default Mongoose.model('HeartBoardPost', new Mongoose.Schema({
    ref_id: { type: String, default: '' },
    embed_id: { type: String, default: '' },
    original_id: { type: String, default: '' },
    channelID: { type: String, default: '' },
    guildID: { type: String, default: '' },
    likes: { type: Number, default: 0 },
    original_reacts: { type: Array, default: [] },
    embed_reacts: { type: Array, default: [] },
    excludes: { type: Array, default: [] }
}))