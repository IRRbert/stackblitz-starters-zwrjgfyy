class classSzene {
  constructor() {
    // Initialize the texture loader first
    this.textureLoader = new THREE.TextureLoader();
    
    // Default settings path
    this.defaultSettingsPath = 'szene/default.json';
    
    this.scene = new THREE.Scene();
    const fogColor = new THREE.Color(5/255, 18/255, 18/255);
    this.scene.fog = new THREE.Fog(fogColor, 1, 1000);
    this.scene.background = fogColor;

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
    
    // Shadow settings - disabled by default
    this.shadowsEnabled = false;
    this.shadowQuality = 1024; // Default shadow map size
    this.renderer.shadowMap.enabled = this.shadowsEnabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    // Set orbit controls target to match camera lookAt
    this.controls.target.set(centerX, centerY, centerZ);

    // Initialize helper box visibility - set to true by default
    this.helperBoxVisible = true;
    
    // Initialize ground visibility and texture type
    this.groundVisible = false;
    this.groundTextureType = 'grass'; // 'grass' or 'seabed'

    // Store texture URLs and initialize textures object
    this.textureUrls = {
      grass: 'texture/grasslight-big.jpg',
      seabed: 'texture/Meeresboden.jpg'
    };
    this.textures = {};

    this.setupLights();
    this.setupGround();
    this.setupHelperBox();
    this.setupWhiteSphere();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Initialize scene settings
    this.setupSceneSettings();
    
    // Create the scene window but hide it
    this.createSceneWindow();
    this.sceneWindow.hide();

    // Load default settings
    this.loadDefaultSettings();
  }

  loadDefaultSettings() {
    fetch(this.defaultSettingsPath)
      .then(response => response.json())
      .then(settings => {
        this.applySettings(settings);
        this.updateSettingsUI();
      })
      .catch(error => console.error('Error loading default settings:', error));
  }

  applySettings(settings) {
    // Apply fog settings
    if (settings.fog) {
      if (settings.fog.enabled) {
        const fogColor = new THREE.Color(settings.fog.color);
        this.scene.fog = new THREE.Fog(fogColor, settings.fog.near, settings.fog.far);
        this.scene.background = fogColor;
      } else {
        this.scene.fog = null;
      }
    }

    // Apply shadow settings
    if (settings.shadows) {
      this.shadowsEnabled = settings.shadows.enabled;
      this.shadowQuality = settings.shadows.quality;
      this.updateShadowSettings();
    }

    // Apply helper box settings
    if (settings.helperGrid !== undefined) {
      this.helperBoxVisible = settings.helperGrid.visible;
      if (this.helperBox) {
        this.helperBox.visible = this.helperBoxVisible;
      }
    }

    // Apply ground settings
    if (settings.ground) {
      this.groundVisible = settings.ground.visible;
      this.groundTextureType = settings.ground.textureType;
      if (this.ground) {
        this.ground.visible = this.groundVisible;
      }
      if (this.groundVisible) {
        this.loadTexture(this.groundTextureType);
      }
    }

    // Apply time slice settings
    if (settings.timeSlice && window.SIMULATION) {
      window.SIMULATION.timeSlice = settings.timeSlice.value;
    }

    // Apply camera settings
    if (settings.camera) {
      if (settings.camera.position) {
        this.camera.position.set(
          settings.camera.position.x,
          settings.camera.position.y,
          settings.camera.position.z
        );
      }
      if (settings.camera.target) {
        this.controls.target.set(
          settings.camera.target.x,
          settings.camera.target.y,
          settings.camera.target.z
        );
        this.controls.update();
      }
    }
  }

  updateSettingsUI() {
    if (!this.sceneWindow) return;

    // Update fog controls
    const fogEnabled = document.getElementById('fogEnabled');
    const fogColor = document.getElementById('fogColor');
    const fogNear = document.getElementById('fogNear');
    const fogFar = document.getElementById('fogFar');
    
    if (fogEnabled && this.scene.fog) {
      fogEnabled.checked = true;
      fogColor.value = '#' + this.scene.fog.color.getHexString();
      fogNear.value = this.scene.fog.near;
      fogFar.value = this.scene.fog.far;
      document.getElementById('fogNearValue').textContent = this.scene.fog.near;
      document.getElementById('fogFarValue').textContent = this.scene.fog.far;
    }

    // Update shadow controls
    const shadowsEnabled = document.getElementById('shadowsEnabled');
    const shadowQuality = document.getElementById('shadowQuality');
    if (shadowsEnabled && shadowQuality) {
      shadowsEnabled.checked = this.shadowsEnabled;
      shadowQuality.value = this.shadowQuality;
      document.getElementById('shadowQualityValue').textContent = this.shadowQuality;
    }

    // Update helper grid control
    const helperGridEnabled = document.getElementById('helperGridEnabled');
    if (helperGridEnabled) {
      helperGridEnabled.checked = this.helperBoxVisible;
    }

    // Update ground controls
    const groundEnabled = document.getElementById('groundEnabled');
    const groundTexture = document.getElementById('groundTexture');
    if (groundEnabled && groundTexture) {
      groundEnabled.checked = this.groundVisible;
      groundTexture.value = this.groundTextureType;
    }

    // Update time slice control
    const timeSlice = document.getElementById('timeSlice');
    const timeSliceValue = document.getElementById('timeSliceValue');
    if (timeSlice && timeSliceValue && window.SIMULATION) {
      timeSlice.value = window.SIMULATION.timeSlice;
      timeSliceValue.textContent = window.SIMULATION.timeSlice;
    }
  }

  saveSettings() {
    const settings = {
      fog: this.scene.fog ? {
        enabled: true,
        color: '#' + this.scene.fog.color.getHexString(),
        near: this.scene.fog.near,
        far: this.scene.fog.far
      } : {
        enabled: false
      },
      shadows: {
        enabled: this.shadowsEnabled,
        quality: this.shadowQuality
      },
      helperGrid: {
        visible: this.helperBoxVisible
      },
      ground: {
        visible: this.groundVisible,
        textureType: this.groundTextureType
      },
      timeSlice: {
        value: window.SIMULATION ? window.SIMULATION.timeSlice : 16
      },
      camera: {
        position: {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z
        },
        target: {
          x: this.controls.target.x,
          y: this.controls.target.y,
          z: this.controls.target.z
        }
      }
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  loadSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const settings = JSON.parse(e.target.result);
            this.applySettings(settings);
            this.updateSettingsUI();
          } catch (error) {
            console.error('Error parsing settings file:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  createSceneWindow() {
    // Get current fog values
    const currentFogColor = this.scene.fog ? '#' + this.scene.fog.color.getHexString() : '#051212';
    const currentFogNear = this.scene.fog ? this.scene.fog.near : 1;
    const currentFogFar = this.scene.fog ? this.scene.fog.far : 1000;
    const currentTimeSlice = window.SIMULATION ? window.SIMULATION.timeSlice : 16;

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
            <input type="range" id="fogNear" min="-5000" max="5000" value="${currentFogNear}">
          </label><br>
          
          <label>
            Ende: <span id="fogFarValue">${currentFogFar}</span><br>
            <input type="range" id="fogFar" min="-5000" max="5000" value="${currentFogFar}">
          </label>
        </fieldset>
        
        <fieldset>
          <legend>Schatten</legend>
          <label>
            <input type="checkbox" id="shadowsEnabled" ${this.shadowsEnabled ? 'checked' : ''}>
            Schatten aktivieren
          </label><br>
          <label>
            Qualität: <span id="shadowQualityValue">${this.shadowQuality}</span><br>
            <input type="range" id="shadowQuality" min="256" max="4096" step="256" value="${this.shadowQuality}">
          </label>
        </fieldset>

        <fieldset>
          <legend>Hilfsraster</legend>
          <label>
            <input type="checkbox" id="helperGridEnabled" ${this.helperBoxVisible ? 'checked' : ''}>
            Hilfsraster anzeigen
          </label>
        </fieldset>

        <fieldset>
          <legend>Boden</legend>
          <label>
            <input type="checkbox" id="groundEnabled" ${this.groundVisible ? 'checked' : ''}>
            Boden anzeigen
          </label><br>
          <label>
            Textur:
            <select id="groundTexture">
              <option value="grass" ${this.groundTextureType === 'grass' ? 'selected' : ''}>Wiese</option>
              <option value="seabed" ${this.groundTextureType === 'seabed' ? 'selected' : ''}>Meeresboden</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Simulation</legend>
          <label>
            Zeitscheibe: <span id="timeSliceValue">${currentTimeSlice}</span>ms<br>
            <input type="range" id="timeSlice" min="1" max="1000" value="${currentTimeSlice}">
          </label>
        </fieldset>

        <fieldset>
          <legend>Einstellungen</legend>
          <div style="text-align: center;">
            <button type="button" id="saveSettingsBtn">Speichern</button>
            <button type="button" id="loadSettingsBtn">Laden</button>
          </div>
        </fieldset>
      </form>`;

    const { width: contentWidth, height: contentHeight } = measureContentSize(htmlContent);
    const windowWidth = contentWidth + 24;
    const windowHeight = contentHeight + 60;

    this.sceneWindow = new WinBox({
      title: this.titel,
      width: windowWidth + 'px',
      height: windowHeight + 'px',
      html: htmlContent,
      class: ["no-max", "no-close", "no-full", "no-min"],
      x: "center",
      y: "center",
      onclose: () => {
        this.sceneWindow.hide();
      },
      oncreate: () => {
        // Add custom close button to the title bar after WinBox is fully created
        setTimeout(() => {
          if (this.sceneWindow && this.sceneWindow.dom) {
            const titleBar = this.sceneWindow.dom.querySelector('.wb-title');
            if (titleBar) {
              const closeBtn = document.createElement('span');
              closeBtn.innerHTML = '×';
              closeBtn.className = 'custom-close-btn';
              closeBtn.style.cssText = 'position: absolute; right: 10px; top: 0; cursor: pointer; font-size: 20px;';
              closeBtn.addEventListener('click', () => {
                this.sceneWindow.hide();
              });
              titleBar.appendChild(closeBtn);
            }
          }
        }, 100);

        // Settings buttons event listeners
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('loadSettingsBtn').addEventListener('click', () => this.loadSettings());
        
        // Event Listeners for Fog
        document.getElementById('fogEnabled').addEventListener('change', (e) => {
          if (e.target.checked) {
            const color = document.getElementById('fogColor').value;
            const near = parseFloat(document.getElementById('fogNear').value);
            const far = parseFloat(document.getElementById('fogFar').value);
            this.scene.fog = new THREE.Fog(color, near, far);
            this.scene.background = new THREE.Color(color);
          } else {
            this.scene.fog = null;
          }
        });

        document.getElementById('fogColor').addEventListener('input', (e) => {
          if (this.scene.fog) {
            const color = e.target.value;
            this.scene.fog.color.set(color);
            this.scene.background.set(color);
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
        
        // Event Listener for Shadows
        document.getElementById('shadowsEnabled').addEventListener('change', (e) => {
          this.shadowsEnabled = e.target.checked;
          this.updateShadowSettings();
        });

        // Event Listener for Shadow Quality
        document.getElementById('shadowQuality').addEventListener('input', (e) => {
          this.shadowQuality = parseInt(e.target.value);
          document.getElementById('shadowQualityValue').textContent = this.shadowQuality;
          this.updateShadowSettings();
        });

        // Event Listener for Helper Grid
        document.getElementById('helperGridEnabled').addEventListener('change', (e) => {
          this.helperBoxVisible = e.target.checked;
          if (this.helperBox) {
            this.helperBox.visible = this.helperBoxVisible;
          }
        });

        // Event Listener for Ground
        document.getElementById('groundEnabled').addEventListener('change', (e) => {
          this.groundVisible = e.target.checked;
          if (this.ground) {
            this.ground.visible = this.groundVisible;
          }
          if (this.groundVisible && !this.textures[this.groundTextureType]) {
            this.loadTexture(this.groundTextureType);
          }
        });

        // Event Listener for Ground Texture
        document.getElementById('groundTexture').addEventListener('change', (e) => {
          this.groundTextureType = e.target.value;
          if (this.groundVisible) {
            this.loadTexture(this.groundTextureType);
          }
        });

        // Event Listener for Time Slice
        document.getElementById('timeSlice').addEventListener('input', (e) => {
          const value = parseInt(e.target.value);
          document.getElementById('timeSliceValue').textContent = value;
          if (window.SIMULATION) {
            window.SIMULATION.timeSlice = value;
          }
        });
      }
    });
  }

  setupSceneSettings() {
    this.titel = "Szene";
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
    this.whiteSphere.castShadow = this.shadowsEnabled;
    this.whiteSphere.receiveShadow = this.shadowsEnabled;
    this.scene.add(this.whiteSphere);
  }

  loadTexture(textureType) {
    if (!this.textures[textureType]) {
      this.textureLoader.load(this.textureUrls[textureType], (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(9, 9);
        this.textures[textureType] = texture;
        this.updateGroundTexture();
      });
    } else {
      this.updateGroundTexture();
    }
  }
  
  updateGroundTexture() {
    if (this.textures[this.groundTextureType]) {
      this.groundMaterial.map = this.textures[this.groundTextureType];
      this.groundMaterial.needsUpdate = true;
    }
  }
  
  updateShadowSettings() {
    this.renderer.shadowMap.enabled = this.shadowsEnabled;
    
    if (this.light1) {
      this.scene.remove(this.light1);
    }
    
    this.light1 = new THREE.PointLight(0xffffff, 1, 2000);
    this.light1.position.set(150, 500, 160);
    this.light1.castShadow = this.shadowsEnabled;
    this.light1.shadow.mapSize.width = this.shadowQuality;
    this.light1.shadow.mapSize.height = this.shadowQuality;
    this.light1.shadow.radius = 4;
    this.light1.shadow.bias = -0.001;
    this.scene.add(this.light1);
    
    this.renderer.shadowMap.needsUpdate = true;
    
    if (this.ground) {
      this.ground.receiveShadow = this.shadowsEnabled;
    }
    
    if (this.whiteSphere) {
      this.whiteSphere.castShadow = this.shadowsEnabled;
      this.whiteSphere.receiveShadow = this.shadowsEnabled;
    }
    
    if (window.SIMULATION) {
      if (window.SIMULATION.fishInstancedMesh) {
        window.SIMULATION.fishInstancedMesh.castShadow = this.shadowsEnabled;
        window.SIMULATION.fishInstancedMesh.receiveShadow = this.shadowsEnabled;
      }
      
      if (window.SIMULATION.sharkInstancedMesh) {
        window.SIMULATION.sharkInstancedMesh.castShadow = this.shadowsEnabled;
        window.SIMULATION.sharkInstancedMesh.receiveShadow = this.shadowsEnabled;
      }
    }
  }

  openSceneSettings() {
    if (this.sceneWindow) {
      if (this.sceneWindow.hidden) {
        this.sceneWindow.show();
        this.sceneWindow.focus();
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
    this.light1.castShadow = this.shadowsEnabled;
    this.light1.shadow.mapSize.width = this.shadowQuality;
    this.light1.shadow.mapSize.height = this.shadowQuality;
    this.light1.shadow.radius = 4;
    this.light1.shadow.bias = -0.001;
    this.scene.add(this.light1);

    this.light2 = new THREE.PointLight(0xffffff, 0.3, 2000);
    this.light2.position.set(-150, -100, 50);
    this.scene.add(this.light2);
  }

  setupGround() {
    this.groundMaterial = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 1
    });
    this.groundMaterial.side = THREE.DoubleSide;

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(3000, 3000),
      this.groundMaterial
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = this.shadowsEnabled;
    this.ground.visible = this.groundVisible;
    this.scene.add(this.ground);
  }

  setupHelperBox() {
    if (this.helperBox) {
      this.scene.remove(this.helperBox);
    }

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
    this.helperBox.visible = this.helperBoxVisible;

    this.scene.add(this.helperBox);

    const cameraDistance = Math.max(dimensions.x, dimensions.y, dimensions.z) * 1.3;
    this.camera.position.set(cameraDistance, cameraDistance, cameraDistance / 2);
    
    const centerX = dimensions.x / 2;
    const centerY = dimensions.y / 2;
    const centerZ = dimensions.z / 2;
    this.camera.lookAt(centerX, centerY, centerZ);
    
    this.controls.target.set(centerX, centerY, centerZ);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  registerUpdateObject(object) {
    // This method is called when a new simulation is created
    // We don't need to do anything special here since the simulation
    // is already added to the scene when it's created
  }
}