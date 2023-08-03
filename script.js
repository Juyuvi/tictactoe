export function changePage(){
    
    
    let panel = document.getElementById("panel")
    let gamePanel = document.getElementById("gamePanel")

    if (getComputedStyle(panel).display == "block"){
        
        panel.style.display = "none"
        gamePanel.style.display = "initial"
    }

    else{
        
        panel.style.display = "initial"
        gamePanel.style.display = "none"
    }


}


