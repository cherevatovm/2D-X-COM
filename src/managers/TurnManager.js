export class TurnManager {
    constructor(scene, blackboard) {
        this.scene = scene;
        this.blackboard = blackboard;
    }

    endUnitTurn(unit) {
        unit.deselect();
        this.scene.movementManager.clearHighlights();
        this.scene.targetManager.clearTargetHighlights();
        this.scene.infoPanel.hide();
        this.scene.selectedUnit = null;
        this.scene.actionMode = null;
        this.scene.uiManager.updateHelpText();
        this.checkEndPlayerPhase();
    }

    skipUnitTurn() {
        if (this.scene.selectedUnit) {
            this.scene.selectedUnit.endTurn();
            this.endUnitTurn(this.scene.selectedUnit);
        }
    }

    clearSelection() {
        if (this.scene.selectedUnit) {
            this.scene.selectedUnit.deselect();
            this.scene.movementManager.clearHighlights();
            this.scene.targetManager.clearTargetHighlights();
            this.scene.infoPanel.hide();
            this.scene.selectedUnit = null;
            this.scene.actionMode = null;
            this.scene.uiManager.updateHelpText();
        }
    }

    checkEndPlayerPhase() {
        const playerUnits = this.scene.unitManager.playerUnits;
        if (!playerUnits.some(u => u.hasActions())) {
            this.startEnemyPhase();
        }
    }

    startPlayerPhase() {
        this.scene.phase = 'player';
        this.scene.unitManager.playerUnits.forEach(u => u.resetActions());
        this.scene.uiManager.updateHelpText();
    }

    startEnemyPhase() {
        this.scene.phase = 'enemy';
        this.scene.uiManager.updateHelpText();
        this.scene.unitManager.enemyUnits.forEach(e => e.resetActions());
        this.scene.time.delayedCall(500, () => this.processEnemyTurn());
    }

    processEnemyTurn() {
        const enemies = this.scene.unitManager.enemyUnits;
        const active = enemies.filter(e => e.hasActions() && e.hp > 0);
        if (active.length === 0) {
            this.startPlayerPhase();
            return;
        }
        this.enemyAct(active[0]);
    }

    enemyAct(enemy) {
        const closestData = this.blackboard.getClosestPlayer(enemy);

        const closest = closestData.unit;
        const distanceToClosest = closestData.distance;
        if (!closest) { enemy.endTurn(); this.processEnemyTurn(); return; }

        const combat = this.scene.combatManager;
        if (distanceToClosest <= 1) {
            combat.performRangedAttack(enemy, closest);
            enemy.endTurn();
            this.scene.time.delayedCall(300, () => this.processEnemyTurn());
            return;
        }

        const pathfinder = this.scene.pathfinder;
        const tilemap = this.scene.tilemap;
        const neighbours = pathfinder.getTilesInRange(closest.tile, 1)
            .filter(t => t.walkable && !t.unit);
        if (neighbours.length === 0) {
            enemy.endTurn();
            this.processEnemyTurn();
            return;
        }

        const bestTile = this.blackboard.getClosestTile(neighbours, enemy.tile).tile;

        const path = pathfinder.findPath(enemy.tile, bestTile, enemy.moveRange);
        if (path && path.length > 0) {
            const finalTile = path[path.length - 1];
            
            enemy.moveTo(finalTile);

            if (enemy.hasActions() && this.blackboard.distanceBetweenTiles(enemy.tile, closest.tile) <= 1) {
                combat.performRangedAttack(enemy, closest);
                enemy.endTurn();
            }
        } else {
            enemy.endTurn();
        }
        this.scene.time.delayedCall(300, () => this.processEnemyTurn());
    }
}