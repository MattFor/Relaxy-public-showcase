'use strict'

import Relaxy from '../../../src/Relaxy.js'


/**
 * @param {Relaxy} c
 * @param {Queue} q
 * @param {Object} e
 * @param {String} em
 */
export default (c, q, e, em) => {
    console.log(e)

    try {
        if (em.includes('abort'))
            return new c.class.error('Bad connection error! Sorry!', q.message)
    } catch {}

    try {
        if (e.message.includes('410'))
            return new c.class.error('Cannot play age restricted videos (yet), sorry!', q.message)
    } catch {}

    try {    
        return c.build.error(em, q.message)
    } catch {}
}