'use strict'

import Mongoose from 'mongoose'

export default Mongoose.model('ForumChannel', new Mongoose.Schema({
    id: { type: String, default: '' },
    guild: { type: String, default: '' },
    emoji: { type: String, default: '' },
    roles: { type: Array, default: [] },
    checks: { type: Object, default: {
        matches: [],
        variable_case: true,
        titleLength: 0,
        bodyLength: 0,
        attachmentCount: 0,
        rawMatch: false,
        cutOff: false,
        deleteWhenOriginalMessageGone: false,
        invalidateLengthCheckWhenAttachmentPresent: false,
        censorPoolCheck: false
    }},
    approved_tag: { type: String, default: '' },
    pending_tag: { type: String, default: '' },
    responses: { type: Object, default: {
        accept: '',
        reject: '',
        titleLength: 'Sorry |U|, **|T|** has been rejected for being {overCase/underCase} the length requirement.',
        bodyLength: 'Sorry |U|, **|T|** has been rejected for being {overCase/underCase} the length requirement.',
        attachmentCount: 'Sorry |U|, **|T|** has been rejected for having too {overCase/underCase} attachments.',
        censorPoolCheck: '|U|, **|T|** has been rejected for containing words that are censored by Relaxy!'
    }},
    hideWhenUnavailable: { type: Boolean, default: false },
    sensitive: { type: Object, default: {
        enabled: false,
        channel: ''
    }},
    promptModerator: { type: Boolean, default: true },
    automaticDeletionTimeout: { type: Number, default: 0 },
}))