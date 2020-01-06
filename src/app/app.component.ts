import { Component, AfterViewInit } from '@angular/core';
import * as THREEAR from "threear";
import * as THREE from "three";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'app';

  private _loadModel: boolean;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(queryParams => {
      this._loadModel = queryParams.get("loadModel") == "true";
    })
  }

  ngAfterViewInit() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setClearColor(new THREE.Color('lightgrey'), 0)
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0px'
    renderer.domElement.style.left = '0px'
    document.getElementById('content').appendChild(renderer.domElement);

    // Initialise the scene
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xcccccc));

    // Initialise the camera
    const camera = new THREE.Camera();
    scene.add(camera);

    // Initialise the group
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    // Initialise the source
    var source = new THREEAR.Source({ renderer, camera });

    THREEAR.initialize({ source: source }).then((controller) => {

      var mesh: any;

      if (!this._loadModel) {
        // Add a torus knot geometry      
        const geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
        const material = new THREE.MeshNormalMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.5
        markerGroup.add(mesh);
      } else {
        // Load a model
        var mtlLoader = new MTLLoader();
        mtlLoader.setPath('assets/materials/');
        mtlLoader.load('fish-2.mtl', (materials) => {
          materials.preload();
          var objLoader = new OBJLoader();
          objLoader.setMaterials(materials);
          objLoader.setPath('assets/models/');
          objLoader.load('fish-2.obj', (group) => {
            mesh = group.children[0];
            mesh.material.side = THREE.DoubleSide;
            mesh.position.y = 0.25;
            mesh.scale.set(0.25, 0.25, 0.25);
            markerGroup.add(mesh);
          });
        });
      }

      var patternMarker = new THREEAR.PatternMarker({
        patternUrl: 'assets/markers/hiro.patt', // The path of the hiro pattern
        markerObject: markerGroup,
        minConfidence: 0.4 // The confidence level before the marker should be shown
      });
      // Start to track the pattern marker
      controller.trackMarker(patternMarker);

      // Run the rendering loop
      let lastTimeMilliseconds = 0;
      requestAnimationFrame(function animate(nowMsec) {
        // Keep looping
        requestAnimationFrame(animate);
        // Measure time
        lastTimeMilliseconds = lastTimeMilliseconds || nowMsec - 1000 / 60;
        const deltaMillisconds = Math.min(200, nowMsec - lastTimeMilliseconds);
        lastTimeMilliseconds = nowMsec;
        // Call each update function
        controller.update(source.domElement);
        // Set the object rotation
        if (mesh) {
          mesh.rotation.y += deltaMillisconds / 1000 * Math.PI;
        }
        renderer.render(scene, camera);
      });

    });
  }

}
