# Tic-Tac-Toe Online Multiplayer

Um jogo da velha multiplayer online desenvolvido com HTML, CSS, JavaScript e Node.js. Criado para explorar e aprender comunicação cliente-servidor usando WebSockets, o projeto oferece uma experiência polida e intuitiva para os usuários.

## Funcionalidades

- **Jogo em Tempo Real**: Comunicação eficiente via WebSockets entre os jogadores (fluxo cliente > servidor > cliente).
- **Lobby de Salas**: Interface de lobby onde os jogadores podem criar novas salas ou entrar em partidas existentes.
- **Logs de Erros e Manutenção**: Sistema de registro no servidor para monitorar e melhorar a estabilidade do jogo.
- **Interface Visual Moderna**: Desenvolvida com Bootstrap, garante uma experiência visual consistente.

## Demonstração

O jogo está hospedado e disponível para uso em [129.148.43.244](http://129.148.43.244/).

## Como Executar Localmente

1. **Clone o Repositório**:
   ```bash
   git clone https://github.com/Juyuvi/tictactoe.git
   ```

2. **Instale as Dependências**:
   - As dependências estão listadas no arquivo `package.json` e podem ser instaladas com:
     ```bash
     npm install
     ```

3. **Instruções de Execução**:
   - Navegue até o diretório do projeto.
   - Execute o servidor localmente com:
     ```bash
     node server.js
     ```
   - Abra o arquivo `index.html` no navegador para acessar a interface do jogo.

## Estrutura do Projeto

- **`server.js`**: Gerencia a comunicação em tempo real entre os jogadores.
- **Client-Side (HTML, CSS e JS)**: Interface do usuário para lobby, sala de jogo e exibição das partidas.


