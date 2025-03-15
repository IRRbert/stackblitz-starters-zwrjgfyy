// simulation.worker.js
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'processFish':
            const fishResults = processFish(data);
            self.postMessage({ type: 'fishComplete', data: fishResults });
            break;
            
        case 'processSharks':
            const sharkResults = processSharks(data);
            self.postMessage({ type: 'sharksComplete', data: sharkResults });
            break;
    }
};

function processFish(data) {
    const { fishList, neighborOffsets, settings } = data;
    const newFish = [];
    const movedFish = [];
    const deadFish = new Set();

    for (const fish of fishList) {
        if (deadFish.has(fish)) continue;
        
        fish.age++;
        const emptyNeighbors = getEmptyNeighbors(fish.pos, neighborOffsets, settings, fishList, []);
        
        if (emptyNeighbors.length > 0) {
            const oldPos = {...fish.pos};
            const newPos = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
            fish.pos = newPos;
            movedFish.push({id: fish.instanceId, pos: newPos});
            
            if (fish.age >= fish.birthTime) {
                fish.age = 0;
                if (isValidPosition(oldPos, settings.dimensions)) {
                    const birthNeighbors = getEmptyNeighbors(fish.pos, neighborOffsets, settings, fishList, []);
                    if (birthNeighbors.length > 0) {
                        newFish.push({
                            pos: oldPos,
                            birthTime: fish.birthTime,
                            age: 0
                        });
                    }
                }
            }
        }
    }

    return { newFish, movedFish, deadFish: Array.from(deadFish) };
}

function processSharks(data) {
    const { sharkList, fishList, neighborOffsets, settings } = data;
    const newSharks = [];
    const movedSharks = [];
    const deadSharks = new Set();
    const eatenFish = new Set();

    for (const shark of sharkList) {
        if (deadSharks.has(shark)) continue;
        
        shark.age++;
        shark.starveTimer++;
        
        if (shark.starveTimer >= shark.starveTime) {
            deadSharks.add(shark.instanceId);
            continue;
        }
        
        const fishNeighbors = getFishNeighbors(shark.pos, fishList, neighborOffsets, settings);
        
        if (fishNeighbors.length > 0) {
            const targetPos = fishNeighbors[Math.floor(Math.random() * fishNeighbors.length)];
            const eatenFishId = findFishAtPosition(targetPos, fishList);
            
            if (eatenFishId !== -1) {
                eatenFish.add(eatenFishId);
                const oldPos = {...shark.pos};
                shark.pos = targetPos;
                shark.starveTimer = 0;
                movedSharks.push({id: shark.instanceId, pos: targetPos});
                
                if (shark.age >= shark.birthTime) {
                    shark.age = 0;
                    const birthNeighbors = getEmptyNeighbors(shark.pos, neighborOffsets, settings, fishList, sharkList);
                    if (birthNeighbors.length > 0) {
                        const babyPos = birthNeighbors[Math.floor(Math.random() * birthNeighbors.length)];
                        newSharks.push({
                            pos: babyPos,
                            birthTime: shark.birthTime,
                            starveTime: shark.starveTime,
                            age: 0,
                            starveTimer: 0
                        });
                    }
                }
            }
        } else {
            const emptyNeighbors = getEmptyNeighbors(shark.pos, neighborOffsets, settings, fishList, sharkList);
            if (emptyNeighbors.length > 0) {
                const newPos = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                shark.pos = newPos;
                movedSharks.push({id: shark.instanceId, pos: newPos});
                
                if (shark.age >= shark.birthTime) {
                    shark.age = 0;
                    const birthNeighbors = getEmptyNeighbors(shark.pos, neighborOffsets, settings, fishList, sharkList);
                    if (birthNeighbors.length > 0) {
                        const babyPos = birthNeighbors[Math.floor(Math.random() * birthNeighbors.length)];
                        newSharks.push({
                            pos: babyPos,
                            birthTime: shark.birthTime,
                            starveTime: shark.starveTime,
                            age: 0,
                            starveTimer: 0
                        });
                    }
                }
            }
        }
    }

    return { newSharks, movedSharks, deadSharks: Array.from(deadSharks), eatenFish: Array.from(eatenFish) };
}

function getEmptyNeighbors(pos, neighborOffsets, settings, fishList, sharkList) {
    const neighbors = [];
    for (const offset of neighborOffsets) {
        const neighborPos = {
            x: pos.x + offset[0],
            y: pos.y + offset[1],
            z: pos.z + offset[2]
        };
        
        const normalizedPos = normalizePosition(neighborPos, settings);
        
        if (!isValidPosition(normalizedPos, settings.dimensions)) {
            continue;
        }
        
        // Check if position is occupied by any fish or shark
        const isOccupied = fishList.some(f => 
            f.pos.x === normalizedPos.x && 
            f.pos.y === normalizedPos.y && 
            f.pos.z === normalizedPos.z
        ) || sharkList.some(s => 
            s.pos.x === normalizedPos.x && 
            s.pos.y === normalizedPos.y && 
            s.pos.z === normalizedPos.z
        );
        
        if (!isOccupied) {
            neighbors.push(normalizedPos);
        }
    }
    return neighbors;
}

function getFishNeighbors(pos, fishList, neighborOffsets, settings) {
    const neighbors = [];
    for (const offset of neighborOffsets) {
        const neighborPos = {
            x: pos.x + offset[0],
            y: pos.y + offset[1],
            z: pos.z + offset[2]
        };
        
        const normalizedPos = normalizePosition(neighborPos, settings);
        
        if (!isValidPosition(normalizedPos, settings.dimensions)) {
            continue;
        }
        
        if (fishList.some(f => f.pos.x === normalizedPos.x && f.pos.y === normalizedPos.y && f.pos.z === normalizedPos.z)) {
            neighbors.push(normalizedPos);
        }
    }
    return neighbors;
}

function normalizePosition(pos, settings) {
    if (settings.world_edge === 'verbunden') {
        return {
            x: (pos.x + settings.dimensions.x) % settings.dimensions.x,
            y: (pos.y + settings.dimensions.y) % settings.dimensions.y,
            z: (pos.z + settings.dimensions.z) % settings.dimensions.z
        };
    }
    return pos;
}

function isValidPosition(pos, dimensions) {
    return pos.x >= 0 && pos.x < dimensions.x && 
           pos.y >= 0 && pos.y < dimensions.y && 
           pos.z >= 0 && pos.z < dimensions.z;
}

function findFishAtPosition(pos, fishList) {
    return fishList.findIndex(f => 
        f.pos.x === pos.x && f.pos.y === pos.y && f.pos.z === pos.z
    );
}