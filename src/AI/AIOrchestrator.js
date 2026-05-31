import { StupidAI } from "./StupidAI";
import { AlingAI } from "./AlingAI";
import { SupportAI } from "./SupportAI";
import { SniperAI } from "./SniperAI";
import { BruteAI } from "./BruteAI";

export class AIOrchestrator {
    constructor(scene) {
        this.scene = scene;
        //Добавляйте сюда свои ИИ порядок не особо важен главное, 
        // чтобы StupidAI был в самом конце так как это поведение в случае
        //  отказа всех остальных в идеале оно вообще не должно вызываться
        this.aiControllers = [new SupportAI(scene), new BruteAI(scene), new SniperAI(scene), new AlingAI(scene), new StupidAI(scene)];
    }

    processAIActions(enemy) {

        const chosenController = this.getAIForEnemy(enemy);

        if (!chosenController)
            return false;

        const enemyPlan = chosenController.getActionsPlan(enemy, enemy.actionsLeft);

        if (!enemyPlan)
            return true;

        this._executeEnemyPlan(enemy, enemyPlan, this.scene, this.scene.combatManager);

        return true;
    }

    getAIForEnemy(enemy) {
        for (const controller of this.aiControllers) {
            
            // В canProcess каждый должен проверять именно свой тип противников
            if (!controller.canProcess(enemy)) {
                continue;
            }

            return controller;
        }

        return null;
    }

    _executeEnemyPlan(enemy, plan, scene, combat) {

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

                    break;

                case 'attack':

                    combat.performMeleeAttack(
                        enemy,
                        action.target
                    );

                    break;

                case 'rangedAttack':

                    combat.performRangedAttack(
                        enemy,
                        action.target
                    );

                    break;

                case 'buff':

                    scene.supportAI.applyBestBuff(enemy);

                    break;

                case 'sniperShot':

                    combat.performSniperShot(
                        enemy, 
                        action.target
                    );

                    break;
            }

            executeNext();
        }
    }
}