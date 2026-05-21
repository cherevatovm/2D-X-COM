

export class MathUtils {

    static gridDistance(posA, posB) {
        return Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y);
    }
}
