Chess3D
=======

# Projeto de Refatoração - pt

Refatoração do jogo original [Chess3D](https://github.com/FrenchYann/Chess3D).

Modificações realizadas:
- Atualização das dependências do projeto: atualizado o Three.js para a versão atual na data (177) e o jQuery para a versão 3.7.1.
- Melhoria na estrutura do código: organização dos arquivos e pastas, separação de responsabilidades e modularização.
- Adoção de melhores práticas de programação: uso de ES6+, funções puras, e programação orientada a objetos.
- Otimização de desempenho: removido os reflexos falsos que duplicavam os objetos na cena, simplificado o chão e reduzido o uso de objetos armazenados no escopo global.
- Melhorado a documentação do código.

# Refactoring Project - en

Refactoring of the original game [Chess3D](https://github.com/FrenchYann/Chess3D).

Modifications made:
- Updated project dependencies: updated Three.js to the current version (177) and jQuery to version 3.7.1.
- Improved code structure: organized files and folders, separated responsibilities, and modularized the code.
- Adopted best programming practices: used ES6+, pure functions, and object-oriented programming.
- Performance optimization: removed fake reflections that duplicated objects in the scene, simplified the floor, and reduced the use of objects stored in the global scope.
- Improved code documentation.

======

HTML5/WebGL 3D Chess Game

Using the pretty good [javascript chess AI developped by Gary Linscott][1], I developped an interactive 3D chessboard with some UI to start a game and undo, as well as save and loading in [PGN][2] format.

Little picture for advertisement purpose:
![enter image description here][3]

My code should be thoroughly commented.

You can try it [here][4]


Enjoy (:


  [1]: https://github.com/glinscott/Garbochess-JS
  [2]: http://en.wikipedia.org/wiki/Portable_Game_Notation
  [3]: http://yanngranjon.com/static/games/chess3D/screenshot.jpg
  [4]: http://yanngranjon.com/static/games/chess3D/
