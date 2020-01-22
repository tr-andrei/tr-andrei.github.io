function init() {
    var board = document.getElementById("board");
    let cellsize = board.offsetWidth / GRID_SIZE;

    let game = new Game();
    game.createGrid(cellsize);

    game.addActor('bee', vec2(1, 1));
    game.addActor('bee', vec2(1, 2));
    game.addActor('bee', vec2(1, 3));
    game.addActor('queenBee', vec2(0, 2));

    game.addActor('wasp', vec2(3, 1));
    game.addActor('wasp', vec2(3, 2));
    game.addActor('wasp', vec2(3, 3));
    game.addActor('queenWasp', vec2(4, 2));
}

document.addEventListener('DOMContentLoaded', init, false);