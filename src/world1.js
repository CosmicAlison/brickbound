// Hand-authored early campaign encounters. Each cell is [column,row,material,hp].
// Designed around clear early lanes, one mechanic per level, and a readable boss.
export const WORLD_ONE = Object.freeze({
  1: { lesson:'Drag to aim, release to fire', blocks:[[0,2,'stone',1],[1,2,'stone',1],[4,2,'stone',1]], enemyHp:5, enemyDamage:0 },
  2: { lesson:'Bank shots off the walls', blocks:[[1,1,'stone',2],[1,2,'stone',1],[4,1,'stone',2],[4,2,'stone',1]], enemyHp:7, enemyDamage:1 },
  3: { lesson:'Explosive bricks create chain reactions', blocks:[[0,2,'stone',2],[1,2,'explosive',1],[2,2,'stone',2],[4,2,'stone',1]], enemyHp:8, enemyDamage:1 },
  4: { lesson:'Open a path to the protected core', blocks:[[1,0,'stone',2],[2,0,'stone',2],[3,0,'stone',2],[4,0,'stone',2],[1,2,'stone',1],[4,2,'stone',1]], enemyHp:8, enemyDamage:1 },
  5: { lesson:'An elite telegraphs stronger attacks', blocks:[[0,1,'stone',2],[0,2,'stone',2],[5,1,'stone',2],[5,2,'stone',2],[2,3,'explosive',1]], enemyHp:18, enemyDamage:2 },
  6: { lesson:'Work through a staggered maze', blocks:[[0,0,'stone',2],[1,0,'stone',2],[2,1,'stone',2],[3,1,'stone',2],[4,2,'stone',1],[5,2,'stone',1],[2,3,'explosive',1]], enemyHp:11, enemyDamage:1 },
  7: { lesson:'Shatter the treasure guard', blocks:[[0,1,'stone',1],[1,1,'explosive',1],[4,1,'explosive',1],[5,1,'stone',1],[2,2,'stone',1],[3,2,'stone',1]], enemyHp:9, enemyDamage:0 },
  8: { lesson:'Find the exposed weak point', blocks:[[1,0,'stone',2],[2,0,'stone',2],[3,0,'stone',2],[4,0,'stone',2],[1,1,'stone',2],[4,1,'stone',2],[1,3,'stone',2],[4,3,'stone',2],[2,4,'explosive',1]], enemyHp:12, enemyDamage:1 },
  9: { lesson:'Control three enemies under pressure', blocks:[[0,0,'stone',2],[5,0,'stone',2],[0,1,'stone',2],[5,1,'stone',2],[0,2,'explosive',1],[5,2,'explosive',1],[1,3,'stone',2],[4,3,'stone',2]], enemyHp:12, enemyDamage:2 },
  10: { lesson:'Break Rootheart’s roots to expose its heart', blocks:[[0,1,'stone',2],[5,1,'stone',2],[1,2,'root',3],[4,2,'root',3],[1,3,'root',3],[4,3,'root',3]], enemyHp:44, enemyDamage:2 }
});

export function worldOneLevel(index) {
  return WORLD_ONE[index] || null;
}

export function bossPhase(hpRatio) {
  if (hpRatio <= 0.35) return 3;
  if (hpRatio <= 0.7) return 2;
  return 1;
}