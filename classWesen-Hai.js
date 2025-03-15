// classWesen-Hai.js
// Shark class that inherits from classWesen

class classHai extends classWesen {
    constructor(pos, birthTime, starveTime) {
        super(pos, birthTime);
        this.starveTimer = 0;
        this.starveTime = starveTime;
    }

    getInfo() {
        const baseInfo = super.getInfo();
        const sharkInfo = {
            type: 'Hai',
            age: baseInfo.age,
            birthTime: baseInfo.birthTime,
            position: baseInfo.position,
            hunger: this.starveTimer,
            maxHunger: this.starveTime
        };
        return sharkInfo;
    }

    incrementStarveTimer() {
        this.starveTimer++;
    }

    resetStarveTimer() {
        this.starveTimer = 0;
    }

    isStarving() {
        return this.starveTimer >= this.starveTime;
    }
}