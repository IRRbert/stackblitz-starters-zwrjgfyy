// classSimulation.js
class classSimulation {
    constructor(settings) {
        this.settings = settings;
        
        // Lists for fish and sharks
        this.fishList = [];
        this.sharkList = [];
        
        // Neighborhood offsets based on UI settings
        this.neighborOffsets = classWesen.generateNeighborOffsets(settings.neighbors);
        
        // Setup rendering
        this.setupInstancedMeshes();
        this.placeInitialCreatures();
        
        // Setup raycaster for mouse interaction
        this.raycaster = new THREE.Raycaster();
        
        // Add mouse move listener
        window.addEventListener('mousemove', (event) => {
            classWesen.onMouseMove(event, this);
        });

        // Initialize matrix for transformations
        this.matrix = new THREE.Matrix4();
        
        // Debug counter
        this.stepCounter = 0;

        // Time-slicing parameters
        this.timeSlice = 8; // Maximum time (ms) to process before yielding
        this.currentFishIndex = 0;
        this.currentSharkIndex = 0;
        this.processingFish = true; // true = processing fish, false = processing sharks
        this.stepInProgress = false;
        
        // Temporary storage for step results
        this.newFish = [];
        this.newSharks = [];
        this.deadFish = new Set();
        this.deadSharks = new Set();
    }

    setupInstancedMeshes() {
        this.boxGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        this.fishMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.sharkMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        
        const maxInstances = this.settings.dimensions.x * this.settings.dimensions.y * this.settings.dimensions.z;
        
        this.fishInstancedMesh = new THREE.InstancedMesh(
            this.boxGeometry,
            this.fishMaterial,
            maxInstances
        );
        this.fishInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.fishInstancedMesh.count = 0;
        
        if (meine_szene && meine_szene.shadowsEnabled) {
            this.fishInstancedMesh.castShadow = true;
            this.fishInstancedMesh.receiveShadow = true;
        }
        
        meine_szene.scene.add(this.fishInstancedMesh);
        
        this.sharkInstancedMesh = new THREE.InstancedMesh(
            this.boxGeometry,
            this.sharkMaterial,
            maxInstances
        );
        this.sharkInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.sharkInstancedMesh.count = 0;
        
        if (meine_szene && meine_szene.shadowsEnabled) {
            this.sharkInstancedMesh.castShadow = true;
            this.sharkInstancedMesh.receiveShadow = true;
        }
        
        meine_szene.scene.add(this.sharkInstancedMesh);
        
        this.matrix = new THREE.Matrix4();
    }

    placeInitialCreatures() {
        const { fish, shark } = this.settings;

        // Place fish
        for (let i = 0; i < fish.count; i++) {
            const pos = classWesen.findRandomEmptyPosition(this.settings, this.fishList, this.sharkList);
            if (pos) {
                const newFish = new classFisch(pos, fish.birth);
                newFish.setInstanceId(this.fishList.length);
                this.fishList.push(newFish);
                this.updateFishInstance(newFish);
            }
        }

        // Place sharks
        for (let i = 0; i < shark.count; i++) {
            const pos = classWesen.findRandomEmptyPosition(this.settings, this.fishList, this.sharkList);
            if (pos) {
                const newShark = new classHai(pos, shark.birth, shark.starve);
                newShark.setInstanceId(this.sharkList.length);
                this.sharkList.push(newShark);
                this.updateSharkInstance(newShark);
            }
        }
        
        this.fishInstancedMesh.count = this.fishList.length;
        this.sharkInstancedMesh.count = this.sharkList.length;
    }

    async performSimulationStep() {
        if (this.stepInProgress) {
            return; // Don't start a new step if one is in progress
        }

        this.stepInProgress = true;
        this.processingFish = true;
        this.currentFishIndex = 0;
        this.currentSharkIndex = 0;
        this.newFish = [];
        this.newSharks = [];
        this.deadFish = new Set();
        this.deadSharks = new Set();

        // Start the time-sliced processing
        await this.processTimeSlice();
    }

    async processTimeSlice() {
        const startTime = performance.now();
        
        if (this.processingFish) {
            // Process fish in chunks
            while (this.currentFishIndex < this.fishList.length) {
                const fish = this.fishList[this.currentFishIndex];
                if (!this.deadFish.has(fish)) {
                    this.processFish(fish);
                }
                
                this.currentFishIndex++;
                
                if (performance.now() - startTime > this.timeSlice) {
                    // Update matrices for processed fish
                    this.updateFishAndSharkMatrices();
                    // Continue in next frame
                    requestAnimationFrame(() => this.processTimeSlice());
                    return;
                }
            }
            
            // Finished processing fish, switch to sharks
            this.processingFish = false;
            this.updateFishAndSharkMatrices();
            requestAnimationFrame(() => this.processTimeSlice());
            return;
        }
        
        // Process sharks in chunks
        while (this.currentSharkIndex < this.sharkList.length) {
            const shark = this.sharkList[this.currentSharkIndex];
            if (!this.deadSharks.has(shark)) {
                this.processShark(shark);
            }
            
            this.currentSharkIndex++;
            
            if (performance.now() - startTime > this.timeSlice) {
                // Update matrices for processed sharks
                this.updateFishAndSharkMatrices();
                // Continue in next frame
                requestAnimationFrame(() => this.processTimeSlice());
                return;
            }
        }
        
        // All processing complete, finalize step
        this.finalizeStep();
    }

    processFish(fish) {
        fish.incrementAge();
        
        // 1. Choose a random neighbor offset
        const randomIndex = Math.floor(Math.random() * this.neighborOffsets.length);
        const offset = this.neighborOffsets[randomIndex];
        
        // 2. Calculate target position
        const targetPos = {
            x: fish.pos.x + offset[0],
            y: fish.pos.y + offset[1],
            z: fish.pos.z + offset[2]
        };
        
        // 3. Normalize position if needed
        const normalizedPos = this.normalizePosition(targetPos);
        
        // 4. Check if position is valid and empty
        if (classWesen.isValidPosition(normalizedPos, this.settings.dimensions) &&
            !classWesen.isPositionOccupied(normalizedPos, this.fishList, this.sharkList)) {
            
            // Move fish
            const oldPos = fish.getPosition();
            fish.setPosition(normalizedPos);
            
            // Check reproduction
            if (fish.canReproduce()) {
                fish.resetAge();
                const babyFish = new classFisch(oldPos, fish.birthTime);
                babyFish.setInstanceId(this.fishList.length + this.newFish.length);
                this.newFish.push(babyFish);
            }
        }
    }

    processShark(shark) {
        shark.incrementAge();
        shark.incrementStarveTimer();
        
        if (shark.isStarving()) {
            this.deadSharks.add(shark);
            return;
        }
        
        const fishNeighbors = this.getFishNeighbors(shark.pos);
        
        if (fishNeighbors.length > 0) {
            // Eat a random neighboring fish
            const targetPos = fishNeighbors[Math.floor(Math.random() * fishNeighbors.length)];
            const eatenFish = this.fishList.find(f => f.isSamePosition(f.pos, targetPos));
            
            if (eatenFish) {
                this.deadFish.add(eatenFish);
                const oldPos = shark.getPosition();
                shark.setPosition(targetPos);
                shark.resetStarveTimer();
                
                // Check reproduction
                if (shark.canReproduce()) {
                    shark.resetAge();
                    const emptyNeighbors = this.getEmptyNeighbors(shark.pos);
                    if (emptyNeighbors.length > 0) {
                        const babyPos = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                        const babyShark = new classHai(babyPos, shark.birthTime, shark.starveTime);
                        babyShark.setInstanceId(this.sharkList.length + this.newSharks.length);
                        this.newSharks.push(babyShark);
                    }
                }
            }
        } else {
            // No fish nearby, try to move to an empty cell
            const emptyNeighbors = this.getEmptyNeighbors(shark.pos);
            if (emptyNeighbors.length > 0) {
                const newPos = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                const oldPos = shark.getPosition();
                shark.setPosition(newPos);
                
                // Check reproduction
                if (shark.canReproduce()) {
                    shark.resetAge();
                    const birthNeighbors = this.getEmptyNeighbors(shark.pos);
                    if (birthNeighbors.length > 0) {
                        const babyPos = birthNeighbors[Math.floor(Math.random() * birthNeighbors.length)];
                        const babyShark = new classHai(babyPos, shark.birthTime, shark.starveTime);
                        babyShark.setInstanceId(this.sharkList.length + this.newSharks.length);
                        this.newSharks.push(babyShark);
                    }
                }
            }
        }
    }

    finalizeStep() {
        // Update lists and instance counts
        this.fishList = this.fishList.filter(fish => !this.deadFish.has(fish));
        this.sharkList = this.sharkList.filter(shark => !this.deadSharks.has(shark));
        
        // Add new creatures
        this.fishList.push(...this.newFish);
        this.sharkList.push(...this.newSharks);
        
        // Update instance IDs
        this.fishList.forEach((fish, index) => fish.setInstanceId(index));
        this.sharkList.forEach((shark, index) => shark.setInstanceId(index));
        
        // Update instance counts
        this.fishInstancedMesh.count = this.fishList.length;
        this.sharkInstancedMesh.count = this.sharkList.length;
        
        // Update all instances
        this.updateFishAndSharkMatrices();
        
        // Reset temporary storage
        this.newFish = [];
        this.newSharks = [];
        this.deadFish = new Set();
        this.deadSharks = new Set();
        
        // Step complete
        this.stepCounter++;
        this.stepInProgress = false;

        // Update statistics
        if (window.STATISTIK) {
            window.STATISTIK.updateStatistics(
                this.stepCounter,
                this.fishList.length,
                this.sharkList.length
            );
        }
    }

    updateFishInstance(fish) {
        const instanceId = fish.getInstanceId();
        if (instanceId >= 0) {
            this.matrix.setPosition(fish.pos.x, fish.pos.y, fish.pos.z);
            this.fishInstancedMesh.setMatrixAt(instanceId, this.matrix);
        }
    }

    updateSharkInstance(shark) {
        const instanceId = shark.getInstanceId();
        if (instanceId >= 0) {
            this.matrix.setPosition(shark.pos.x, shark.pos.y, shark.pos.z);
            this.sharkInstancedMesh.setMatrixAt(instanceId, this.matrix);
        }
    }

    updateFishAndSharkMatrices() {
        // Update fish positions
        for (let i = 0; i < this.fishList.length; i++) {
            this.updateFishInstance(this.fishList[i]);
        }
        this.fishInstancedMesh.instanceMatrix.needsUpdate = true;

        // Update shark positions
        for (let i = 0; i < this.sharkList.length; i++) {
            this.updateSharkInstance(this.sharkList[i]);
        }
        this.sharkInstancedMesh.instanceMatrix.needsUpdate = true;
    }

    getEmptyNeighbors(pos) {
        const neighbors = [];
        for (const offset of this.neighborOffsets) {
            const neighborPos = {
                x: pos.x + offset[0],
                y: pos.y + offset[1],
                z: pos.z + offset[2]
            };
            
            const normalizedPos = this.normalizePosition(neighborPos);
            
            if (!classWesen.isValidPosition(normalizedPos, this.settings.dimensions)) {
                if (this.settings.world_edge !== 'verbunden') {
                    continue;
                }
            }
            
            if (!classWesen.isPositionOccupied(normalizedPos, this.fishList, this.sharkList)) {
                neighbors.push(normalizedPos);
            }
        }
        return neighbors;
    }

    getFishNeighbors(pos) {
        const neighbors = [];
        for (const offset of this.neighborOffsets) {
            const neighborPos = {
                x: pos.x + offset[0],
                y: pos.y + offset[1],
                z: pos.z + offset[2]
            };
            
            const normalizedPos = this.normalizePosition(neighborPos);
            
            if (!classWesen.isValidPosition(normalizedPos, this.settings.dimensions)) {
                if (this.settings.world_edge !== 'verbunden') {
                    continue;
                }
            }
            
            if (this.fishList.some(f => f.isSamePosition(f.pos, normalizedPos))) {
                neighbors.push(normalizedPos);
            }
        }
        return neighbors;
    }

    normalizePosition(pos) {
        if (this.settings.world_edge === 'verbunden') {
            return {
                x: ((pos.x % this.settings.dimensions.x) + this.settings.dimensions.x) % this.settings.dimensions.x,
                y: ((pos.y % this.settings.dimensions.y) + this.settings.dimensions.y) % this.settings.dimensions.y,
                z: ((pos.z % this.settings.dimensions.z) + this.settings.dimensions.z) % this.settings.dimensions.z
            };
        }
        return pos;
    }

    removeFromScene() {
        if (this.fishInstancedMesh) {
            meine_szene.scene.remove(this.fishInstancedMesh);
        }
        if (this.sharkInstancedMesh) {
            meine_szene.scene.remove(this.sharkInstancedMesh);
        }
    }
}