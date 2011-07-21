"use strict";

var camera, scene, geometry, material, renderer, board;

window.addEventListener('load', init);

var Player = {RED: 1, BLUE: 2};

function Board() {
  var scene = this.scene = new THREE.Scene();

  scene.addObject(Board.makeBoardMesh());

  var light1 = new THREE.DirectionalLight(0xFFFFFF, .7);
  light1.position.x = light1.position.y = light1.position.z = 1;
  scene.addLight(light1);
  var light2 = new THREE.DirectionalLight(0xFFFFFF, .6);
  light2.position.x = -2;
  light2.position.y = light2.position.z = 1;
  scene.addLight(light2);

  for (var x = 0; x < 4; ++x) {
    for (var y = 0; y < 4; ++y) {
      scene.addObject(Board.makePin(x, y));
    }
  }

  this.clearPills();

  //this.placePill(0, 0, Player.BLUE);
  //this.placePill(3, 3, Player.RED);
  //this.placePill(3, 0, Player.BLUE);
  //this.placePill(0, 3, Player.RED);
  //this.placePill(2, 0, Player.BLUE);
  //this.placePill(1, 0, Player.RED);
}

Board.prototype.placePill = function (x, y, ply, noWinDetect) {
  var col = this.columns[y*4 + x];
  var z = col.length;
  var pill = Board.makePill(x, y, z, ply);
  this.scene.addObject(pill);
  col.push(pill);
  if (!noWinDetect) {
    var win = this.winDetect(x, y, z);
    if (win) {
      alert(ply+" wins! "+win);
    }
  }
  return z;
};

function init() {
  var width = window.innerWidth-16, height = window.innerHeight-16;

  board = new Board();

  camera = new THREE.Camera(75, width / height, 1, 10000);
  camera.position.z = 1000;
  camera.position.x = 100;
  camera.position.y = 500;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);

  document.body.appendChild(renderer.domElement);

  render();
}

function render() {
  renderer.render(board.scene, camera);
}

var turn = Player.BLUE;

function place(x, y) {
  board.placePill(x, y, turn);
  turn = (turn == Player.BLUE) ? Player.RED : Player.BLUE;
  render();
}

Board.prototype.clearPills = function () {
  var columns = this.columns = new Array(16);
  for (var i = 0; i < 16; ++i) {
    columns[i] = [];
  }
};

Board.makeBoardMesh = function () {
  var material = new THREE.MeshBasicMaterial({ color: 0x000099 });
  var geometry = new THREE.PlaneGeometry(1000, 1000);
  var mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -90 * Math.PI / 180;
  return mesh;
};

Board.makePin = function (x, y) {
  var height = 400;
  var material = new THREE.MeshBasicMaterial({ color: 0xCCCC99 });
  var geometry = new THREE.CylinderGeometry(6, 20, 20, height);
  var mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -90 * Math.PI / 180;
  mesh.position.x = x*300 - 450;
  mesh.position.z = y*300 - 450;
  mesh.position.y = height/2;
  return mesh;
};

Board.makePill = function (x, y, z, ply) {
  var height = 100, padding = 5;
  var material = new THREE.MeshPhongMaterial({ color: (ply == Player.RED) ? 0xFF0000 : 0x0000FF });
  var geometry = new THREE.CylinderGeometry(32, 100, 100, height-padding);
  var mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -90 * Math.PI / 180;
  mesh.position.x = x*300 - 450;
  mesh.position.z = y*300 - 450;
  mesh.position.y = height/2 + z*height;
  mesh.player = ply;
  return mesh;
};

Board.prototype.getPillType = function (x, y, z) {
  var col = this.columns[y*4+x];
  if (z >= col.length) return null;
  return col[z].player;
};

Board.prototype.getAllPillTypes = function () {
  var res = new Array(4*4*4);
  var idx = 0;
  for (var y = 0; y < 4; ++y) {
    for (var x = 0; x < 4; ++x, idx += 4) {
      var col = this.columns[y*4+x];
      for (var z = 0; z < col.length; ++z) {
	res[z+idx] = col[z].player;
      }
    }
  }
  return res;
};

Board.prototype.winDetect = function (x, y, z) {
  var pills = this.getAllPillTypes();
  var ply = pills[y*16+x*4+z];
  if (!ply) {
    console.log("winDetect called on blank space: "+x+","+y+","+z);
  }
  var check = function (offset, interval) {
    return pills[offset] == ply
      && pills[offset+interval] == ply
      && pills[offset+2*interval] == ply
      && pills[offset+3*interval] == ply
      && [offset, interval];
  };
  return check(y*16+x*4, 1)                            // +z
      || check(y*16+z, 4)                              // +x
      || check(x*4+z, 16)                              // +y
      || (x == z && check(y*16, 4+1))                  // +x, +z
      || (x == 3-z && check(y*16 + 4-1, 4-1))          // +x, -z
      || (y == x && check(z, 16+4))                    // +y, +x
      || (y == 3-x && check(z + 16-4, 16-4))           // +y, -x
      || (y == z && check(x*4, 16+1))                  // +y, +z
      || (y == 3-z && check(x*4 + 16-1, 16-1))         // +y, -z
      || (y == x && x == z && check(0, 16+4+1))        // +y, +x, +z
      || (y == x && x == 3-z && check(4-1, 16+4-1))    // +y, +x, -z
      || (y == 3-x && 3-x == z && check(16-4, 16-4+1)) // +y, -x, +z
      || (y == 3-x && x == z && check(16-1, 16-4-1));  // +y, -x, -z
};

Board.prototype.winTest = function () {
  var testcases_win = [
    [0,0,1, 1,0,1, 2,0,1, 3,0,1],
    [0,2,1, 1,2,1, 2,2,1, 3,2,1],
    [0,0,1, 1,1,1, 2,2,1, 3,3,1],
    [3,0,1, 2,1,1, 1,2,1, 0,3,1],
    [3,0,1, 2,1,2, 2,1,1, 1,2,2, 1,2,2, 1,2,1, 0,3,2, 0,3,2, 0,3,2, 0,3,1]
  ];
  for (var i = 0; i < testcases_win.length; ++i) {
    this.clearPills();
    var test = testcases_win[i];
    for (var j = 0; j < test.length; j += 3) {
      var z = this.placePill(test[j], test[j+1], test[j+2], 1);
      render();
      var win = this.winDetect(test[j], test[j+1], z);
      if (!win == (j == test.length-3)) {
	if (win) {
	  console.error("Premature win after "+(1+j/3)+" placements:",win);
	  console.log(test);
	} else {
	  console.error("No win detected");
	  console.log(test);
	}
      }
    }
  }
};

function boardtest() {
  board.winTest();
}
