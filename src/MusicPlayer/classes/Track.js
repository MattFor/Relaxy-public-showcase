'use strict';

import { SnowflakeUtil } from 'discord.js';


function escapeMarkdown(text) {
    var unescaped = text.replace(/\\(\*|_|`|~|\\)/g, '$1'); // unescape any 'backslashed' character
    var escaped = unescaped.replace(/(\*|_|`|~|\\)/g, '\\$1'); // escape *, _, `, ~, \
    return escaped;
  }


class Track {
    /**
     * Track constructor
     * @param {Player} player The player that instantiated this Track
     * @param {RawTrackData} data Track data
     */
    constructor(player, data) {
        this.raw = {};
        this.id = SnowflakeUtil.generate();
        /**
         * The player that instantiated this Track
         * @name Track#player
         * @type {Player}
         * @readonly
         */
        Object.defineProperty(this, 'player', { value: player, enumerable: false });
        /**
         * Title of this track
         * @name Track#title
         * @type {string}
         */
        /**
         * Description of this track
         * @name Track#description
         * @type {string}
         */
        /**
         * Author of this track
         * @name Track#author
         * @type {string}
         */
        /**
         * URL of this track
         * @name Track#url
         * @type {string}
         */
        /**
         * Thumbnail of this track
         * @name Track#thumbnail
         * @type {string}
         */
        /**
         * Duration of this track
         * @name Track#duration
         * @type {string}
         */
        /**
         * Views count of this track
         * @name Track#views
         * @type {number}
         */
        /**
         * Person who requested this track
         * @name Track#requestedBy
         * @type {User}
         */
        /**
         * If this track belongs to playlist
         * @name Track#fromPlaylist
         * @type {boolean}
         */
        /**
         * Raw track data
         * @name Track#raw
         * @type {RawTrackData}
         */
        /**
         * The track id
         * @name Track#id
         * @type {Snowflake}
         * @readonly
         */
        void this._patch(data);
    }
    _patch(data) {
        this.title = escapeMarkdown(data?.title ?? '')
        this.author = data?.author ?? ''
        this.url = data?.url ?? ''
        this.thumbnail = data?.thumbnail ?? ''
        this.duration = data?.duration ?? ''
        this.views = data?.views ?? 0
        this.requestedBy = data.requestedBy
        this.playlist = data.playlist
        
        Object.defineProperty(this, 'raw', {
            value: Object.assign({}, {
            source: data?.raw?.source ?? data?.source
            }, data?.raw ?? data),
            enumerable: false
        })
    }

    /**
     * The queue in which this track is located
     * @type {Queue}
     */
    get queue() {
        return this.player.queues.find((q) => q.tracks.includes(this));
    }

    /**
     * The track duration in millisecond
     * @type {number}
     */
    get durationMS() {
        const times = (n, t) => {
            let tn = 1;
            for (let i = 0; i < t; i++)
                tn *= n;
            return t <= 0 ? 1000 : tn * 1000
        }
        
        return this.duration
            .split(':')
            .reverse()
            .map((m, i) => parseInt(m) * times(60, i))
            .reduce((a, c) => a + c, 0)
    }

    get source() {
        return this.raw.source || 'arbitrary'
    }

    /**
     * String representation of this track
     * @returns {string}
     */
    toString() {
        return `${this.title} by ${this.author}`;
    }

    /**
     * Raw JSON representation of this track
     * @returns {TrackJSON}
     */
    toJSON(hidePlaylist) {
        const {
            id,
            title,
            description,
            author,
            url,
            thumbnail,
            duration,
            durationMS,
            views,
            requestedBy,
            playlist
          } = this
        
        return {
            id,
            title,
            description,
            author,
            url,
            thumbnail,
            duration,
            durationMS,
            views,
            requestedBy: requestedBy.id,
            playlist: hidePlaylist ? null : playlist?.toJSON() ?? null
        }
    }
}

export default Track
export { Track }