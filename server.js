let clientIdList = {}
let publicGames = []
let games = {}
let gameId
let board






const http = require("http").createServer().listen(8080, console.log("servidor iniciado, ouvindo a porta 8080"))
const server = require("websocket").server
const socket = new server({"httpServer": http})

socket.on("request", (req)=>{
    const connection = req.accept(null, req.origin)

    connection.on('message', messageHandler)
    
    

    const clientId = idGenNumber()
    clientIdList[clientId] = {"connection": connection}

    connection.send(JSON.stringify({
        "tag": "connected",
        "clientId": clientId
    }))

    console.log("Usuário registrado. ClientID: " + clientId)

    let payload = {
      "tag": "gameList",
      "games": publicGames
  }

    connection.send(JSON.stringify(payload))

    connection.on("close", () =>{
      console.log("Usuário disconectado. ClientID: " + clientId + " [deletado]")
      disconnectPlayer(clientId)
      delete clientIdList[clientId]
    })

    
})

function closeHandler(){
  
}

function messageHandler(msg){
  let data = JSON.parse(msg.utf8Data)

  switch (data.tag){
    case "makePublic":
      updatePublicGames(data.gameId, data.clientId)
      
      break

    case "makePrivate":
      updatePublicGames(data.gameId, data.clientId)
      
      break

    case "createGame": {
      gameId = idGenerator()
      board = [
        "","","",
        "","","",
        "","",""
      ]

      games[gameId] = {
        "gameId": gameId,
        "players": Array(),
        "board": board
      }

      games[gameId].players.push({"clientId": data.clientId, "isTurn": 0})

      console.log("GameID " + gameId + " criado pelo cliente " + data.clientId)

      payload = {
        "tag": "createGame",
        "gameId": gameId
      }

      clientIdList[data.clientId].connection.send(JSON.stringify(payload))

      break
    }
    case "quitGame":

      
      if (games.hasOwnProperty(data.gameId)){
        if (publicGames.includes(data.gameId)){
          updatePublicGames(data.gameId, data.clientId)
        }

        games[data.gameId].players.forEach((element, index) => {
          

          if (!(games[data.gameId].players[index]["clientId"] == data.clientId)){
            
            payload = {
              "tag": "oponentLeft"
            }

            

            let oponentId = games[data.gameId].players[index]["clientId"]
            clientIdList[oponentId].connection.send(JSON.stringify(payload))

          }
        })

        delete games[data.gameId]
      }

      

      break
    
    case "enterGame":
      
      if (data.gameId in games){

        board = [
          "","","",
          "","","",
          "","",""
        ]

        let payload = {
          "tag": "enterGame",
          "status": 1,
          "gameId": data.gameId,
          "board": board
        }
        
        clientIdList[data.clientId].connection.send(JSON.stringify(payload))

        if (publicGames.includes(data.gameId)){
          updatePublicGames(data.gameId, games[data.gameId].players[0]["clientId"])
        }

        games[data.gameId].players.push({"clientId": data.clientId, "isTurn": 0})
        games[data.gameId].players[0].isTurn = 1
        payload = {
          "tag": "oponentJoin",
          "board": board,
          "isTurn": 1
        }
        clientIdList[games[data.gameId].players[0]["clientId"]].connection.send(JSON.stringify(payload))
      }

      else{
        let payload = {
          "tag": "enterGame",
          "status": 0
        }
        

        clientIdList[data.clientId].connection.send(JSON.stringify(payload))
      }
    
      break

    case "updateBoard": {

      

      if ((games[data.gameId].players.length == 2) && (verifyBoardUpdate(games[data.gameId].board, data.board)) && (playerIsTurn(data.gameId, data.clientId))){
        games[data.gameId].board = data.board

        let gameStatus = checkWinner(data.board)
        

        if (gameStatus == null){
          games[data.gameId].players[0]["isTurn"] = !games[data.gameId].players[0]["isTurn"]
          games[data.gameId].players[1]["isTurn"] = !games[data.gameId].players[1]["isTurn"]
          updatePlayersBoards(data.gameId)
        }
        else if(gameStatus.includes("X")){

          endGameWin(data.gameId, gameStatus)
        }
        else if(gameStatus.includes("O")){
          endGameWin(data.gameId, gameStatus)
        }
        else if(gameStatus == "tie"){
          endGameTie(data.gameId)
        }
        else{
          console.log("Secret third thing...")
        }
        
      }

      else{
        updatePlayersBoards(data.gameId)
      }

      break
    }
      
      
  }

    

}

function idGenNumber(){

  let result = ''
  const characters = '0123456789'
  result += Math.floor(Math.random() * 9) + 1 // primeiro dígito não vai ser 0
  for(let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return parseInt(result)
}

function idGenerator(){

    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let counter = 0
    for(let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

function updatePublicGames(gameId, clientId){


  if (games[gameId].players[0]["clientId"] == clientId){
    if (publicGames.includes(gameId)){

      publicGames.splice(publicGames.indexOf(gameId), 1)
      console.log("GameID: " + gameId + " removido dos jogos publicos pelo cliente " + clientId)
      
    }
    else{
      publicGames.push(gameId)
      console.log("GameID: " + gameId + " adicionado aos jogos publicos pelo cliente " + clientId)
    }

    let payload = {
      "tag": "gameList",
      "games": publicGames
    }
    for (const key in clientIdList) {
      if (Object.hasOwnProperty.call(clientIdList, key)) {
        const value = clientIdList[key];
        value.connection.send(JSON.stringify(payload))
      }
    }
  }
}

function verifyBoardUpdate(currentBoard, newBoard){
  // Verifies that the newBoard sent from the client only received one update
  // Will also check any other potential forms of cheating, if needed.
  let change
  let difference = newBoard.filter((value, index) => value !== currentBoard[index]).length
  if (difference == 1){
    newBoard.forEach((element, index) => {
      if (element != currentBoard[index]){
        change = index
      }
    })

    if (currentBoard[change] != ""){
      return 0
    }
    else{
      return 1
    }
  }
  else{
    
    return 0
  }
}


function updatePlayersBoards(gameId){
  games[gameId].players.forEach(player => {
    let payload = {
      "tag": "updateBoard",
      "board": games[gameId].board,
      "isTurn": player["isTurn"]
    }
    clientIdList[player["clientId"]].connection.send(JSON.stringify(payload))
  })
}

function playerIsTurn(gameId, clientId){
  let isTurn = 0
  
  games[gameId].players.forEach((element, index) => {
    if (games[gameId].players[index]["clientId"] == clientId){
      isTurn = games[gameId].players[index]["isTurn"]
    }
  })

  return isTurn
}


function checkWinner(board) {

  /*
  The function checks and returns, if any, the winner.
  It first checks for possible line alignments, then column alignments and finally for the two possible diagonal alignments.
  If no victory is found, it checks if the board if full. If the board is full and no victory happened, it means a draw (returns the string "tie").
  If the board isn't full, the game is still happening and null is returned.

  Vitories return the winner symbol (either "X" or "O") followed by the alignment. For exemple, "X00" means the X won in the horizontally (first 0) in the first line (second 0).

  First number: 
    0: Horizontal
    1: Vertical
    2: Diagonal

  Second number:
    0: First line, column or the orientation is from up to down (diagonal).
    1: Second line, column or the orientation is from down to up (diagonal).
    2: Third line or column. There is no third possibility for the diagonal.
  */
  
  board = [    [board[0], board[1], board[2]],
    [board[3], board[4], board[5]],
    [board[6], board[7], board[8]]
  ]

  // Checks line by line. board[line][column]. If the first item is not empty and equal to the others, the line is filled by the symbol. Therefore, theres a victory in line i.
  for (let i = 0; i < 3; i++) {
    if (board[i][0] !== "" && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return board[i][0] + 0 + i // Symbol + Horizontal (0) + Line
    }
  }

  //Checks column by column. board[line][column]. If the first item is not empty and equal to the others, the column is filled by the symbol. Therefore, theres a victory in column j.
  for (let j = 0; j < 3; j++) {
    if (board[0][j] !== "" && board[0][j] === board[1][j] && board[1][j] === board[2][j]) {
      return board[0][j] + 1 + j // Symbol + Vertical (1) + Column
    }
  }

  
  // This is a diagonal from up to down (left to right).
  if (board[0][0] !== "" && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0] + 2 + 0 // Symbol + Diagonal (2) + Up to down (0)
  }
  // This is a diagonal from down to up (left to right).
  if (board[0][2] !== "" && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2] + 2 + 1 // Symbol + Diagonal (2) + Down to up (1)
  }

  // If no winner is found above, it must check if the board is full.
  let isFull = true;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === "") {
        isFull = false;
        break;
      }
    }
  }
  if (isFull) {
    // If the board is full and there is no winner, it means a draw.
    return "tie";
  }

  // If it ain't full, the game is still happening.
  return null;
}

function endGameWin(gameId, winnerSymbol){
  games[gameId].players[0]["isTurn"] = 0
  games[gameId].players[1]["isTurn"] = 0

  let winPayload = {
    tag: "win",
    direction: winnerSymbol
  }

  let losePayload = {
    tag: "lose",
    direction: winnerSymbol
  }

  let player1 = clientIdList[games[gameId].players[0]["clientId"]].connection
  let player2 = clientIdList[games[gameId].players[1]["clientId"]].connection

  updatePlayersBoards(gameId)
  
  if (winnerSymbol.includes("X")){
    
    
    // The first player always has X as its symbol.
    // So if X wins, we sent the first player the winner message.
    // And the loser message to the second one.
    player1.send(JSON.stringify(winPayload))
    player2.send(JSON.stringify(losePayload))

  }
  else{
    // and so the inverse if O wins.
    player1.send(JSON.stringify(losePayload))
    player2.send(JSON.stringify(winPayload))
  }
  
}

function endGameTie(gameId){
  games[gameId].players[0]["isTurn"] = 0
  games[gameId].players[1]["isTurn"] = 0

  let payload = {
    tag: "draw"
  }


  let player1 = clientIdList[games[gameId].players[0]["clientId"]].connection
  let player2 = clientIdList[games[gameId].players[1]["clientId"]].connection

  updatePlayersBoards(gameId)

  player1.send(JSON.stringify(payload))
  player2.send(JSON.stringify(payload))

}

function disconnectPlayer(clientId){
  /*
    If a player leaves disconnects from the socket, its opponent must be disconnected aswell.
  */
  Object.keys(games).forEach(function(key){ 
    // Runs through every single existng game.
    // If the clientId of the leaving player is found in a existing game, his opponent is disconnected and the game is deleted.
    if ((games[key]["players"][0]["clientId"] == clientId)){

      updatePublicGames(games[key]["gameId"], clientId)

      if (games[key]["players"].length > 1){ //If there is a second player, it must be disconnected.
      

        let opponentId = games[key]["players"][1]["clientId"]
        let payload = {
          "tag": "oponentLeft"
        }
      clientIdList[opponentId].connection.send(JSON.stringify(payload))
      }
      
      console.log("GameID: " + games[key]["gameId"] + " deletado.")
      delete games[key]
      return 0
    }

    else if( (games[key]["players"].length > 1) && (games[key]["players"][1]["clientId"] == clientId)){

      if (games[key]["players"].length > 1){ //If there is a second player, they must be disconnected.
        let opponentId = games[key]["players"][0]["clientId"]

        let payload = {
          "tag": "oponentLeft"
        }

        clientIdList[opponentId].connection.send(JSON.stringify(payload))

      }
      
      console.log("GameID: " + games[key]["gameId"] + " deletado.")
      delete games[key]
      return 0

    }
  })
}

function listAllGames(){
  Object.keys(games).forEach(function(key){
    console.log(key, games[key])
  })
}
