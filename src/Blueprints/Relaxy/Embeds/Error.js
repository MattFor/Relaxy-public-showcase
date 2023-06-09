'use strict'

export default class ErrorEmbed {
    /**
     * Throw an error embed to a specified voice channel
     * @param {String} error_text 
     */
    constructor(error_text, message) {
        switch (error_text) {
            case 'NotPlaying':
                return this.build('Nothing is playing!', message)
            case 'NotConnected':
                return this.build('You aren\'t connected to any channel!', message)
            case 'UnableToJoin':
                return this.build('No permissions to join!', message)
            case 'NoFilterName':
                return this.build('Invalid filter name!', message)
            case 'NoFilter':
                return this.build('No filter given!', message)
            case 'InvalidNumber':
                return this.build('Enter a valid number (between 1 and 1000)!', message)
            case 'FileTooLarge':
                return this.build('The file is too large, cannot send!', message)
            case 'NotSameVoiceChannel':
                return this.build('You are not in the same voice channel!', message)
            case 'TooManyFilters':
                return this.build('Cannot add more filters!', message)
            case 'ActiveQueue':
                return this.build('Cannot record while something is playing/already recording!', message)
            case 'Recording':
                return this.build('Cannot play while recording!', message)
            case 'RecordingA':
                return this.build('Cannot use while recording!', message)
            case 'MusicStarting':
                return this.build('Music is still starting!, please do not interrupt!', message)
            default:
                return this.build(error_text, message)
        }
    }


    build(error_text, message) {
        const description_flag = error_text.split(' ')[0] === 'description'

        switch(typeof message) {
            case 'object':
                if (typeof message.deletable == 'boolean')
                    return message.channel.send({ embeds: [{
                        color: 16738740,
                        author: description_flag ? null : { name: error_text },
                        description: description_flag ? error_text.replace('description ', '') : null
                    }]})

                return { embeds: [{
                    color: 16738740,
                    author: description_flag ? null : { name: error_text },
                    description: description_flag ? error_text.replace('description ', '') : null
                }]}

            case 'number':
                return {
                    color: 16738740,
                    author: description_flag ? null : { name: error_text },
                    description: description_flag ? error_text.replace('description ', '') : null
                }
        }
    }
}