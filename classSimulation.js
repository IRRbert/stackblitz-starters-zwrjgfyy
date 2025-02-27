class classSimulation {
  constructor(settings) {
    this.settings = settings;
    
    // Listen für Fische und Haie
    this.fishList = [];
    this.sharkList = [];
    
    // Nachbarschafts-Offsets basierend auf den UI-Einstellungen
    this.neighborOffsets = this.generateNeighborOffsets(settings.neighbors);
    
    // Zeitsteuerung für Simulationsschritte
    this.lastUpdateTime = Date.now();
    this.updateInterval = 10; // 1 Schritt pro Sekunde
    this.frameSkip = 0; // No frame skipping by default
    this.frameCounter = 0; // Counter for frame skipping
    
    // Initiale Platzierung der Kreaturen
    this.placeInitialCreatures();
  }

  /** Generiere Nachbarschafts-Offsets basierend auf den Einstellungen */
  generateNeighborOffsets(neighbors) {
    const offsets = [];
    if (neighbors.sides) {
      // Seiten-Nachbarn (6 Richtungen)
      offsets.push([-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]);
    }
    if (neighbors.edges) {
      // Kanten-Nachbarn (12 diagonale Richtungen in 2D)
      offsets.push([-1, -1, 0], [-1, 1, 0], [1, -1, 0], [1, 1, 0],
                   [-1, 0, -1], [-1, 0, 1], [1, 0, -1], [1, 0, 1],
                   [0, -1, -1], [0, -1, 1], [0, 1, -1], [0, 1, 1]);
    }
    if (neighbors.corners) {
      // Ecken-Nachbarn (8 diagonale Richtungen in 3D)
      offsets.push([-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
                   [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1]);
    }
    return offsets;
  }

  /** Platzieren der initialen Fische und Haie */
  placeInitialCreatures() {
    const { fish, shark } = this.settings;

    // Fische platzieren
    for (let i = 0; i < fish.count; i++) {
      const pos = this.findRandomEmptyPosition();
      if (pos) {
        const newFish = new Fish(pos, fish.birth);
        this.fishList.push(newFish);
        newFish.mesh = this.createFishMesh(pos);
        meine_szene.scene.add(newFish.mesh);
      }
    }

    // Haie platzieren
    for (let i = 0; i < shark.count; i++) {
      const pos = this.findRandomEmptyPosition();
      if (pos) {
        const newShark = new Shark(pos, shark.birth, shark.starve);
        this.sharkList.push(newShark);
        newShark.mesh = this.createSharkMesh(pos);
        meine_szene.scene.add(newShark.mesh);
      }
    }
  }

  /** Suche nach einer zufälligen, leeren Position */
  findRandomEmptyPosition() {
    const { x, y, z } = this.settings.dimensions;
    for (let attempts = 0; attempts < 1000; attempts++) {
      const pos = {
        x: Math.floor(Math.random() * x),
        y: Math.floor(Math.random() * y),
        z: Math.floor(Math.random() * z)
      };
      if (!this.isPositionOccupied(pos)) {
        return pos;
      }
    }
    return null; // Keine leere Position gefunden
  }

  /** Überprüfe, ob eine Position besetzt ist */
  isPositionOccupied(pos) {
    return this.fishList.some(f => f.pos.x === pos.x && f.pos.y === pos.y && f.pos.z === pos.z) ||
           this.sharkList.some(s => s.pos.x === pos.x && s.pos.y === pos.y && s.pos.z === pos.z);
  }

  /** Erstelle ein Mesh für einen Fisch (grüne Box) */
  createFishMesh(pos) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos.x, pos.y, pos.z);
    return mesh;
  }

  /** Erstelle ein Mesh für einen Hai (rote Box) */
  createSharkMesh(pos) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos.x, pos.y, pos.z);
    return mesh;
  }

  /** Update-Methode für die Simulation */
  update() {
    // Check if simulation is paused by the player
    if (window.PLAYER && !window.PLAYER.isPlaying) {
      return;
    }
    
    const now = Date.now();
    if (now - this.lastUpdateTime >= this.updateInterval) {
      // Handle frame skipping for turbo mode
      this.frameCounter++;
      if (this.frameSkip === 0 || this.frameCounter > this.frameSkip) {
        this.performSimulationStep();
        this.frameCounter = 0;
      }
      this.lastUpdateTime = now;
    }
  }

  /** Führe einen Simulationsschritt aus */
  performSimulationStep() {
    // Mische die Listen, um Bias zu vermeiden
    this.shuffleArray(this.fishList);
    this.shuffleArray(this.sharkList);

    // Verarbeite Fische
    for (let i = 0; i < this.fishList.length; i++) {
      const fish = this.fishList[i];
      const emptyNeighbors = this.getEmptyNeighbors(fish.pos);
      if (emptyNeighbors.length > 0) {
        const newPos = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
        this.moveCreature(fish, newPos);
        fish.age++;
        if (fish.age >= fish.birthTime) {
          fish.age = 0;
          const oldPos = { ...fish.pos }; // Kopie der alten Position
          if (!this.isPositionOccupied(oldPos)) {
            const newFish = new Fish(oldPos, fish.birthTime);
            this.fishList.push(newFish);
            newFish.mesh = this.createFishMesh(oldPos);
            meine_szene.scene.add(newFish.mesh);
          }
        }
      } else {
        fish.age++;
      }
    }

    // Verarbeite Haie
    for (let i = 0; i < this.sharkList.length; i++) {
      const shark = this.sharkList[i];
      const fishNeighbors = this.getFishNeighbors(shark.pos);
      if (fishNeighbors.length > 0) {
        const targetPos = fishNeighbors[Math.floor(Math.random() * fishNeighbors.length)];
        const eatenFish = this.fishList.find(f => f.pos.x === targetPos.x && f.pos.y === targetPos.y && f.pos.z === targetPos.z);
        this.fishList = this.fishList.filter(f => f !== eatenFish);
        meine_szene.scene.remove(eatenFish.mesh);
        this.moveCreature(shark, targetPos);
        shark.starveTimer = 0;
      } else {
        const emptyNeighbors = this.getEmptyNeighbors(shark.pos);
        if (emptyNeighbors.length > 0) {
          const newPos = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
          this.moveCreature(shark, newPos);
        }
      }
      shark.age++;
      shark.starveTimer++;
      if (shark.age >= shark.birthTime) {
        shark.age = 0;
        const oldPos = { ...shark.pos }; // Kopie der alten Position
        if (!this.isPositionOccupied(oldPos)) {
          const newShark = new Shark(oldPos, shark.birthTime, shark.starveTime);
          this.sharkList.push(newShark);
          newShark.mesh = this.createSharkMesh(oldPos);
          meine_szene.scene.add(newShark.mesh);
        }
      }
      if (shark.starveTimer >= shark.starveTime) {
        this.sharkList = this.sharkList.filter(s => s !== shark);
        meine_szene.scene.remove(shark.mesh);
      }
    }
  }

  /** Bewege eine Kreatur zu einer neuen Position */
  moveCreature(creature, newPos) {
    creature.pos = newPos;
    creature.mesh.position.set(newPos.x, newPos.y, newPos.z);
  }

  /** Finde leere Nachbarpositionen */
  getEmptyNeighbors(pos) {
    const neighbors = [];
    for (const offset of this.neighborOffsets) {
      let nx = pos.x + offset[0];
      let ny = pos.y + offset[1];
      let nz = pos.z + offset[2];
      let wrapped = false;
      if (this.settings.world_edge === 'verbunden') {
        nx = (nx + this.settings.dimensions.x) % this.settings.dimensions.x;
        ny = (ny + this.settings.dimensions.y) % this.settings.dimensions.y;
        nz = (nz + this.settings.dimensions.z) % this.settings.dimensions.z;
        wrapped = true;
      }
      if (wrapped || (nx >= 0 && nx < this.settings.dimensions.x &&
                      ny >= 0 && ny < this.settings.dimensions.y &&
                      nz >= 0 && nz < this.settings.dimensions.z)) {
        const neighborPos = { x: nx, y: ny, z: nz };
        if (!this.isPositionOccupied(neighborPos)) {
          neighbors.push(neighborPos);
        }
      }
    }
    return neighbors;
  }

  /** Finde Nachbarpositionen mit Fischen */
  getFishNeighbors(pos) {
    const neighbors = [];
    for (const offset of this.neighborOffsets) {
      let nx = pos.x + offset[0];
      let ny = pos.y + offset[1];
      let nz = pos.z + offset[2];
      let wrapped = false;
      if (this.settings.world_edge === 'verbunden') {
        nx = (nx + this.settings.dimensions.x) % this.settings.dimensions.x;
        ny = (ny + this.settings.dimensions.y) % this.settings.dimensions.y;
        nz = (nz + this.settings.dimensions.z) % this.settings.dimensions.z;
        wrapped = true;
      }
      if (wrapped || (nx >= 0 && nx < this.settings.dimensions.x &&
                      ny >= 0 && ny < this.settings.dimensions.y &&
                      nz >= 0 && nz < this.settings.dimensions.z)) {
        const neighborPos = { x: nx, y: ny, z: nz };
        if (this.fishList.some(f => f.pos.x === neighborPos.x && f.pos.y === neighborPos.y && f.pos.z === neighborPos.z)) {
          neighbors.push(neighborPos);
        }
      }
    }
    return neighbors;
  }

  /** Mische eine Liste zufällig */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /** Entferne alle Meshes aus der Szene (für Neustart) */
  removeFromScene() {
    this.fishList.forEach(f => meine_szene.scene.remove(f.mesh));
    this.sharkList.forEach(s => meine_szene.scene.remove(s.mesh));
  }
}

/** Klasse für Fische */
class Fish {
  constructor(pos, birthTime) {
    this.pos = pos; // { x, y, z }
    this.age = 0;
    this.birthTime = birthTime;
    this.mesh = null;
  }
}

/** Klasse für Haie */
class Shark {
  constructor(pos, birthTime, starveTime) {
    this.pos = pos; // { x, y, z }
    this.age = 0;
    this.starveTimer = 0;
    this.birthTime = birthTime;
    this.starveTime = starveTime;
    this.mesh = null;
  }
}