export default class Minesweeper {

    /**
     * The constructor of the Minesweeper class.
     * @constructor
     * @param {MinesweeperOpts} opts - The options of the Minesweeper class.
     */
    constructor(opts) {
        if (opts === void 0) { opts = undefined }
        this.safeCells = []
        this.rows = (opts && opts.rows) || 9
        this.columns = (opts && opts.columns) || 9
        this.mines = (opts && opts.mines) || 10
        this.emote = (opts && opts.emote) || 'boom'
        this.revealFirstCell = opts && opts.revealFirstCell !== undefined ? opts.revealFirstCell : false
        this.zeroFirstCell = opts && opts.zeroFirstCell !== undefined ? opts.zeroFirstCell : true
        this.spaces = opts && opts.spaces !== undefined ? opts.spaces : true
        this.returnType = (opts && opts.returnType) || 'emoji'
        this.matrix = []
        this.types = {
            mine: this.spoilerize(this.emote),
            numbers: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'].map((n) => { return this.spoilerize(n) })
        }
    }

    /**
     * Turns a text into a Discord spoiler.
     * @param {string} str - The string to spoilerize.
     * @returns {string}
     */
    spoilerize(str) {
        return this.spaces ?
            "|| :" + str + ": ||" :
            "||:" + str + ":||"
    }

    /**
     * Fills the matrix with "zero" emojis.
     */
    generateEmptyMatrix() {
        for (let i = 0; i < this.rows; i++) {
            let arr = new Array(this.columns).fill(this.types.numbers[0])
            this.matrix.push(arr)
        }
    }

    /**
     * Plants mines in the matrix randomly.
     */
    plantMines() {
        for (let i = 0; i < this.mines; i++) {
            let x = Math.floor(Math.random() * this.rows)
            let y = Math.floor(Math.random() * this.columns)
            if (this.matrix[x][y] === this.types.mine)
                i--
                else
                    this.matrix[x][y] = this.types.mine
        }
    }

    /**
     * Gets the number of mines in a particular (x, y) coordinate
     * of the matrix.
     * @param {number} x - The x coordinate (row).
     * @param {number} y - The y coordinate (column).
     * @returns {string}
     */
    getNumberOfMines(x, y) {
        if (this.matrix[x][y] === this.types.mine)
            return this.types.mine
        this.safeCells.push({ x: x, y: y })
        let counter = 0
        let hasLeft = y > 0
        let hasRight = y < (this.columns - 1)
        let hasTop = x > 0
        let hasBottom = x < (this.rows - 1)
            // top left
        counter += +(hasTop && hasLeft && this.matrix[x - 1][y - 1] === this.types.mine)
            // top
        counter += +(hasTop && this.matrix[x - 1][y] === this.types.mine)
            // top right
        counter += +(hasTop && hasRight && this.matrix[x - 1][y + 1] === this.types.mine)
            // left
        counter += +(hasLeft && this.matrix[x][y - 1] === this.types.mine)
            // right
        counter += +(hasRight && this.matrix[x][y + 1] === this.types.mine)
            // bottom left
        counter += +(hasBottom && hasLeft && this.matrix[x + 1][y - 1] === this.types.mine)
            // bottom
        counter += +(hasBottom && this.matrix[x + 1][y] === this.types.mine)
            // bottom right
        counter += +(hasBottom && hasRight && this.matrix[x + 1][y + 1] === this.types.mine)
        return this.types.numbers[counter]
    }

    /**
     * Returns the Discord message equivalent of the mine field.
     * @returns {string}
     */
    getTextRepresentation() {
        return this.matrix.map((r) => { return r.join(this.spaces ? ' ' : '') }).join('\n')
    }

    /**
     * Populates the matrix.
     */
    populate() {
        this.matrix = this.matrix.map((row, x) => {
            return row.map((col, y) => { return this.getNumberOfMines(x, y) })
        })
    }

    /**
     * Reveal a random cell.
     * @returns {SafeCell}
     */
    revealFirst() {
        if (!this.revealFirstCell)
            return { x: -1, y: -1 }
        let zeroCells = this.safeCells.filter((c) => { return this.matrix[c.x][c.y] === this.types.numbers[0] })
        if (this.zeroFirstCell && zeroCells.length > 0) {
            let safeCell = zeroCells[Math.floor(Math.random() * zeroCells.length)]
            let x = safeCell.x
            let y = safeCell.y
            let cell = this.matrix[x][y]
            this.matrix[x][y] = cell.slice(2, -2)
            this.revealSurroundings(safeCell)
            return { x: x, y: y }
        } else {
            let safeCell = this.safeCells[Math.floor(Math.random() * this.safeCells.length)]
            let x = safeCell.x
            let y = safeCell.y
            let cell = this.matrix[x][y]
            this.matrix[x][y] = cell.slice(2, -2)
            return { x: x, y: y }
        }
    }

    /**
     * Reveals all cells surrounding a cell. Only meant to be used for zero-cells during initial construction.
     * @param {SafeCell} c - A SafeCell to reveal around. This should only be a zero-cell!
     * @param {boolean} recurse - Whether to recursively reveal following zero-cells. Defaults to true.
     */
    revealSurroundings(c, recurse) {
        if (recurse === void 0) { recurse = true }
        let isSpoiler = (x, y) => { return this.matrix[x][y].includes("||") }
        let x = c.x
        let y = c.y
        let xLower = Math.max(0, x - 1)
        let yLower = Math.max(0, y - 1)
        let xUpper = Math.min(this.rows - 1, x + 1)
        let yUpper = Math.min(this.columns - 1, y + 1)
        let zeroCells = []
        for (let i = xLower; i <= xUpper; i++)
            for (let j = yLower; j <= yUpper; j++)
                if (isSpoiler(i, j)) {
                    if (this.matrix[i][j] === this.types.numbers[0])
                        zeroCells.push({ x: i, y: j })
                    this.matrix[i][j] = this.matrix[i][j].slice(2, -2)
                }
        if (recurse)
            zeroCells.forEach((c) => { return this.revealSurroundings(c, true) })
    }

    /**
     * Generates a minesweeper mine field and returns it.
     * @returns {(string | string[][] | null)}
     */
    start() {
        if (this.rows * this.columns <= this.mines * 2)
            return null
        this.generateEmptyMatrix()
        this.plantMines()
        this.populate()
        this.revealFirst()
        switch (this.returnType) {
            case 'emoji':
                return this.getTextRepresentation()
            case 'code':
                return "```" + this.getTextRepresentation() + "```"
            case 'matrix':
                return this.matrix
        }
    }
}