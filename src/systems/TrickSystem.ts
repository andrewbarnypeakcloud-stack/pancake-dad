// TrickSystem — input combo detection during airtime → TrickResult
// See PancakeDad_GDD_v02_Browser.md section 3.4

import Phaser from 'phaser';
import { InputAction, GameEvent, TrickDefinition, TrickResult } from '../types/game';
import { Dad } from '../entities/Dad';
import { Pancake } from '../entities/Pancake';

/** Built-in trick definitions (will be loaded from tricks.json via DataLoader later) */
const BUILT_IN_TRICKS: TrickDefinition[] = [
  {
    id: 'classic',
    name: 'The Classic',
    inputs: [InputAction.JUMP],
    baseScore: 100,
    description: 'Simple clean flip, perfect landing',
    animationKey: 'trick_classic',
    isSignature: false,
    requiresSpecialMeter: false,
  },
  {
    id: '360dad',
    name: 'The 360 Dad',
    inputs: [InputAction.JUMP, InputAction.SPIN_LEFT],
    baseScore: 300,
    description: 'Full rotation in slippers',
    animationKey: 'trick_360',
    isSignature: false,
    requiresSpecialMeter: false,
  },
  {
    id: 'grab',
    name: 'The Grab',
    inputs: [InputAction.JUMP, InputAction.GRAB],
    baseScore: 250,
    description: 'Clutches spatula mid-air',
    animationKey: 'trick_grab',
    isSignature: false,
    requiresSpecialMeter: false,
  },
  {
    id: 'blind_flip',
    name: 'The Blind Flip',
    inputs: [InputAction.JUMP, InputAction.SPIN_RIGHT],
    baseScore: 400,
    description: 'Back turned, no-look catch',
    animationKey: 'trick_blind',
    isSignature: false,
    requiresSpecialMeter: false,
  },
  {
    id: 'double_stack',
    name: 'The Double Stack',
    inputs: [InputAction.JUMP, InputAction.GRAB, InputAction.SPIN_LEFT],
    baseScore: 600,
    description: 'Two pancakes at once',
    animationKey: 'trick_doublestack',
    isSignature: false,
    requiresSpecialMeter: false,
  },
];

export class TrickSystem {
  private scene: Phaser.Scene;
  private dad: Dad;
  private pancake: Pancake;
  private tricks: TrickDefinition[] = BUILT_IN_TRICKS;

  private currentInputs: Set<InputAction> = new Set();
  private trickStarted: boolean = false;
  private airTimeAccumulated: number = 0;
  private hasFlipped: boolean = false;
  private grabHoldTime: number = 0;

  constructor(scene: Phaser.Scene, dad: Dad, pancake: Pancake) {
    this.scene = scene;
    this.dad = dad;
    this.pancake = pancake;
  }

  setTricks(tricks: TrickDefinition[]): void {
    this.tricks = tricks;
  }

  update(actions: Set<InputAction>, delta: number): void {
    if (this.dad.isAirborne()) {
      if (!this.trickStarted) {
        this.startTrick();
      }

      this.airTimeAccumulated += delta;

      // Record all inputs during airtime
      for (const action of actions) {
        this.currentInputs.add(action);
      }

      // Track grab hold time for style bonus
      if (actions.has(InputAction.GRAB)) {
        this.grabHoldTime += delta;
      }

      // Auto-flip pancake on jump if not already flipped
      if (!this.hasFlipped && this.airTimeAccumulated > 100) {
        this.flipPancake(actions);
        this.hasFlipped = true;
      }
    } else if (this.trickStarted) {
      this.endTrick();
    }
  }

  private startTrick(): void {
    this.trickStarted = true;
    this.currentInputs.clear();
    this.airTimeAccumulated = 0;
    this.hasFlipped = false;
    this.grabHoldTime = 0;
    this.currentInputs.add(InputAction.JUMP);
    this.scene.events.emit(GameEvent.TRICK_START);
  }

  private endTrick(): void {
    const trick = this.resolveTrick();
    this.trickStarted = false;

    if (trick) {
      const grabBonus = Phaser.Math.Clamp(this.grabHoldTime / 500, 0, 0.5);
      const isPerfect = this.airTimeAccumulated > 400 && this.grabHoldTime > 200;
      const score = Phaser.Math.FloorTo(trick.baseScore * (1 + grabBonus) * (isPerfect ? 1.5 : 1));

      const result: TrickResult = {
        trick,
        score,
        multiplier: 1,
        isPerfect,
      };

      this.scene.events.emit(GameEvent.TRICK_COMPLETE, result);
    } else {
      this.scene.events.emit(GameEvent.TRICK_FAIL);
    }

    this.currentInputs.clear();
  }

  private resolveTrick(): TrickDefinition | null {
    // Find best matching trick (most inputs matched = highest complexity = best match)
    let bestMatch: TrickDefinition | null = null;
    let bestMatchCount = 0;

    for (const trick of this.tricks) {
      const matchCount = trick.inputs.filter(input => this.currentInputs.has(input)).length;
      if (matchCount === trick.inputs.length && matchCount > bestMatchCount) {
        bestMatch = trick;
        bestMatchCount = matchCount;
      }
    }

    return bestMatch;
  }

  private flipPancake(actions: Set<InputAction>): void {
    if (!this.pancake.isCaught()) return;

    const spinDir = actions.has(InputAction.SPIN_LEFT) ? -1 : actions.has(InputAction.SPIN_RIGHT) ? 1 : 0;
    const flipVelocityX = spinDir * 50;
    const flipVelocityY = -350;
    const spinSpeed = 5 + Math.abs(spinDir) * 3;

    this.pancake.flip(flipVelocityX, flipVelocityY, spinSpeed);
  }
}
