import { changePage } from "./script.js"

let clientId
let game
let gameId
let mySymbol
let myClass
let myTurn = 0
let gameEnded = 1
let board = [
    "","","",
    "","","",
    "","",""
]
const alignmentArray = [
    [document.getElementById("firstSquare"), document.getElementById("middleMiddleSquare"), document.getElementById("bottomLastSquare")],
    [document.getElementById("firstSquare"), document.getElementById("topMiddleSquare"), document.getElementById("topLastSquare")],
    [document.getElementById("firstSquare"), document.getElementById("bottomLastSquare")]
]
let lineDivId = ""


var socket = new WebSocket("ws://localhost:8080")
socket.onmessage = onMessage

// Getting DOM elements
const gameList = document.getElementById("gameList")
const btnCreateGame = document.getElementById("btnCreateGame")
const statusDisplay = document.getElementById("statusDisplay")
const squares = document.querySelectorAll(".gamePosition")
const btnMudarVisib = document.getElementById("btnMudarVisib")
const btnSair = document.getElementById("btnSair")
const btnEnter = document.getElementById("btnEnter")
const inputIdGame = document.getElementById("idgame")
const gameIdDisplay = document.getElementById("gameIdDisplay")
const list = document.getElementById("gameList")
const gamePanel = document.getElementById("panel")
const modalTitle = document.getElementById("modalTitle")
const modalText = document.getElementById("modalText")



// Listeners
btnSair.addEventListener("click", quitGame)
btnMudarVisib.addEventListener("click", changeVisib)
btnCreateGame.addEventListener("click", createGame)
btnEnter.addEventListener("click", () => enterGame(inputIdGame.value))
squares.forEach((square, index) => {
    square.addEventListener("click", () => squareClick(index))
})


// creating elements.
var myModal = new bootstrap.Modal(document.getElementById("exampleModal"))



function onMessage(msg){
    const data = JSON.parse(msg.data)

    switch(data.tag){

        case "connected":
            console.log("Conectado com o servidor, com o ID: " + data.clientId)
            clientId = data.clientId
            break

        case "gameList": {
            gameList.innerHTML = ""

            data.games.forEach(function(gameId) {
                const game = document.createElement("li")
                game.textContent = gameId
                gameList.appendChild(game)
              })

              list.querySelectorAll("li").forEach(item => {
                
                
                item.addEventListener("click", function() {
                    gameId = this.textContent
                  
                  enterGame(gameId)
                })
              })
            
              break
        }
        
        case "createGame":{
            gameId = data.gameId
            gameIdDisplay.innerHTML = gameId
            mySymbol = "X"
            break
        }

        case "oponentJoin": {
            
            board = data.board
            gameEnded = 0
            changeTurn(1)
            document.getElementById("btnMudarVisib").disabled = true
            myTurn = data.isTurn
            break
        }

        case "enterGame": {
            if(data.status){
                gameId = data.gameId
                gameIdDisplay.innerHTML = gameId
                statusDisplay.innerHTML = "Turno adversário"
                gameEnded = 0
                changeTurn(0)
                changePage()
                document.getElementById("btnMudarVisib").disabled = true
                board = data.board
                mySymbol = "O"
            }
            else{
                modalTitle.innerHTML = "Partida Inexistente"
                modalText.innerHTML = "Não há nenhuma partida com o ID inserido."
                myModal.show()
            }
            break
        }

        case "updateBoard": {
            board = data.board
            myTurn = data.isTurn
            updateLocalBoard()
            changeTurn(data.isTurn)

            break
        }

        case "oponentLeft": {
            quitGame()
            modalTitle.innerHTML = "Partida encerrada"
            modalText.innerHTML = "Seu adversário saiu do jogo."
            myModal.show()
            break
        }

        case "win": {
            winGame()
            drawTheLine(data.direction)
            break
        }

        case "lose": {
            loseGame()
            drawTheLine(data.direction)
            break
        }

        case "draw": {
            drawGame();
            
            break
        }

    }
}

function createGame(){
    let payload = {
        "tag": "createGame",
        "clientId": clientId
    }
    board = [
        "","","",
        "","","",
        "","",""
      ]

    socket.send(JSON.stringify(payload))
    updateLocalBoard()
    changePage()
    statusDisplay.innerHTML = "Aguardando adversário..."
    

}


function changeVisib(){


    if (btnMudarVisib.classList.contains("btnPrivado")){
        btnMudarVisib.classList.remove("btnPrivado")
        btnMudarVisib.classList.add("btnPublico")

        btnMudarVisib.classList.remove("btn-danger")
        btnMudarVisib.classList.add("btn-success")

        let payload = {
            "tag": "makePublic",
            "clientId": clientId,
            "gameId": gameId
        }

        socket.send(JSON.stringify(payload))
    }
    else{
        btnMudarVisib.classList.add("btnPrivado")
        btnMudarVisib.classList.remove("btnPublico")

        btnMudarVisib.classList.add("btn-danger")
        btnMudarVisib.classList.remove("btn-success")

        let payload = {
            "tag": "makePrivate",
            "clientId": clientId,
            "gameId": gameId
        }
        

        socket.send(JSON.stringify(payload)) 
    }
}


function quitGame(){
    
    
    let payload = {
        "tag": "quitGame",
        "clientId": clientId,
        "gameId": gameId
    }
    socket.send(JSON.stringify(payload))

    board = [
        "","","",
        "","","",
        "","",""
    ]
    if (!(lineDivId == "")){
        document.getElementById(lineDivId).remove()
        lineDivId = ""
    }
    

    updateLocalBoard()

    document.getElementById("gameCanvas").classList.remove("gameSquaresX")
    document.getElementById("gameCanvas").classList.remove("gameSquaresO")
    squares.forEach(square => {
        square.removeEventListener("click", () => squareClick(index, myTurn))
    })

    if (btnMudarVisib.classList.contains("btnPublico")){
        
        btnMudarVisib.classList.add("btnPrivado")
        btnMudarVisib.classList.remove("btnPublico")

        btnMudarVisib.classList.add("btn-danger")
        btnMudarVisib.classList.remove("btn-success")
    }
    document.getElementById("btnMudarVisib").disabled = false
    gameEnded = 1
    changePage()

    
}

function enterGame(gameId){

    let payload = {
        "tag": "enterGame",
        "clientId": clientId,
        "gameId": gameId
    }

    socket.send(JSON.stringify(payload))

    inputIdGame.value = ""
}

function changeTurn(myTurn){
    
    if (!gameEnded){
        
        if (myTurn){
            
            myClass = "gameSquares" + mySymbol
            document.getElementById("gameCanvas").classList.add(myClass)
            statusDisplay.innerHTML = "Seu turno"
            
            
        }
        else{
            
            document.getElementById("gameCanvas").classList.remove(myClass)
            statusDisplay.innerHTML = "Turno adversário"
        }
    }
}

function squareClick(index){
    
    if(myTurn){
        board[index] = mySymbol
        myTurn = 0
    }
    updateBoard();
}

function updateBoard(){

    // console.log("board: " + board)

    
    let payload = {
        "tag": "updateBoard",
        "clientId": clientId,
        "gameId": gameId,
        "board": board
    }

    socket.send(JSON.stringify(payload))
}

function updateLocalBoard(){


    board.forEach((square, index) => {
        if (square == "X"){
            
            squares[index].classList.add("X")
        }
        else if(square == "O"){
            
            squares[index].classList.add("bolinha")
        }
        else if(square == ""){
            squares[index].classList.remove("bolinha")
            squares[index].classList.remove("X")
        }
    })
}

function winGame(){
    statusDisplay.innerHTML = "Você ganhou!"
    gameEnded = 1
}

function loseGame(){
    statusDisplay.innerHTML = "Você perdeu."
    gameEnded = 1
}

function drawGame(){
    statusDisplay.innerHTML = "EMPATE!"
    gameEnded = 1
}

function drawTheLine(winDetails){
    /*
    This function decodes the "coordenates" sent from the server
    and finds the correct square and line to draw in the table.

    First number: 
    0: Horizontal
    1: Vertical
    2: Diagonal

  Second number:
    0: First line, column or the orientation is from up to down (diagonal).
    1: Second line, column or the orientation is from down to up (diagonal).
    2: Third line or column. There is no third possibility for the diagonal.
    */

    

    // Removes the winner symbol from the payload received from the server 
    // and saves the first and second number in a array.
    const alignment = winDetails.split("").slice(1) 
    const placementSquare = alignmentArray[alignment[0]][alignment[1]] // Gets the correct square to place the line.

    // Each kind of line has a unique id for it. This segment gets the correct one so the div can be created with it.
    switch (alignment[0]){
        case ("0"):
            // Horizontal line.
            lineDivId = "hLine"
            break

        case ("1"):
            // Vertical line.
            lineDivId = "vLine"
            break
        
        case ("2"):
            // Diagonal line.
            if (alignment[1] == "0"){
                lineDivId = "upDownLine"
            }
            else{
                lineDivId = "downUpLine"
            }
            break
    }

    const line = document.createElement("div") // Creates the line element with the lineDivId.
    line.setAttribute("id", lineDivId)
    placementSquare.appendChild(line)                                  // Inserts the line in the table.
}