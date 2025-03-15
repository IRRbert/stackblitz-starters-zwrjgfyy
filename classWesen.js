// classWesen.js
// Base class for all creatures in the simulation

class classWesen {
    static infoWindow = null;

    constructor(pos, birthTime) {
        this.pos = this.copyPosition(pos);
        // Initialize age randomly as 0 or 1
        this.age = Math.floor(Math.random() * 2);
        this.birthTime = birthTime;
        this.instanceId = -1;

        // Create info window if it doesn't exist
        if (!classWesen.infoWindow) {
            classWesen.createInfoWindow();
        }
    }

    copyPosition(pos) {
        return {
            x: pos.x,
            y: pos.y,
            z: pos.z
        };
    }

    isSamePosition(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y && pos1.z === pos2.z;
    }

    getInfo() {
        const info = {
            age: this.age,
            birthTime: this.birthTime,
            position: 'X:' + this.pos.x + ' Y:' + this.pos.y + ' Z:' + this.pos.z
        };
        return info;
    }

    canReproduce() {
        return this.age >= this.birthTime;
    }

    resetAge() {
        // Reset age to random 0 or 1
        this.age = Math.floor(Math.random() * 2);
    }

    incrementAge() {
        this.age++;
    }

    setPosition(pos) {
        this.pos = this.copyPosition(pos);
    }

    getPosition() {
        return this.copyPosition(this.pos);
    }

    setInstanceId(id) {
        this.instanceId = id;
    }

    getInstanceId() {
        return this.instanceId;
    }

    static isValidPosition(pos, dimensions) {
        return pos.x >= 0 && pos.x < dimensions.x && 
               pos.y >= 0 && pos.y < dimensions.y && 
               pos.z >= 0 && pos.z < dimensions.z;
    }

    static isPositionOccupied(pos, fishList, sharkList) {
        return fishList.some(function(f) { return f.isSamePosition(f.pos, pos); }) ||
               sharkList.some(function(s) { return s.isSamePosition(s.pos, pos); });
    }

    static generateNeighborOffsets(neighbors) {
        const offsets = [];
        if (neighbors.sides) {
            offsets.push([-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]);
        }
        if (neighbors.edges) {
            offsets.push(
                [-1, -1, 0], [-1, 1, 0], [1, -1, 0], [1, 1, 0],
                [-1, 0, -1], [-1, 0, 1], [1, 0, -1], [1, 0, 1],
                [0, -1, -1], [0, -1, 1], [0, 1, -1], [0, 1, 1]
            );
        }
        if (neighbors.corners) {
            offsets.push(
                [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
                [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1]
            );
        }
        return offsets;
    }

    static normalizePosition(pos, settings) {
        if (settings.world_edge === 'verbunden') {
            return {
                x: (pos.x + settings.dimensions.x) % settings.dimensions.x,
                y: (pos.y + settings.dimensions.y) % settings.dimensions.y,
                z: (pos.z + settings.dimensions.z) % settings.dimensions.z
            };
        }
        return pos;
    }

    static getEmptyNeighbors(pos, neighborOffsets, settings, fishList, sharkList) {
        const neighbors = [];
        for (const offset of neighborOffsets) {
            const neighborPos = {
                x: pos.x + offset[0],
                y: pos.y + offset[1],
                z: pos.z + offset[2]
            };
            
            const normalizedPos = classWesen.normalizePosition(neighborPos, settings);
            
            if (!classWesen.isValidPosition(normalizedPos, settings.dimensions)) {
                continue;
            }
            
            if (!classWesen.isPositionOccupied(normalizedPos, fishList, sharkList)) {
                neighbors.push(normalizedPos);
            }
        }
        return neighbors;
    }

    static getFishNeighbors(pos, neighborOffsets, settings, fishList) {
        const neighbors = [];
        for (const offset of neighborOffsets) {
            const neighborPos = {
                x: pos.x + offset[0],
                y: pos.y + offset[1],
                z: pos.z + offset[2]
            };
            
            const normalizedPos = classWesen.normalizePosition(neighborPos, settings);
            
            if (!classWesen.isValidPosition(normalizedPos, settings.dimensions)) {
                continue;
            }
            
            if (fishList.some(function(f) { return f.isSamePosition(f.pos, normalizedPos); })) {
                neighbors.push(normalizedPos);
            }
        }
        return neighbors;
    }

    static findRandomEmptyPosition(settings, fishList, sharkList) {
        const { x, y, z } = settings.dimensions;
        for (let attempts = 0; attempts < 100; attempts++) {
            const pos = {
                x: Math.floor(Math.random() * x),
                y: Math.floor(Math.random() * y),
                z: Math.floor(Math.random() * z)
            };
            if (classWesen.isValidPosition(pos, settings.dimensions) && 
                !classWesen.isPositionOccupied(pos, fishList, sharkList)) {
                return pos;
            }
        }
        return null;
    }

    static createInfoWindow() {
        classWesen.infoWindow = document.createElement('div');
        classWesen.infoWindow.style.cssText = 'position: fixed; padding: 10px; background: rgba(0, 0, 0, 0.8); color: white; border-radius: 5px; font-family: Arial, sans-serif; font-size: 12px; pointer-events: none; display: none; z-index: 1000;';
        document.body.appendChild(classWesen.infoWindow);
    }

    static showInfo(event, info) {
        let html = '<strong>' + info.type + '</strong><br>';
        for (const key in info) {
            if (key !== 'type') {
                html += key + ': ' + info[key] + '<br>';
            }
        }
        
        classWesen.infoWindow.innerHTML = html;
        classWesen.infoWindow.style.display = 'block';
        
        const padding = 10;
        let left = event.clientX + padding;
        let top = event.clientY + padding;
        
        if (left + classWesen.infoWindow.offsetWidth > window.innerWidth) {
            left = event.clientX - classWesen.infoWindow.offsetWidth - padding;
        }
        
        if (top + classWesen.infoWindow.offsetHeight > window.innerHeight) {
            top = event.clientY - classWesen.infoWindow.offsetHeight - padding;
        }
        
        classWesen.infoWindow.style.left = left + 'px';
        classWesen.infoWindow.style.top = top + 'px';
    }

    static hideInfo() {
        if (classWesen.infoWindow) {
            classWesen.infoWindow.style.display = 'none';
        }
    }

    static onMouseMove(event, simulation) {
        if (window.PLAYER && window.PLAYER.isPlaying) {
            classWesen.hideInfo();
            return;
        }

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        simulation.raycaster.setFromCamera(mouse, meine_szene.camera);

        const fishIntersects = simulation.raycaster.intersectObject(simulation.fishInstancedMesh);
        const sharkIntersects = simulation.raycaster.intersectObject(simulation.sharkInstancedMesh);

        if (fishIntersects.length > 0) {
            const instanceId = fishIntersects[0].instanceId;
            const fish = simulation.fishList[instanceId];
            if (fish) {
                classWesen.showInfo(event, fish.getInfo());
            }
        } else if (sharkIntersects.length > 0) {
            const instanceId = sharkIntersects[0].instanceId;
            const shark = simulation.sharkList[instanceId];
            if (shark) {
                classWesen.showInfo(event, shark.getInfo());
            }
        } else {
            classWesen.hideInfo();
        }
    }
}