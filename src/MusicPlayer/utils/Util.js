'use strict'

import Discord from 'discord.js'


class Util {
    constructor() {}

    /**
     * Creates duration string
     * @param {object} durObj The duration object
     * @returns {string}
     */
    static durationString(durObj) {
        return Object.values(durObj)
            .map((m) => (isNaN(m) ? 0 : m))
            .join(':');
    }

    /**
     * Parses milliseconds to consumable time object
     * @param {number} milliseconds The time in ms
     * @returns {TimeData}
     */
    static parseMS(milliseconds) {
        const round = milliseconds > 0 ? Math.floor : Math.ceil;
        return {
            days: round(milliseconds / 86400000),
            hours: round(milliseconds / 3600000) % 24,
            minutes: round(milliseconds / 60000) % 60,
            seconds: round(milliseconds / 1000) % 60
        };
    }

    /**
     * Builds time code
     * @param {TimeData} duration The duration object
     * @returns {string}
     */
    static buildTimeCode(duration) {
        const items = Object.keys(duration);
        const required = ['days', 'hours', 'minutes', 'seconds'];
        const parsed = items.filter((x) => required.includes(x)).map((m) => duration[m]);
        const final = parsed
            .slice(parsed.findIndex((x) => x !== 0))
            .map((x) => x.toString().padStart(2, '0'))
            .join(':');
        return final.length <= 3 ? `0:${final.padStart(2, '0') || 0}` : final;
    }

    /**
     * Picks last item of the given array
     * @param {any[]} arr The array
     * @returns {any}
     */
    static last(arr) {
        if (!Array.isArray(arr))
            return;
        return arr[arr.length - 1];
    }

    /**
     * Checks if the voice channel is empty
     * @param {Discord.VoiceChannel} channel The voice channel
     * @returns {boolean}
     */
    static isVoiceEmpty(channel) {
    
        // Filter out the bot and check if anyone else is in the channel
        let humanCount = channel.guild.voiceStates.cache.filter(state => 
            !state.member.user.bot && state.channelID === channel.id
        ).size
        
        console.log(
            humanCount === 0,
            channel.members.filter(m => !m.user.bot).size === 0,
            channel.members.size === 1,
            humanCount === 0 && channel.members.filter(m => !m.user.bot).size === 0 && channel.members.size === 1
        )

        // Return true if no humans are in the channel
        return humanCount === 0 && channel.members.filter(m => !m.user.bot).size === 0 && channel.members.size === 1
    }

    /**
     * Safer require
     * @param {string} id Node require id
     * @returns {any}
     */
    static require(id) {
        try {
            return require(id);
        }
        catch (_a) {
            return null;
        }
    }

    /**
     * Asynchronous timeout
     * @param {number} time The time in ms to wait
     * @returns {Promise<unknown>}
     */
    static wait(time) {
        return new Promise((r) => setTimeout(r, time).unref());
    }

    static noop() {}
}

export { 
    Util 
}