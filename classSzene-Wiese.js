class classSzene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xeeeeee, 1, 1000);
    this.scene.background = new THREE.Color(0xeeeeee);

    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1,
      20000
    );
    
    // Get dimensions from window.SimulationEinstellungen if available, otherwise use defaults
    const dimensions = window.SimulationEinstellungen ? window.SimulationEinstellungen.dimensions : { x: 100, y: 100, z: 100 };
    
    // Calculate camera position based on dimensions
    const cameraDistance = Math.max(dimensions.x, dimensions.y, dimensions.z) * 1.3;
    this.camera.position.set(cameraDistance, cameraDistance, cameraDistance / 4);
    
    // Set lookAt to center of the simulation space
    const centerX = dimensions.x / 2;
    const centerY = dimensions.y / 2;
    const centerZ = dimensions.z / 2;
    this.camera.lookAt(centerX, centerY, centerZ);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    // Set orbit controls target to match camera lookAt
    this.controls.target.set(centerX, centerY, centerZ);

    this.setupLights();
    this.setupGround();
    this.setupHelperBox();
    this.setupWhiteSphere();
    
    this.updateObjects = [];

    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Initialize scene settings
    this.setupSceneSettings();
    
    // Create the scene window but hide it
    this.createSceneWindow();
    this.sceneWindow.hide();
  }

  setupSceneSettings() {
    this.titel = "Szene";
    
    // Register in menu
    MENU.register_to_MENU({
      MENU_Name: this.titel,
      MENU_Klick: this.openSceneSettings.bind(this)
    });
  }

  setupWhiteSphere() {
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.1
    });
    this.whiteSphere = new THREE.Mesh(geometry, material);
    this.whiteSphere.position.set(0, 0, 0);
    this.whiteSphere.castShadow = true;
    this.whiteSphere.receiveShadow = true;
    this.scene.add(this.whiteSphere);
  }

  createSceneWindow() {
    // Get current fog values
    const currentFogColor = this.scene.fog ? '#' + this.scene.fog.color.getHexString() : '#eeeeee';
    const currentFogNear = this.scene.fog ? this.scene.fog.near : 1;
    const currentFogFar = this.scene.fog ? this.scene.fog.far : 1000;

    let htmlContent = `
      <form>
        <fieldset>
          <legend>Nebel (Fog)</legend>
          <label>
            <input type="checkbox" id="fogEnabled" ${this.scene.fog ? 'checked' : ''}>
            Nebel aktivieren
          </label><br>
          
          <label>
            Farbe: 
            <input type="color" id="fogColor" value="${currentFogColor}">
          </label><br>
          
          <label>
            Start: <span id="fogNearValue">${currentFogNear}</span><br>
            <input type="range" id="fogNear" min="0" max="1000" value="${currentFogNear}">
          </label><br>
          
          <label>
            Ende: <span id="fogFarValue">${currentFogFar}</span><br>
            <input type="range" id="fogFar" min="0" max="5000" value="${currentFogFar}">
          </label>
        </fieldset>
      </form>`;

    this.sceneWindow = new WinBox({
      title: this.titel,
      width: '300px',
      height: '250px',
      html: htmlContent,
      class: ["no-max","no-close", "no-full"],
      x: "center",
      y: "center",
      onclose: () => {
        // Hide instead of destroying
        this.sceneWindow.hide();
      },
      oncreate: () => {
        // Event Listeners
        document.getElementById('fogEnabled').addEventListener('change', (e) => {
          if (e.target.checked) {
            const color = document.getElementById('fogColor').value;
            const near = parseFloat(document.getElementById('fogNear').value);
            const far = parseFloat(document.getElementById('fogFar').value);
            this.scene.fog = new THREE.Fog(color, near, far);
            this.scene.background = new THREE.Color(color); // Update background color
          } else {
            this.scene.fog = null;
          }
        });

        document.getElementById('fogColor').addEventListener('input', (e) => {
          if (this.scene.fog) {
            const color = e.target.value;
            this.scene.fog.color.set(color);
            this.scene.background.set(color); // Update background color
          }
        });

        document.getElementById('fogNear').addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          document.getElementById('fogNearValue').textContent = value;
          if (this.scene.fog) {
            this.scene.fog.near = value;
          }
        });

        document.getElementById('fogFar').addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          document.getElementById('fogFarValue').textContent = value;
          if (this.scene.fog) {
            this.scene.fog.far = value;
          }
        });
      }
    });
  }

  openSceneSettings() {
    if (this.sceneWindow) {
      if (this.sceneWindow.hidden) {
        this.sceneWindow.show();
      } else {
        this.sceneWindow.hide();
      }
    }
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(this.ambientLight);

    this.light1 = new THREE.PointLight(0xffffff, 1, 2000);
    this.light1.position.set(150, 500, 160);
    this.light1.castShadow = true;
    this.light1.shadow.mapSize.width = 1024;
    this.light1.shadow.mapSize.height = 1024;
    this.light1.shadow.radius = 4;
    this.light1.shadow.bias = -0.001;
    this.scene.add(this.light1);

    this.light2 = new THREE.PointLight(0xffffff, 0.3, 2000);
    this.light2.position.set(-150, -100, 50);
    this.scene.add(this.light2);
  }

  setupGround() {
    this.textureLoader = new THREE.TextureLoader();
    this.groundTexture = this.textureLoader.load(
      'https://threejs.org/examples/textures/terrain/grasslight-big.jpg'
    );
    this.groundTexture.wrapS = this.groundTexture.wrapT = THREE.RepeatWrapping;
    this.groundTexture.repeat.set(100, 100);

    this.groundMaterial = new THREE.MeshStandardMaterial({
      map: this.groundTexture,
      transparent: true,
      opacity: 1
    });
    this.groundMaterial.side = THREE.DoubleSide;

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(3000, 3000),
      this.groundMaterial
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  setupHelperBox() {
    if (this.helperBox) {
      this.scene.remove(this.helperBox);
    }

    // Get dimensions from window.SimulationEinstellungen if available, otherwise use defaults
    const dimensions = window.SimulationEinstellungen ? window.SimulationEinstellungen.dimensions : { x: 100, y: 100, z: 100 };

    const vertices = new Float32Array([
      0, 0, 0,  dimensions.x, 0, 0,  dimensions.x, dimensions.y, 0,  0, dimensions.y, 0,  // front
      0, 0, dimensions.z,  dimensions.x, 0, dimensions.z,  dimensions.x, dimensions.y, dimensions.z,  0, dimensions.y, dimensions.z,  // back
    ]);

    const indices = [
      0, 1, 2,  2, 3, 0,  // front
      1, 5, 6,  6, 2, 1,  // right
      5, 4, 7,  7, 6, 5,  // back
      4, 0, 3,  3, 7, 4,  // left
      3, 2, 6,  6, 7, 3,  // top
      4, 5, 1,  1, 0, 4   // bottom
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    this.helperBox = new THREE.Mesh(geometry, material);

    this.scene.add(this.helperBox);

    // Update camera position based on dimensions
    const cameraDistance = Math.max(dimensions.x, dimensions.y, dimensions.z) * 1.3;
    this.camera.position.set(cameraDistance, cameraDistance, cameraDistance / 2);
    
    // Update lookAt to center of simulation space
    const centerX = dimensions.x / 2;
    const centerY = dimensions.y / 2;
    const centerZ = dimensions.z / 2;
    this.camera.lookAt(centerX, centerY, centerZ);
    
    // Update orbit controls target
    this.controls.target.set(centerX, centerY, centerZ);
  }

  registerUpdateObject(obj) {
    if (typeof obj.update === 'function') {
      this.updateObjects.push(obj);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    
    if (this.camera.position.y < 0) {
      this.groundMaterial.opacity = 0.6;
    } else {
      this.groundMaterial.opacity = 1;
    }
    
    this.renderer.render(this.scene, this.camera);

    this.updateObjects.forEach((obj) => obj.update());
  }
}