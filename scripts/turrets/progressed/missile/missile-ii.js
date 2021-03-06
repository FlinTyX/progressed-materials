const bul = require("libs/bulletTypes/strikeBulletType");
const type = require("libs/turretTypes/stationaryTurretType");
const eff = require("libs/effect");

const trail = eff.trailEffect(120, false, 1);
trail.layer = Layer.flyingUnitLow - 2;

const boom = eff.scaledLargeBlast(1.5);

const missile = bul.strikeBullet(true, 8, 4, false, true, false);
missile.width = 12;
missile.height = 24;
missile.engineSize = 16;
missile.trailSize = 0.5;
missile.bulletOffset = 12;
missile.damage = 80;
missile.splashDamage = 750;
missile.splashDamageRadius = 64;
missile.speed = 1;
missile.homingPower = 0.05;
missile.homingRange = 320;
missile.lifetime = 300;
missile.elevation = 600;
missile.riseTime = 90;
missile.fallTime = 45;
missile.ammmoMultiplier = 1;
missile.hitSound = Sounds.bang;
missile.hitShake = 8;
missile.trailParam = 5;
missile.trailChance = 0.2;
missile.trailEffect = trail;
missile.despawnEffect = boom;
missile.targetPred = (u, x, y) => -u.maxHealth;

const ohnoMissilesReturns = type.stationaryTurret(false, ItemTurret, ItemTurret.ItemTurretBuild, "missile-ii", {}, {});  
/**
 * Easy to read research requirement list
 *
 * copper/69
**/
ohnoMissilesReturns.requirements = ItemStack.with(Items.copper, 69);
ohnoMissilesReturns.ammo(Items.blastCompound, missile);
ohnoMissilesReturns.ammoPerShot = 3;
ohnoMissilesReturns.maxAmmo = 6;
ohnoMissilesReturns.unitSort = (u, x, y) => -u.maxHealth;

/**
  * Plans:
  *
  * Swarm Missiles (3x3 / 4x4 idk)
  * Name: 
  * Info: Quick, 9 firing silos, lower homing and start in random directions. Shorter lifetime. Don't resume seek. Faster target. Only targets ground.
  * Research: impact0078
  *
  * Strike Missiles (4x4) (this)
  * Name: Strikedown
  * Info: Moderate speed, fires single high damage missile. Longer lifetime. Instantly drops when over target.
  * Research: NPC, launchpad
  *
  * Nuclear Missiles (6x6)
  * Name: Arbiter
  * Info: Slow. Does as the name says. F u c k i n g   n u k e s   e v e r y t h i n g . Slower target.
  * Research: ILC, interplanetary accelerator
**/