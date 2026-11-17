/** A room remains active until both monsters and destructible bricks are gone. */
export function isRoomCleared(enemies, blocks) {
  return enemies.length === 0 && blocks.every((block) => block.hp <= 0);
}
