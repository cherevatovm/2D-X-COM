import { Unit } from '../entities/Unit.js';

export class SummonerAI {
    constructor(scene) {
        this.scene = scene;
    }

    canProcess(enemy) {
        return enemy.role === 'summoner';
    }

    process(enemy) {
        const closestData = this.scene.blackboard.getClosestPlayer(enemy);

        const closest = closestData.unit;
        const distanceToClosest = closestData.distance;

        if (!closest || !closest.isAlive) { return; }

        if (distanceToClosest <= 3) {
            const reachableTiles = this.scene.pathfinder.getTilesInRange(enemy.tile, enemy.moveRange);

            if (reachableTiles.length !== 0) {
                const mostDistantFromPlayers = this.scene.blackboard.getTheMostDistantTileFromPlayers(reachableTiles, enemy.tile, 7);
                const newClosestPlayerInfo = this.scene.blackboard.getClosestTile(this.scene.unitManager.getPlayerUnits().map(p => p.tile), mostDistantFromPlayers);

                if (newClosestPlayerInfo.distance > distanceToClosest)
                    enemy.moveTo(mostDistantFromPlayers);
            }
        }

        if (enemy.maxSummonedUnits
            && 0 < enemy.maxSummonedUnits
            && enemy.minionRoles
            && enemy.minionRoles.length > 0
            && enemy.summonedUnits < enemy.maxSummonedUnits)
        {
            const tilesForSummoning = this.scene.pathfinder.getTilesInRange(enemy.tile, 1);
            
            if (tilesForSummoning && tilesForSummoning.length >= 0) {
                const tile = tilesForSummoning[0];
                const { x, y } = this.scene.tilemap.gridToWorld(tile.gridX, tile.gridY);
                const minionRole = enemy.minionRoles[Math.floor(Math.random() * enemy.minionRoles.length)];

                const unit = new Unit(this.scene, x, y, { ...(enemy.minionConfigs.filter(c => c.role === minionRole)[0]), type: 'enemy', summoner: enemy });
                unit.setTile(tile);

                this.scene.unitManager.enemyUnits.push(unit);
                this.scene.unitManager.allUnits.push(unit);

                enemy.summonedUnits += 1;
            }
        }
    }
}