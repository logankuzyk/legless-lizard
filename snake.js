let request = {}
let requestText = ''
let mode = ''
let maxIterations = 5 // Number of move iterations to be performed.
let iterations = 0
let bigIterations = 0
let storage = []
let newStorage = []
let predator = {}
let snack = {}

// Thinking methods are for life-saving moves and cannot be ignored. snakeOptions prevents immediate death, the others prevent death within the next few turns.
class Thinking {
    constructor () {
    }

    logProbabilities = function (apiRequest) {
        for (let y = 0; y < apiRequest.board.width; y++) {
            let line = ''
            for (let x = 0; x < apiRequest.board.height; x++) {
                if (apiRequest.board.possibilities[x][y] != 0) {
                    line += apiRequest.board.possibilities[x][y].toFixed(2) + ' '
                } else {
                    line += '     '
                }
            }
            console.log(line)
        }
        console.log('')
    }

    // Returns possible moves for given snake.
    snakeOptions = function (coord, apiRequest) {
        let possibilities = ['up', 'right', 'left', 'down']
        let x = coord.x
        let y = coord.y

        for (let other of apiRequest.board.snakes) {
            for (let i = 0; i < other.body.length; i++) {
                if (i == other.body.length - 1 && other.body.length > 2) {
                    continue
                }
                if (other.body[i].x == x + 1 && other.body[i].y == y) {
                    let rem = possibilities.indexOf('right')
                    if (rem >= 0) {
                        possibilities.splice(rem, 1)
                    }
                }
                if (other.body[i].x == x - 1 && other.body[i].y == y) {
                    let rem = possibilities.indexOf('left')
                    if (rem >= 0) {
                        possibilities.splice(rem, 1)
                    }
                }
                if (other.body[i].y == y + 1 && other.body[i].x == x) {
                    let rem = possibilities.indexOf('down')
                    if (rem >= 0) {
                        possibilities.splice(rem, 1)
                    }
                }
                if (other.body[i].y == y - 1 && other.body[i].x == x) {
                    let rem = possibilities.indexOf('up')
                    if (rem >= 0) {
                        possibilities.splice(rem, 1)
                    }
                }
            }
        }

        if (x == 0) {
            let rem = possibilities.indexOf('left')
            if (rem >= 0) {
                possibilities.splice(rem, 1)
            }
        } else if (x == apiRequest.board.width - 1) {
            let rem = possibilities.indexOf('right')
            if (rem >= 0) {
                possibilities.splice(rem, 1)
            }
        }

        if (y == 0) {
            let rem = possibilities.indexOf('up')
            if (rem >= 0) {
                possibilities.splice(rem, 1)
            }
        } else if (y == apiRequest.board.height - 1) {
            let rem = possibilities.indexOf('down')
            if (rem >= 0) {
                possibilities.splice(rem, 1)
            }
        }

        return possibilities
    }

    simulateHelper = function (apiRequest, move) {
        if (typeof(apiRequest) == 'string') {
            apiRequest = JSON.parse(apiRequest)
        }
        
        let snake = apiRequest.you
        let head = snake.body[0]
        if (iterations > maxIterations) {
            // console.log('ran out of iterations')
            return 0
        }

        // Current problems: probability not changing when snake moves. Snake moves backwards into itself when at size 2.
        for (let other of apiRequest.board.snakes) {
            if (other.body.length == 1) {
                continue
            } else if (other.body[0].x == head.x && other.body[0].y == head.y) {
                // "Other" is actually my snake.
                if (move == 'right') {
                    other.body.unshift({x: head.x + 1, y: head.y})
                    snake.body.unshift({x: head.x + 1, y: head.y})
                } else if (move == 'left') {
                    other.body.unshift({x: head.x - 1, y: head.y})
                    snake.body.unshift({x: head.x - 1, y: head.y})
                } else if (move == 'up') {
                    other.body.unshift({x: head.x, y: head.y - 1})
                    snake.body.unshift({x: head.x, y: head.y - 1})
                } else if (move == 'down') {
                    other.body.unshift({x: head.x, y: head.y + 1})
                    snake.body.unshift({x: head.x, y: head.y + 1})
                }
                // Moved into self.
                // if (other.body[0].x == other.body[2].x && other.body[0].y == other.body[2].y) {
                //     // console.log('moved into self')
                //     // console.log(other.body)
                //     return 0
                // }
                for (let food of apiRequest.board.food) {
                    if (Math.abs(other.body[0].x - food.x) == 1 || Math.abs(other.body[0].y - food.y) == 1) {
                        // console.log('CLOSE TO FOOD')
                        food = {}
                        other.body[other.body.length] = other.body[other.body.length - 1]
                    }
                }
                snake.body.pop()
            }
            let x = other.body[other.body.length - 1].x
            let y = other.body[other.body.length - 1].y
            if (apiRequest.board.possibilities[x][y] != 0) {
                apiRequest.board.possibilities[x][y]--
            }
            for (let food of apiRequest.board.food) {
                if (Math.abs(other.body[0].x - food.x) == 1 || Math.abs(other.body[0].y - food.y) == 1) {
                    // console.log('CLOSE TO FOOD')
                    food = {}
                    other.body[other.body.length] = other.body[other.body.length - 1]
                }
            }
            other.body.pop()
        }
        // Check if snake moved off the board.
        if (0 > snake.body[0].x || snake.body[0].x >= apiRequest.board.width) {
            // console.log('moved off horizontal')
            return 0
        } else if (0 > snake.body[0].y || snake.body[0].y >= apiRequest.board.height) {
            // console.log('moved off vertical')
            return 0
        }
        head = snake.body[0]
        for (let other of apiRequest.board.snakes) {
            for (let member of other.body) {
                // console.log(other.body.indexOf(member))
                // console.log(head)
                // console.log(member)
                if (other.body.indexOf(member) == 0 && head.x == member.x && head.y == member.y) {
                    continue
                }
                if (head.x == member.x && head.y == member.y) {
                    // console.log('moved into snake')
                    return 0
                }
            }
        }

        // console.log('updating probabilities')
        // console.log(apiRequest.board.snakes[1])
        this.updateProbs(apiRequest)

        if (apiRequest.board.possibilities[snake.body[0].x][snake.body[0].y] > 1) {
            // console.log('moved onto high prob tile')
            return 2 - apiRequest.board.possibilities[snake.body[0].x][snake.body[0].y]
        }

        iterations++

        let result = {right: 0, left: 0, up: 0, down: 0}
        let newRequest = JSON.stringify(apiRequest)
        for (let move of this.probabilityFlow(apiRequest)) {
            // console.log('simulating ' + move)
            result[move] = this.simulateHelper(newRequest, move)
            // console.log(result[move])
        }

        let max = Math.max(result.right, result.left, result.up, result.down)
        // return simRequest.board.possibilities[snake.body[0].x][snake.body[0].y] - 1 + min
        // console.log('returning max')
        // console.log(this.probabilityFlow(apiRequest).length)
        return max + this.snakeOptions(snake.body[0], apiRequest).length + 1
    }

    // Makes decision between simulated directions.
    simulate = function (moves, apiRequest) {
        let result = {'left': 0, 'right': 0, 'up': 0, 'down': 0}
        let final = []
        let possible = this.snakeOptions(request.you.body[0], request)
        let feel = new Feeling()
        let avoid = []
        
        bigIterations++

        if (feel.avoidSnake() != null) {
            avoid = feel.avoidSnake()
        }

        if (possible.length == 0) {
            return []
        }
        // TODO: find a better way of doing this.
        for (let move of avoid) {
            iterations = 0
            if (this.snakeOptions(request.you.body[0], request).indexOf(move) < 0) {
                result[move] = 0
                continue
            }
            result[move] += this.simulateHelper(JSON.parse(apiRequest), move)
        }
        console.log(result)
        for (let move of moves) {
            iterations = 0
            if (this.snakeOptions(request.you.body[0], request).indexOf(move) < 0) {
                result[move] = 0
                continue
            }
            result[move] += this.simulateHelper(JSON.parse(apiRequest), move)
        }

        let best = Math.max(result.right, result.left, result.up, result.down)
        if (best == 0 && bigIterations < maxIterations) { // TODO: make this run less times in an "infinite" loop scenario
            console.log('desired moves are impossible or bad:')
            console.log(result)
            return this.simulate(possible, apiRequest)
        } else if (best < 2) {
            for (let move of Object.keys(result)) {
                if (result[move] == 0) {
                    result[move] = 5
                }
            }
            best = Math.min(result.right, result.left, result.up, result.down)
        }
        if (result['right'] == best) {
            final.push('right')
        } if (result['left'] == best) {
            final.push('left')
        } if (result['up'] == best) {
            final.push('up')
        } if (result['down'] == best) {
            final.push('down')
        }
        console.log('Done simulating moves: ')
        console.log(result)
        return final
    }
    
    // Moves probabilities forward a move.
    // TODO: make it so that it only adds probability score to outer layer of blocks.
    // simulateHelper is the only other recursive function now, step should be checked compared to simulateHelper's iterations. Therefore iterations should be made global.
    // Doesn't update probability of coordinate itself but the 'free' ones around it.
    updateProbsHelper = function (coord, lastCoord, snake, apiRequest) {
        let moves = [{x: coord.x + 1, y: coord.y}, {x: coord.x - 1, y: coord.y}, {x: coord.x, y: coord.y + 1}, {x: coord.x, y: coord.y - 1}]
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].x == lastCoord.x && moves[i].y == lastCoord.y || moves[i].x >= apiRequest.board.width || moves[i].y >= apiRequest.board.height || moves[i].x < 0 || moves[i].y < 0) {
                let rem = i
                if (rem >= 0) {
                    moves.splice(rem, 1)
                    i--
                }
            }
        }
        for (let move of moves) {
            // console.log(move)
            if (snake.size != 'smaller') {
                apiRequest.board.possibilities[move.x][move.y] += apiRequest.board.possibilities[coord.x][coord.y] * 1/moves.length
            }
            newStorage.push([move, coord, snake])
        }
    }

    updateProbs = function (apiRequest) {
        this.currentProbs(apiRequest)
        if (iterations <= 1) {
            for (let other of apiRequest.board.snakes) {
                if (other.body.length < 2 || other.body[0].x == apiRequest.you.body[0].x && other.body[0].y == apiRequest.you.body[0].y) {
                    continue
                } else {
                    this.updateProbsHelper(other.body[0], other.body[1], other, apiRequest)
                }
            }
        } else {
            for (let member of storage) {
                this.updateProbsHelper(member[0], member[1], member[2], apiRequest)
            }
        }
        // Dumps newStorage into storage and resets newStorage.
        storage = []
        for (let i = 0; i < newStorage.length; i++) {
            storage[i] = newStorage[i]
        }
        newStorage = []
        // this.logProbabilities(apiRequest)
    }

    // Updates occupied tiles of board to have 100% probability.
    currentProbs = function (apiRequest) {
        for (let other of apiRequest.board.snakes) {
            for (let tile of other.body) {
                let x = tile.x
                let y = tile.y

                if (apiRequest.board.possibilities[x][y] != 1) {
                    apiRequest.board.possibilities[x][y]++
                }
            }
        }
    }
    
    // Returns list of moves that are least likely to collide.
    probabilityFlow = function (apiRequest) {
        let snake = apiRequest.you
        // this.currentProbs(apiRequest)
        // this.updateProbs(apiRequest)
            
        let right = 1
        let left = 1
        let up = 1
        let down = 1
        for (let option of this.snakeOptions(snake.body[0], apiRequest)) {
            if (option == 'right') {
                right = apiRequest.board.possibilities[snake.body[0].x + 1][snake.body[0].y]
            } else if (option == 'left') {
                left = apiRequest.board.possibilities[snake.body[0].x - 1][snake.body[0].y]
            } else if (option == 'up') {
                up = apiRequest.board.possibilities[snake.body[0].x][snake.body[0].y - 1]
            } else if (option == 'down') {
                down = apiRequest.board.possibilities[snake.body[0].x][snake.body[0].y + 1]
            }
        }

        // console.log('right ' + right)
        // console.log('left ' + left)
        // console.log('up ' + up)
        // console.log('down ' + down)
        

        let min = ''
        let options = []
        
        min = Math.min(right, left, up, down)
        if (right == min) {
            options.push('right')
        } if (left == min) {
            options.push('left')
        } if (up == min) {
            options.push('up')
        } if (down == min) {
            options.push('down')
        }        
        // TODO: make sure probabilities are only being edited once per turn simulation.        

        if (min >= 1/3) {
            return []
        }
        return options
    }
}

// Feeling methods return suggestions. The only consquence of ignoring feeling methods is worse strategy, not death.
class Feeling {
    // Returns a move going towards a given tile.
    moveTowards ({x, y}) {
        let want = []
        
        if (request.you.body[0].x < x) {
            if (want.indexOf('right') < 0) {
                want.push('right')
            }
        } else if (request.you.body[0].x > x) {
            if (want.indexOf('left') < 0) {
                want.push('left')
            }
        }

        if (request.you.body[0].y > y) {
            if (want.indexOf('up') < 0) {
                want.push('up')
            }
        } else if (request.you.body[0].y < y){
            if (want.indexOf('down') < 0) {
                want.push('down')
            }
        }

        return want
    }

    moveAway = function ({x, y}) {
        let opp = this.moveTowards({x, y})
        let want = ['right', 'left', 'up', 'down']

        for (let move of opp) {
            let rem = want.indexOf(move)
            if (rem >= 0) {
                want.splice(rem, 1)
            }
        }
        
        return want
    }

    // Returns moves attacking the closest smaller snake.
    targetSnake = function () {
        let target = [request.you, 100]
        for (let snake of request.board.snakes) {
            if (snake.body.length < target[0].body.length && this.distanceBetween(request.you.body[0], snake.body[0]) < target[1]) {
                target = [snake, this.distanceBetween(request.you.body[0], snake.body[0])]
            }
        }
        
        if (target[0].body.length == request.you.body.length) {
            return null
        }

        if (this.snakeDirection(target[0]) == 'right') {
            return this.moveTowards({'x': target[0].body[0].x + 1, 'y': target[0].body[0].y})
        } else if (this.snakeDirection(target[0]) == 'left') {
            return this.moveTowards({'x': target[0].body[0].x - 1, 'y': target[0].body[0].y})
        } else if (this.snakeDirection(target[0]) == 'up') {
            return this.moveTowards({'x': target[0].body[0].x, 'y': target[0].body[0].y - 1})
        } else if (this.snakeDirection(target[0]) ==  'down') {
            return this.moveTowards({'x': target[0].body[0].x, 'y': target[0].body[0].y + 1})
        }
    }

    // Returns moves avoid nearest bigger snake.
    avoidSnake = function () {
        let target = [request.you, 100]
        let think = new Thinking()
        for (let snake of request.board.snakes) {
            if (snake.size != 'smaller' && this.distanceBetween(request.you.body[0], snake.body[0]) < target[1]) {
                target = [snake, this.distanceBetween(request.you.body[0], snake.body[0])]
            }
        }

        if (target[0].size == 'smaller') {
            return null
        }

        predator = target[0]

        let options = think.snakeOptions(target[0].body[0], request)
        let final = []

        for (let move of options) {
            if (move == 'right') {
                for (let otherMove of this.moveAway({'x': target[0].body[0].x + 1, 'y': target[0].body[0].y})) {
                    if (final.indexOf(otherMove) < 0) {
                        final.push(otherMove)
                    }
                }
            } else if (move == 'left') {
                for (let otherMove of this.moveAway({'x': target[0].body[0].x - 1, 'y': target[0].body[0].y})) {
                    if (final.indexOf(otherMove) < 0) {
                        final.push(otherMove)
                    }
                }
            } else if (move == 'up') {
                for (let otherMove of this.moveAway({'x': target[0].body[0].x, 'y': target[0].body[0].y - 1})) {
                    if (final.indexOf(otherMove) < 0) {
                        final.push(otherMove)
                    }
                }
            } else if (move ==  'down') {
                for (let otherMove of this.moveAway({'x': target[0].body[0].x, 'y': target[0].body[0].y + 1})) {
                    if (final.indexOf(otherMove) < 0) {
                        final.push(otherMove)
                    }
                }
            }
        }
        return final
    }
    // Returns directions to make snake go diagonally.
    diagonal = function (snake) {
        let dir = this.snakeDirection(snake)[0]

        if (dir == 'left') {
            return ['up', 'down']
        } else if (dir == 'right') {
            return ['down', 'up']
        } else if (dir == 'up') {
            return ['left', 'right']
        } else if (dir == 'down') {
            return ['right', 'left']
        }
    }

    // Returns direction snake went on the last turn.
    snakeDirection = function (snake) {
        if (snake.body.length == 1) {
            return 'right'
        }
        let head = {
            x: snake.body[0].x,
            y: snake.body[0].y
        }
        let neck = {
            x: snake.body[1].x,
            y: snake.body[1].y
        }
        let vector = {
            x: head.x - neck.x,
            y: head.y - neck.y
        }

        if (vector.x > 0) {
            return ['right']
        } else if (vector.x < 0) {
            return ['left']
        } else if (vector.y < 0) {
            return ['up']
        } else if (vector.y > 0) {
            return ['down']
        }
    }

    distanceBetween = function (coord1, coord2) {
        let x1 = coord1.x
        let x2 = coord2.x
        let y1 = coord1.y
        let y2 = coord2.y

        return Math.sqrt((y1 - y2)**2 + (x1 - x2)**2)
    }

    closestFood = function () {
        let minDistance = 100 // TODO: make this unhard coded.
        let minFood = {}
    
        for (let food of request.board.food) {
            if (this.distanceBetween(request.you.body[0], food) < minDistance) {
                // console.log(food)
                minDistance = this.distanceBetween(request.you.body[0], food)
                minFood = food
            }
        }
        // console.log('closest food is ' + minDistance + " away " + minFood.x + " " + minFood.y)
        
        if (minDistance == 100) {
            return request.board.food[0]
        }
        
        snack = minFood

        return minFood
    }
}

// Will return the best behavior mode for the situation. For example, attack, defense, grow, etc.
function mood () {
    let feel = new Feeling()
    console.log('distance to predator: ' + feel.distanceBetween(predator.body[0], request.you.body[0]))
    console.log('distance to food ' + feel.distanceBetween(snack, request.you.body[0]))
    if (request.you.health < 60) {
        mode = 'hungry'
    } else if (feel.targetSnake() != null && feel.avoidSnake() == null) {
        mode = 'attack'
    } else if (feel.distanceBetween(predator.body[0], request.you.body[0]) < feel.distanceBetween(snack, request.you.body[0]) && request.board.snakes.length < 3) {
        mode = 'defend'
    } else {
        mode = 'hungry'
    }
}

function checkSnakes () {
    let feel = new Feeling()
    for (let other of request.board.snakes) {
        if (other.body.length > request.you.body.length) {
            other.size = 'bigger'
        } else if (other.body.length < request.you.body.length) {
            other.size = 'smaller'
        } else {
            other.size = 'same'
        }
    }
    feel.avoidSnake()
}

function brain () {
    let feel = new Feeling()
    let think = new Thinking()
    let possible = think.snakeOptions(request.you.body[0], request)
    bigIterations = 0

    mood()
    console.log(mode)

    if (mode == 'hungry') {
        return think.simulate(feel.moveTowards(feel.closestFood()), requestText)[0]
    } else if (mode == 'attack') {
        return think.simulate(feel.targetSnake(), requestText)[0]
    } else if (mode == 'defend') {
        return think.simulate(feel.avoidSnake(), requestText)[0]
    } else {
        return possible[0]
    }
}

module.exports = function (apiRequest) {
    request = apiRequest
    request.board.possibilities = []
    // console.log(request.you.body[0])
    console.time('now')
    for (let i = 0; i < request.board.width; i++) {
        request.board.possibilities.push([])
        for (let j = 0; j < request.board.width; j++) {
            request.board.possibilities[i][j] = 0
        }
    }
    checkSnakes()
    requestText = JSON.stringify(request)
    let message = brain()
    // console.log(request.you.body[0])
    console.log(message)
    console.timeEnd('now')
    return message
}
