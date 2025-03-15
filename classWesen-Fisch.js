// classWesen-Fisch.js
// Fish class that inherits from classWesen

class classFisch extends classWesen {
    constructor(pos, birthTime) {
        super(pos, birthTime);
    }

    getInfo() {
        const baseInfo = super.getInfo();
        const fishInfo = {
            type: 'Fisch',
            age: baseInfo.age,
            birthTime: baseInfo.birthTime,
            position: baseInfo.position
        };
        return fishInfo;
    }
}