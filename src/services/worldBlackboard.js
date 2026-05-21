import { MathUtils } from "../utils/MathUtils";

/**
 * Сервис, который предоставляет интерфейс для доступа к информации о состоянии игрового мира.
 */
export class WorldBlackboard {
    constructor(scene) {
        this.scene = scene;
    }

    getUnits(alive = true) {
        const units = this.scene.unitManager.allUnits ?? [];
        return alive ? units.filter(unit => this.isAlive(unit)) : units;
    }

    getEnemyUnits(alive = true) {
        const units = this.scene.unitManager.enemyUnits ?? [];
        return alive ? units.filter(unit => this.isAlive(unit)) : units;
    }

    getPlayerUnits(alive = true) {
        const units = this.scene.unitManager.playerUnits ?? [];
        return alive ? units.filter(unit => this.isAlive(unit)) : units;
    }

    isAlive(unit) {
        return unit && unit.hp > 0;
    }

    getUnitTile(unit) {
        if (!unit)
            return null;

        if (unit.tile)
            return unit.tile;

        const grid = this.scene.tilemap?.grid;
        if (!grid)
            return null;

        for (const row of grid) {
            for (const tile of row) {
                if (tile.unit === unit)
                    return tile;
            }
        }

        return null;
    }

    getUnitGridPosition(unit) {
        const tile = this.getUnitTile(unit);
        if (tile) {
            return { x: tile.gridX, y: tile.gridY };
        }

        if (this.scene.tilemap && unit?.sprite) {
            return this.scene.tilemap.worldToGrid(unit.sprite.x, unit.sprite.y);
        }

        return null;
    }

    getMaxGridDistance() {
        const tilemap = this.scene.tilemap;
        if (!tilemap)
            return 20;

        return (tilemap.COLS ?? 0) + (tilemap.ROWS ?? 0);
    }

    distanceBetweenUnits(a, b) {
        const posA = this.getUnitGridPosition(a);
        const posB = this.getUnitGridPosition(b);

        if (!posA || !posB)
            return Infinity;

        return MathUtils.gridDistance(posA, posB);
    }

    distanceBetweenTiles(t1, t2) {
        const pos1 = { x: t1.gridX, y: t1.gridY };
        const pos2 = { x: t2.gridX, y: t2.gridY };

        return MathUtils.gridDistance(pos1, pos2);
    }

    getClosestPlayer(unit) {
        return this.getClosestUnit(this.getPlayerUnits(), unit);
    }

    getClosestEnemy(unit) {
        return this.getClosestUnit(this.getEnemyUnits(), unit);
    }

    getClosestTile(tiles, tile) {
        let best = null;

        for (const t of tiles) {
            const distance = this.distanceBetweenTiles(tile, t);
            if (!best || distance < best.distance) {
                best = { tile: t, distance: distance };
            }
        }

        return best;
    }
    
    getClosestUnit(units, unit) {
        let best = null;

        for (const u of units) {
            const distance = this.distanceBetweenUnits(unit, u);
            if (!best || distance < best.distance) {
                best = { unit: u, distance: distance };
            }
        }

        return best;
    }

    getAlliesInRange(unit, range) {
        let allies = unit.type === 'player' ? this.getPlayerUnits() : this.getEnemyUnits();
        allies = allies.filter((ally) => ally !== unit);
        return allies.filter((ally) => this.distanceBetweenUnits(unit, ally) <= range);
    }

    getUnitAtGrid(gx, gy) {
        const tile = this.scene.tilemap?.getTile(gx, gy);
        if (tile?.unit)
            return tile.unit;

        return this.getUnits(false).find((unit) => {
            const pos = this.getUnitGridPosition(unit);
            return pos && pos.x === gx && pos.y === gy;
        }) ?? null;
    }

    getEnemyAtGrid(gx, gy) {
        const unit = this.getUnitAtGrid(gx, gy);
        return unit && unit.type === 'enemy' ? unit : null;
    }

    getPlayerAtGrid(gx, gy) {
        const unit = this.getUnitAtGrid(gx, gy);
        return unit && unit.type === 'player' ? unit : null;
    }
}
