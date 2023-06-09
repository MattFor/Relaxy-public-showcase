'use strict'

import https from 'https'
import { Readable } from 'stream'

export default class Discord {
    constructor() {
        throw new Error(`The ${this.constructor.name} class may not be instantiated!`)
    }

    /**
     * @typedef {Readable} Readable
     */

    /**
     * Downloads discord attachment
     * @param {String} url Discord attachment url
     * @returns {Promise<Readable>}
     */
    static async download(url) {
        const data = await Discord.getInfo(url)
        return data.stream
    }

    /**
     * Returns discord attachment info
     * @param {String} url Attachment url
     */
    static getInfo(url) {
        return new Promise((resolve) => {
            https.get(url, res => {
                const data = {
                    title: res.req.path.split('/').pop(),
                    format: res.headers['content-type'],
                    size: !isNaN(res.headers['content-length']) ? Math.round((parseInt(res.headers['content-length']) / (1024 * 1024)) * 100) / 100 : 0,
                    sizeFormat: 'MB'
                }

                Object.defineProperty(data, 'stream', {
                    get: () => res
                })
                resolve(data)
            })
        })
    }
}