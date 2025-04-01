import { OrthographicCamera, Scene, Raycaster, WebGLRenderer, Vector2, Color, DirectionalLight, BoxGeometry, Mesh, MeshLambertMaterial, MathUtils, PlaneGeometry, CircleGeometry, GridHelper, Vector3 } from 'three';

import Stats from 'three/addons/libs/stats.module.js';

let stats: Stats;
let camera: OrthographicCamera, scene: Scene, raycaster: Raycaster, renderer: WebGLRenderer;

let theta = 0;
let SELECTED: (Mesh<BoxGeometry, MeshLambertMaterial> & { currentHex: number }) | null = null;
let SELECTED_OFFSET: Vector2 | null = null;

const pointer = new Vector2();
const radius = 50;
const frustumSize = 60;
// const windowWidth = 1280;
// const windowHeight = 720;


init();

function init() {
  
  const canvas = document.querySelector('#c') as HTMLCanvasElement;
  renderer = new WebGLRenderer( { antialias: true, canvas: canvas } );
  renderer.setAnimationLoop( animate );
  const aspect = canvas.clientWidth / canvas.clientHeight;

  camera = new OrthographicCamera( frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 0.1, 100 );

  scene = new Scene();
  scene.background = new Color( 0xf0f0f0 );

  const gridNo = 60;
  const gridHelper = new GridHelper( gridNo, gridNo, 0xbbbbbb, 0xbbbbbb );
  gridHelper.rotateX( MathUtils.degToRad( 90 ) );
  gridHelper.position.set( 0, 0, 0.01 );
  scene.add( gridHelper );

  const light = new DirectionalLight( 0xffffff, 3 );
  light.position.set( 1, 1, 1 ).normalize();
  scene.add( light );

  makeBoard(scene);
  addButtons(scene);

  raycaster = new Raycaster();

  stats = new Stats();
  document.body.appendChild( stats.dom );

  document.addEventListener( 'pointermove', onPointerMove );
  document.addEventListener( 'pointerdown', onPointerDown );
  document.addEventListener( 'pointerup', onPointerUp );
  document.addEventListener( 'pointerleave', onPointerUp );
  document.addEventListener( 'pointercancel', onPointerUp );

  //

  window.addEventListener( 'resize', onWindowResize );

}

function addButtons(scene: Scene) {
  const labelContainerElem = document.querySelector('#labels');
  if (!labelContainerElem) {
    console.error('Label container element not found');
    return;
  }
  const baseSizes = [25, 28, 32, 40, 50, 60, 70, 80, 90, 100, 120];
  const redColor = 0xff2400;
  const blueColor = 0x3090ff;

  baseSizes.forEach((size, index) => {
    createButton(scene, redColor, size, new Vector2(36, 25 - index * 5));
    createButton(scene, blueColor, size, new Vector2(-36, 25 - index * 5));
  });
}

function createButton(scene: Scene, color: number, size: number, position: Vector2) {
  const button = new Mesh(new PlaneGeometry(8, 4), new MeshLambertMaterial({ color }));
  button.position.set(position.x, position.y, 1); // Position the box slightly above the ground
  button.userData.button = true; // Custom property to identify the button
  button.userData.onClick = () => {
    const newModel = new Mesh(
      new CircleGeometry(base(size)),
      new MeshLambertMaterial({ color })
    );
    newModel.position.set(0, 0, 1); // Position the model slightly above the ground
    newModel.userData.model = true; // Custom property to identify the model
    scene.add(newModel);
    console.log(`${size}mm button clicked`);
  };

  const labelContainerElem = document.querySelector('#labels');
  if (labelContainerElem) {
    const elem = document.createElement('div');
    elem.textContent = `${size}mm`;
    const tempV = new Vector3(position.x, position.y, 1);
    tempV.project(camera);
    const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (tempV.y * -0.5 + 0.5) * window.innerHeight;
    elem.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    labelContainerElem.appendChild(elem);
  }

  scene.add(button);
}

function makeBoard(scene: Scene) {
  const gameBoard = new Mesh(new PlaneGeometry( 60, 44 ), new MeshLambertMaterial( { color: 0xffffff } ) );
  scene.add(gameBoard);

  const borderTop = new Mesh(new PlaneGeometry( 120, 16 ), new MeshLambertMaterial( { color: 0xdddddd } ) );
  borderTop.position.set( 0, 30, 1 );
  scene.add(borderTop);

  const borderBottom = new Mesh(new PlaneGeometry( 120, 16 ), new MeshLambertMaterial( { color: 0xdddddd } ) );
  borderBottom.position.set( 0, -30, 1 );
  scene.add(borderBottom);

  const borderLeft = new Mesh(new PlaneGeometry( 32, 120 ), new MeshLambertMaterial( { color: 0xdddddd } ) );
  borderLeft.position.set(-46, 0, 1);
  scene.add(borderLeft);

  const borderRight = new Mesh(new PlaneGeometry( 32, 120 ), new MeshLambertMaterial( { color: 0xdddddd } ) );
  borderRight.position.set(46, 0, 1);
  scene.add(borderRight);

  const terrainFootprints = [
    { width: 6, height: 4, x: 0, y: 19, rotation: 90, color: 0xaaffaa },
    { width: 6, height: 4, x: 0, y: -19, rotation: 90, color: 0xaaffaa },
    { width: 6, height: 4, x: 7.05, y: -0.71, rotation: 45, color: 0xaaffaa },
    { width: 6, height: 4, x: -7.05, y: 0.71, rotation: 45, color: 0xaaffaa },
    { width: 10, height: 5, x: -5.3, y: 6.74, rotation: -45, color: 0xaaffaa },
    { width: 10, height: 5, x: 5.3, y: -6.74, rotation: -45, color: 0xaaffaa },
    { width: 12, height: 6, x: 21, y: -11, rotation: 90, color: 0xaaffaa },
    { width: 12, height: 6, x: -21, y: 11, rotation: 90, color: 0xaaffaa },
    { width: 12, height: 6, x: 11, y: 12, rotation: 90, color: 0xaaffaa },
    { width: 12, height: 6, x: -11, y: -12, rotation: 90, color: 0xaaffaa },
    { width: 12, height: 6, x: 20, y: 3, rotation: 0, color: 0xaaffaa },
    { width: 12, height: 6, x: -20, y: -3, rotation: 0, color: 0xaaffaa },
  ];

  terrainFootprints.forEach(({ width, height, x, y, rotation }) => {
    const footprint = new Mesh(
      new PlaneGeometry(width, height),
      new MeshLambertMaterial({ color: 0xFFDD54 })
    );
    footprint.position.set(x, y, 0.1); // Slightly above the game board to avoid z-fighting
    footprint.rotation.z = MathUtils.degToRad(rotation); // Apply rotation in degrees
    footprint.userData.terrain = true; // Custom property to identify terrain footprints
    scene.add(footprint);
  });
}

function onWindowResize() {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;
    camera.updateProjectionMatrix();
  }
}

function onPointerMove( event: MouseEvent ) {
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  
  const worldCords = new Vector3( pointer.x, pointer.y, 0 ).unproject( camera );
  if (SELECTED && SELECTED_OFFSET) {
    SELECTED.position.x = worldCords.x + SELECTED_OFFSET.x;
    SELECTED.position.y = worldCords.y + SELECTED_OFFSET.y;
  }
}

function onPointerDown( event: MouseEvent ) {
  raycaster.setFromCamera( pointer, camera );

  const intersects = raycaster.intersectObjects( scene.children, false );
  if ( intersects.length > 0 ) {
    for (const i of intersects) {
      if (i.object.userData.model) {
        SELECTED = i.object as Mesh<BoxGeometry, MeshLambertMaterial> & { currentHex: number };
        SELECTED_OFFSET = new Vector2(SELECTED.position.x - i.point.x, SELECTED.position.y - i.point.y);
      }
      if (i.object.userData.button) {
        if (i.object.userData.onClick) {
          i.object.userData.onClick(event);
        }
      }
    } 
  }
}

function onPointerUp() {
  SELECTED = null;
}

function animate() {
  render();
  stats.update();
}

function resizeRendererToDisplaySize(renderer: WebGLRenderer) {
  const canvas = renderer.domElement;
  renderer.setPixelRatio(window.devicePixelRatio);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function base(t: number): number {
  return t / 50.8;
}

function render() {

  // theta += 0.1;

  camera.position.x = radius * Math.sin( MathUtils.degToRad( theta ) );
  camera.position.y = radius * Math.sin( MathUtils.degToRad( theta ) );
  camera.position.z = radius * Math.cos( MathUtils.degToRad( theta ) );
  camera.lookAt( scene.position );

  camera.updateMatrixWorld();
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;
    camera.updateProjectionMatrix();
  }

  // find intersections

  // raycaster.setFromCamera( pointer, camera );

  // const intersects = raycaster.intersectObjects( scene.children, false );

  // if ( intersects.length > 0 ) {

  //   if ( INTERSECTED != intersects[ 0 ].object ) {
  //     if ( INTERSECTED ) {
  //       console.log( 'INTERSECTED', INTERSECTED );
  //       INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
  //     }

  //     INTERSECTED = intersects[ 0 ].object as Mesh<BoxGeometry, MeshLambertMaterial> & { currentHex: number };
  //     if ( INTERSECTED) {
  //       INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
  //       INTERSECTED.material.emissive.setHex( 0xc54423 );
  //     }

  //   }

  // } else {

  //   if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

  //   INTERSECTED = null;

  // }

  renderer.render( scene, camera );

}
