export class BruteAI {
    constructor(scene) {
        this.scene = scene;
    }

    canProcess(enemy) {
        return enemy.role === 'brute';
    }

    getActionsPlan(enemy, actionsLeft) {

        const closestData = this.scene.blackboard.getClosestPlayer(enemy);

        if (!closestData) { return null; }

        const closest = closestData.unit;
        const distanceToClosest = closestData.distance;

        const combat = this.scene.combatManager;
    
        if (distanceToClosest <= 1) {
            return { actions: [{type: 'attack', target: closest}] };
        }

        const pathfinder = this.scene.pathfinder;
        const neighbours = pathfinder.getTilesInRange(closest.tile, 1)
            .filter(t => t.walkable && !t.unit);
        if (neighbours.length === 0) {
            return null;
        }

        const bestTile = this.scene.blackboard.getClosestTile(neighbours, enemy.tile).tile;

        const path = pathfinder.findPath(enemy.tile, bestTile, enemy.moveRange);
        if (path && path.length > 0) {
            const finalTile = path[path.length - 1];
            
            const plan = { actions: [{type: 'move', tile: finalTile}] }

            actionsLeft--;

            if (actionsLeft > 0 && this.scene.blackboard.distanceBetweenTiles(finalTile, closest.tile) <= 1) {
                plan.actions.push({type: 'attack', target: closest});
            }
            return plan;
        }

        let targetTile = null;

        if (distanceToClosest <= 7)
        {
            const pathToPoint = pathfinder.findPath(enemy.tile, closest.tile, 7);
            if (pathToPoint && pathToPoint.length > 0)
            {
                targetTile = closest.tile;
            }
        }

        if (targetTile && this.scene.blackboard.distanceBetweenTiles(targetTile, enemy.tile) > 0)
        {
            const pathToPoint = pathfinder.findPath(enemy.tile, targetTile, 7);
            const finalTileOnWayToPoint = pathToPoint[Math.min(enemy.moveRange,pathToPoint.length)-1];
            
            const plan = { actions: [{type: 'move', tile: finalTileOnWayToPoint}] }

            actionsLeft--;

            if (actionsLeft > 0)
            {
                // костыль, чтобы сохранить логику
                const prevTile = enemy.tile;
                enemy.setTile(finalTileOnWayToPoint);
                const newPlan = this.getActionsPlan(enemy, actionsLeft);
                enemy.setTile(prevTile);
                if (newPlan)
                    plan.actions.push(...newPlan.actions);
            }
            return plan;
        }

        return null;
    }

    process(enemy) {
        
        const plan = this.getActionsPlan(enemy, enemy.actionsLeft);

        if (!plan)
            return;

        this._executePlan(enemy, plan, this.scene, this.scene.combatManager);
    }

    _executePlan(enemy, plan, scene, combat) {

        let currentActionIndex = 0;

        executeNext();

        function executeNext() {

            if (currentActionIndex >= plan.actions.length) {
                return;
            }

            const action =
                plan.actions[currentActionIndex];

            currentActionIndex++;

            switch (action.type) {

                case 'move':

                    scene.movementManager.moveUnitTo(
                        enemy,
                        action.tile
                    );

                    executeNext();

                    break;

                case 'attack':

                    combat.performMeleeAttack(
                        enemy,
                        action.target
                    );

                    executeNext();

                    break;
            }
        }
    }
}