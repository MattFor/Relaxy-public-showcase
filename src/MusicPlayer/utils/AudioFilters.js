'use strict'

const bass = (g) => `bass=g=${g}:f=110:w=0.3`;
/**
 * The available audio filters
 * @typedef {object} AudioFilters
 * @property {string} bassboost_low The bassboost filter (+15dB)
 * @property {string} bassboost The bassboost filter (+20dB)
 * @property {string} bassboost_high The bassboost filter (+30dB)
 * @property {string} 8D The 8D filter
 * @property {string} vaporwave The vaporwave filter
 * @property {string} nightcore The nightcore filter
 * @property {string} phaser The phaser filter
 * @property {string} tremolo The tremolo filter
 * @property {string} vibrato The vibrato filter
 * @property {string} reverse The reverse filter
 * @property {string} treble The treble filter
 * @property {string} normalizer The normalizer filter (dynamic audio normalizer based)
 * @property {string} normalizer2 The normalizer filter (audio compressor based)
 * @property {string} surrounding The surrounding filter
 * @property {string} pulsator The pulsator filter
 * @property {string} subboost The subboost filter
 * @property {string} kakaoke The kakaoke filter
 * @property {string} flanger The flanger filter
 * @property {string} gate The gate filter
 * @property {string} haas The haas filter
 * @property {string} mcompand The mcompand filter
 * @property {string} mono The mono filter
 * @property {string} mstlr The mstlr filter
 * @property {string} mstrr The mstrr filter
 * @property {string} compressor The compressor filter
 * @property {string} expander The expander filter
 * @property {string} softlimiter The softlimiter filter
 * @property {string} chorus The chorus filter
 * @property {string} chorus2d The chorus2d filter
 * @property {string} chorus3d The chorus3d filter
 * @property {string} fadein The fadein filter
 * @property {string} dim The dim filter
 * @property {string} earrape The earrape filter
 */
const FilterList = {
    bassboost_low: bass(15),
    bassboost: bass(20),
    bassboost_high: bass(30),
    '8D': 'apulsator=hz=0.09',
    vaporwave: 'aresample=48000,asetrate=48000*0.8',
    nightcore: 'aresample=48000,asetrate=48000*1.25',
    phaser: 'aphaser=in_gain=0.4',
    tremolo: 'tremolo',
    vibrato: 'vibrato=f=6.5',
    reverse: 'areverse',
    treble: 'treble=g=5',
    normalizer: 'dynaudnorm=g=101',
    normalizer2: 'acompressor',
    surrounding: 'surround',
    pulsator: 'apulsator=hz=1',
    subboost: 'asubboost',
    karaoke: 'stereotools=mlev=0.03',
    flanger: 'flanger',
    gate: 'agate',
    haas: 'haas',
    mcompand: 'mcompand',
    mono: 'pan=mono|c0=.5*c0+.5*c1',
    mstlr: 'stereotools=mode=ms>lr',
    mstrr: 'stereotools=mode=ms>rr',
    compressor: 'compand=points=-80/-105|-62/-80|-15.4/-15.4|0/-12|20/-7.6',
    expander: 'compand=attacks=0:points=-80/-169|-54/-80|-49.5/-64.6|-41.1/-41.1|-25.8/-15|-10.8/-4.5|0/0|20/8.3',
    softlimiter: 'compand=attacks=0:points=-80/-80|-12.4/-12.4|-6/-8|0/-6.8|20/-2.8',
    chorus: 'chorus=0.7:0.9:55:0.4:0.25:2',
    chorus2d: 'chorus=0.6:0.9:50|60:0.4|0.32:0.25|0.4:2|1.3',
    chorus3d: 'chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3',
    fadein: 'afade=t=in:ss=0:d=10',
    dim: `afftfilt=''real=re * (1-clip((b/nb)*b,0,1))':imag='im * (1-clip((b/nb)*b,0,1))''`,
    earrape: 'channelsplit,sidechaingate=level_in=64',
    *[Symbol.iterator]() {
        for (const [k, v] of Object.entries(this)) {
            if (typeof this[k] === 'string')
                yield { name: k, value: v };
        }
    },
    get names() {
        return Object.keys(this).filter((p) => !['names', 'length'].includes(p) && typeof this[p] !== 'function');
    },
    get length() {
        return Object.keys(this).filter((p) => !['names', 'length'].includes(p) && typeof this[p] !== 'function').length;
    },
    toString() {
        return this.names.map((m) => this[m]).join(',');
    },
    create(filter) {
        if (!filter || !Array.isArray(filter))
            return this.toString();
        return filter
            .filter((predicate) => typeof predicate === 'string')
            .map((m) => this[m])
            .join(',');
    },
    define(filterName, value) {
        if (typeof this[filterName] && typeof this[filterName] === 'function')
            return;
        this[filterName] = value;
    },
    defineBulk(filterArray) {
        filterArray.forEach((arr) => this.define(arr.name, arr.value));
    }
};
export default FilterList;
export { FilterList as AudioFilters };