"use strict";

var camera, scene, geometry, material, renderer, board;

window.addEventListener('load', init);

var Player = {RED: 0, BLUE: 1};

function Board() {
  var scene = this.scene = new THREE.Scene();

  scene.addObject(Board.makeBoardMesh());

  for (var x = 0; x < 4; ++x) {
    for (var y = 0; y < 4; ++y) {
      scene.addObject(Board.makePin(x, y));
    }
  }

  var columns = this.columns = new Array(16);
  for (var i = 0; i < 16; ++i) {
    columns[i] = [];
  }

  this.placePill(0, 0, Player.BLUE);
  this.placePill(3, 3, Player.RED);
  this.placePill(3, 0, Player.BLUE);
  this.placePill(0, 3, Player.RED);
  this.placePill(2, 0, Player.BLUE);
  this.placePill(1, 0, Player.RED);
}

Board.prototype.placePill = function (x, y, ply) {
  var col = this.columns[y*4 + x];
  var z = col.length;
  var pill = Board.makePill(x, y, z, ply);
  this.scene.addObject(pill);
  col.push(pill);
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
  var material = new THREE.MeshBasicMaterial({ color: (ply == Player.RED) ? 0xFF0000 : 0x0000FF });
  var geometry = new THREE.CylinderGeometry(32, 100, 100, height-padding);
  var mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -90 * Math.PI / 180;
  mesh.position.x = x*300 - 450;
  mesh.position.z = y*300 - 450;
  mesh.position.y = height/2 + z*height;
  mesh.player = ply;
  return mesh;
};

Board.getPillType = function (x, y, z) {
  var col = this.columns[y*4+x];
  if (z >= col.length) return null;
  return col[z].player;
};

Board.winDetect = function (x, y, z) {
  var ply = this.getPillType(x, y, z);
  if (ply == null) {
    console.log("winDetect called on blank space: "+x+","+y+","+z);
  }
};
