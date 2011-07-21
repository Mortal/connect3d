"use strict";

var scenewidth, sceneheight, camera, scene, geometry, material, renderer, board, mouse = {down: false}, camerapitch, camerayaw, projector;

window.addEventListener('load', init);

/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */

if ( !window.requestAnimationFrame ) {

  window.requestAnimationFrame = ( function() {

    return window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {

      window.setTimeout( callback, 1000 / 60 );

    };

  } )();

}


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

  this.hoverPin = null;

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

var camdist = 1600, camfov = 45;

function init() {
  var width = scenewidth = window.innerWidth-16, height = sceneheight = window.innerHeight-16;

  board = new Board();

  camera = new THREE.Camera(camfov, width / height, 1, 10000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);

  projector = new THREE.Projector();

  document.body.appendChild(renderer.domElement);

  setCameraPitchYaw(Math.PI/6, Math.PI/8);

  window.addEventListener('mousedown', mousedown);
  window.addEventListener('mousemove', mousemove);
  window.addEventListener('mouseup', mouseup);

  loop();
}

function loop() {
  window.requestAnimationFrame(loop); // call me again sometime!

  var hover = null;

  if ('undefined' != typeof mouse.x && !mouse.down) {
    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
    projector.unprojectVector( vector, camera );

    var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );

    hover = THREE.Collisions.rayCastNearest( ray );

    if (board.hoverPin != hover) {
      if (board.hoverPin) {
	board.hoverPin.mesh.materials[0].color.setHex(pincolor);
      }
      if (hover) {
	hover.mesh.materials[0].color.setHex(pinhovercolor);
      }
      board.hoverPin = hover;
    }
  }

  render();
}

function mousedown(event) {
  mouse.px = event.clientX;
  mouse.py = event.clientY;
  mouse.x = -1 + event.clientX / scenewidth * 2;
  mouse.y = 1 - event.clientY / sceneheight * 2;
  mouse.moved = false;
  mouse.down = true;
}

function mousemove(event) {
  if (mouse.down) {
    mouse.moved = true;
    var dx = mouse.px - event.clientX;
    var dy = mouse.py - event.clientY;
    camerapitch += Math.PI*dx/200;
    while (camerapitch < 0)
      camerapitch += 2*Math.PI;
    camerapitch %= 2*Math.PI;
    camerayaw += -Math.PI*dy/200;
    camerayaw = Math.min(Math.max(camerayaw, Math.PI/180), 89*Math.PI/180);
    setCameraPitchYaw(camerapitch, camerayaw);
  }
  mouse.px = event.clientX;
  mouse.py = event.clientY;
  mouse.x = -1 + event.clientX / scenewidth * 2;
  mouse.y = 1 - event.clientY / sceneheight * 2;
}

function mouseup(event) {
  if (mouse.down && !mouse.moved) {
    mouseclick(event);
  }
  mouse.down = false;
  mouse.px = event.clientX;
  mouse.py = event.clientY;
  mouse.x = -1 + event.clientX / scenewidth * 2;
  mouse.y = 1 - event.clientY / sceneheight * 2;
}

function mouseclick(event) {
  if (board.hoverPin) {
    place(board.hoverPin.x, board.hoverPin.y);
  }
}

function setCameraPitchYaw(pitch, yaw) {
  camerapitch = pitch;
  camerayaw = yaw;
  camera.position.x = camdist*Math.cos(yaw)*Math.sin(pitch);
  camera.position.z = camdist*Math.cos(yaw)*Math.cos(pitch);
  camera.position.y = camdist*Math.sin(yaw);
}

function render() {
  renderer.render(board.scene, camera);
}

var turn = Player.BLUE;

function place(x, y) {
  board.placePill(x, y, turn);
  turn = (turn == Player.BLUE) ? Player.RED : Player.BLUE;
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

var pincolor = 0xCCCC99;
var pinhovercolor = 0xFFFF99;

Board.makePin = function (x, y) {
  var r = 20; // radius
  var height = 400;
  var geometry = new THREE.CylinderGeometry(6, r, r, height);
  var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xCCCC99 }));
  mesh.rotation.x = -90 * Math.PI / 180;
  var px = mesh.position.x = x*300 - 450;
  var pz = mesh.position.z = y*300 - 450;
  var py = mesh.position.y = height/2;
  var coll = new THREE.CollisionUtils.MeshOBB(mesh);
  coll.x = x;
  coll.y = y;
  coll.mesh = mesh;
  THREE.Collisions.colliders.push(coll);
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
