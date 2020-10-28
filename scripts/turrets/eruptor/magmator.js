const tV = new Vec2();
const tV2 = new Vec2();

//Stolen effect from [redacted] from [redacted/redacted]
//Which I now just stole from myself.
//Why do I keep stealing things.
const targetLightning = new Effect(10, 500, e => {
	var length = e.data[0];
	var tileLength = Mathf.round(length / 8);
	
	Lines.stroke(6 * e.fout());
	Draw.color(e.color, Color.white, e.fin());
	
	for(var i = 0; i < tileLength; i++){
		var offsetXA = (i == 0) ? 0 : Mathf.randomSeed(e.id + (i * 6413), -4.5, 4.5);
		var offsetYA = (length / tileLength) * i;
		
		var f = i + 1;
		
		var offsetXB = (f == tileLength) ? 0 : Mathf.randomSeed(e.id + (f * 6413), -4.5, 4.5);
		var offsetYB = (length / tileLength) * f;
		
		tV.trns(e.rotation, offsetYA, offsetXA);
		tV.add(e.x, e.y);
		
		tV2.trns(e.rotation, offsetYB, offsetXB);
		tV2.add(e.x, e.y);
		
		Lines.line(tV.x, tV.y, tV2.x, tV2.y, false);
		Fill.circle(tV.x, tV.y, Lines.getStroke() / 2);
	};
  Fill.circle(tV2.x, tV2.y, Lines.getStroke() / 2);
});

targetLightning.ground = true;

//Editable stuff for custom laser.
//4 colors from outside in. Normal meltdown laser has trasnparrency 55 -> aa -> ff (no transparrency) -> ff(no transparrency)
var colors = [Color.valueOf("e69a2755"), Color.valueOf("eda332aa"), Color.valueOf("f2ac41"), Color.valueOf("ffbb54")];
var length = 32;
const burnRadius = 36;

//Stuff you probably shouldn't edit.
//Width of each section of the beam from thickest to thinnest
var tscales = [1, 0.7, 0.5, 0.2];
//Overall width of each color
var strokes = [burnRadius/2, burnRadius/2.5, burnRadius/3.3333, burnRadius/5];
//Determines how far back each section in the start should be pulled
var pullscales = [1, 1.12, 1.15, 1.17];
//Determines how far each section of the end should extend past the main thickest section
var lenscales = [1, 1.3, 1.6, 1.9];

var tmpColor = new Color();
const vec = new Vec2();
const lavaBack = new Vec2();

const magmaPool = extend(BasicBulletType, {
  update(b){
    if(b != null){
      if(b.owner.targetPos != null){
        var target = Angles.angle(b.x, b.y, b.owner.targetPos.x, b.owner.targetPos.y);
        b.rotation(Mathf.slerpDelta(b.rotation(), target, 0.15));
      }
      
      if(b.timer.get(1, 5)){
        Damage.damage(b.team, b.x, b.y, burnRadius, this.damage, true);
      }
      
      Puddles.deposit(Vars.world.tileWorld(b.x, b.y), Liquids.slag, 100000);
      Puddles.deposit(Vars.world.tileWorld(b.x, b.y), Liquids.oil, 99000);
    }
  },
  draw(b){
    if(b != null){
      //ring
      Draw.color(Color.valueOf("e3931b"));
      Draw.alpha(b.fout());
      Lines.stroke(2);
      Lines.circle(b.x, b.y, burnRadius);
      
      //"fountain" of lava
      for(var s = 0; s < 4; s++){
        Draw.color(tmpColor.set(colors[s]).mul(1.0 + Mathf.absin(Time.time() / 3 + Mathf.randomSeed(b.id), 1.0, 0.3) / 3));
        Draw.alpha(b.fout());
        Fill.circle(b.x, b.y, strokes[s] * 2);
        for(var i = 0; i < 4; i++){
          var baseLen = (length + (Mathf.absin(Time.time() / ((i + 1) * 2) + Mathf.randomSeed(b.id), 0.8, 1.5) * (length / 1.5))) * b.fout();
          lavaBack.trns(90, (pullscales[i] - 1.0) * 55.0);
          Lines.stroke(4 * strokes[s] * tscales[i]);
          Lines.lineAngle(b.x + lavaBack.x, b.y + lavaBack.y, 90, baseLen * b.fout() * lenscales[i], false);
        };
      };
      Draw.reset();
    };
  }
});

magmaPool.speed = 2;
magmaPool.lifetime = 16;
magmaPool.damage = 75;
magmaPool.collides = false;
magmaPool.collidesTiles = false;
magmaPool.hitEffect = Fx.fireballsmoke;
magmaPool.despawnEffect = Fx.none;
magmaPool.shootEffect = Fx.none;
magmaPool.smokeEffect = Fx.none;
magmaPool.hittable = false;

//Got some help from EoD for the turning LaserTurret into PowerTurret part
const lavaRiser = extendContent(PowerTurret, "eruptor-ii", {
  load(){
    this.cells = [];
    this.heatRegions = [];
    this.bottomCaps = [];
    this.topCaps = [];
    this.outlines = [];
    
    this.baseRegion = Core.atlas.find("block-4");
    this.turretRegion = Core.atlas.find(this.name + "-turret");
    for(var i = 0; i < 3; i++){
      this.cells[i] = Core.atlas.find(this.name + "-cells-" + i);
      this.heatRegions[i] = Core.atlas.find(this.name + "-heat-" + i);
    }
    for(var i = 0; i < 4; i++){
      this.bottomCaps[i] = Core.atlas.find(this.name + "-caps-0-" + i);
      this.topCaps[i] = Core.atlas.find(this.name + "-caps-1-" + i);
    }
    for(var i = 0; i < 9; i++){
      this.outlines[i] = Core.atlas.find(this.name + "-outline-" + i);
    }
  },
  icons(){
    return [
      Core.atlas.find("block-4"),
      Core.atlas.find(this.name + "-icon")
    ];
  }
});

lavaRiser.shootType = magmaPool;
lavaRiser.shootDuration = 240;
lavaRiser.range = 280;
lavaRiser.reloadTime = 90;
lavaRiser.rotateSpeed = 2.25;
lavaRiser.recoilAmount = 6;
lavaRiser.COA = 0.9;
lavaRiser.cellHeight = 1;
lavaRiser.firingMoveFract = 0.8;
lavaRiser.shootEffect = Fx.none;
lavaRiser.smokeEffect = Fx.none;
lavaRiser.ammoUseEffect = Fx.none;
lavaRiser.capClosing = 0.01;
lavaRiser.heatColor = Color.valueOf("f08913");

const shootLoc = new Vec2();

lavaRiser.buildType = () => {
	var magmaEntity = extendContent(PowerTurret.PowerTurretBuild, lavaRiser, {
		setEff(){
			this._bullet = null;
			this._bulletLife = 0;
      this._cellOpenAmounts = [0, 0];
    },
    draw(){
      const open = new Vec2();
      const back = new Vec2();
      const trnsX = [-1, 1, -1, 1];
      const trnsY = [-1, -1, 1, 1];
      const trnsYflat = [0, 0, 1, 1];
      
      Draw.rect(lavaRiser.baseRegion, this.x, this.y, 0);
      
      Draw.z(Layer.turret);
      
      back.trns(this.rotation - 90, 0, this.recoil);
      
      Draw.rect(lavaRiser.outlines[0], this.x + back.x, this.y + back.y, this.rotation - 90);
      
      //Bottom Layer Cell Outlines
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[1] * trnsX[i], this._cellOpenAmounts[1] * trnsY[i]);
        Draw.rect(lavaRiser.outlines[i + 1], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
      }
      
      //Top Layer Cell Outlines
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[0] * trnsX[i], this._cellOpenAmounts[0] * trnsYflat[i]);
        Draw.rect(lavaRiser.outlines[i + 5], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
      }
      
      Drawf.shadow(lavaRiser.turretRegion, this.x + back.x - (lavaRiser.size / (1 + (1/3))), this.y + back.y - (lavaRiser.size / (1 + (1/3))), this.rotation - 90);
      Draw.rect(lavaRiser.turretRegion, this.x + back.x, this.y + back.y, this.rotation - 90);
      
      if(this.heat > 0.00001){
        Draw.blend(Blending.additive);
        Draw.color(lavaRiser.heatColor, this.heat);
        Draw.rect(lavaRiser.heatRegions[0], this.x + back.x, this.y + back.y, this.rotation - 90);
        Draw.blend();
        Draw.color();
      }
      
      //Bottom Layer Cells
      Drawf.shadow(lavaRiser.cells[0], this.x + back.x - lavaRiser.cellHeight, this.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[1] * trnsX[i], this._cellOpenAmounts[1] * trnsY[i]);
        Drawf.shadow(lavaRiser.bottomCaps[i], this.x + open.x + back.x - lavaRiser.cellHeight, this.y + open.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      }
      
      Draw.rect(lavaRiser.cells[0], this.x + back.x, this.y + back.y, this.rotation - 90);
      
      if(this.heat > 0.00001){
        Draw.blend(Blending.additive);
        Draw.color(lavaRiser.heatColor, this.heat);
        Draw.rect(lavaRiser.heatRegions[1], this.x + back.x, this.y + back.y, this.rotation - 90);
        Draw.blend();
        Draw.color();
      }
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[1] * trnsX[i], this._cellOpenAmounts[1] * trnsY[i]);
        Draw.rect(lavaRiser.bottomCaps[i], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
      }
      
      //Top Layer Cells
      Drawf.shadow(lavaRiser.cells[1], this.x + open.x + back.x - lavaRiser.cellHeight, this.y + open.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[0] * trnsX[i], this._cellOpenAmounts[0] * trnsYflat[i]);
        Drawf.shadow(lavaRiser.topCaps[i], this.x + open.x + back.x - lavaRiser.cellHeight, this.y + open.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      }
      
      Draw.rect(lavaRiser.cells[1], this.x + back.x, this.y + back.y, this.rotation - 90);
      
      if(this.heat > 0){
        Draw.blend(Blending.additive);
        Draw.color(lavaRiser.heatColor, this.heat);
        Draw.rect(lavaRiser.heatRegions[2], this.x + back.x, this.y + back.y, this.rotation - 90);
        Draw.blend();
        Draw.color();
      }
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[0] * trnsX[i], this._cellOpenAmounts[0] * trnsYflat[i]);
        Draw.rect(lavaRiser.topCaps[i], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
      }
    },
    setStats(){
      this.super$setStats();
      
      this.stats.remove(BlockStat.inaccuracy);
      this.stats.remove(BlockStat.damage);
      //damages every 5 ticks
      this.stats.add(BlockStat.damage, lavaRiser.shootType.damage * 60 / 5, StatUnit.perSecond);
    },
    updateTile(){
      this.super$updateTile();
      
      if(this._bulletLife <= 0 && this._bullet == null){
        for(var i = 0; i < 2; i ++){
          this._cellOpenAmounts[i] = Mathf.lerpDelta(this._cellOpenAmounts[i], 0, lavaRiser.capClosing);
        }
      }
      
      if(this._bulletLife > 0 && this._bullet != null){
        this._bullet.time = 0;
        this.heat = 1;
        this.recoil = lavaRiser.recoilAmount;
        this._cellOpenAmounts[0] = Mathf.lerpDelta(this._cellOpenAmounts[0], lavaRiser.COA * Mathf.absin(this._bulletLife / 6 + Mathf.randomSeed(this._bullet.id), 0.8, 1), 0.6);
        this._cellOpenAmounts[1] = Mathf.lerpDelta(this._cellOpenAmounts[1], lavaRiser.COA * Mathf.absin(-this._bulletLife / 6 + Mathf.randomSeed(this._bullet.id), 0.8, 1), 0.6);
        this._bulletLife = this._bulletLife - Time.delta;
        this.rotation = Angles.moveToward(this.rotation, Angles.angle(this.x, this.y, this._bullet.x, this._bullet.y), 360);
        
        shootLoc.trns(this.rotation, lavaRiser.size * 4 + this.recoil);
        
        var dist = Mathf.dst(this.x + shootLoc.x, this.y + shootLoc.y, this._bullet.x, this._bullet.y);
        var ang = Angles.angle(this.x + shootLoc.x, this.y + shootLoc.y, this._bullet.x, this._bullet.y);
        
        targetLightning.at(this.x + shootLoc.x, this.y + shootLoc.y, ang, colors[2], [dist]);
        
        if(this._bulletLife <= 0){
          this._bullet = null;
        }
      }
    },
    updateShooting(){
      if(this._bulletLife > 0 && this._bullet != null){
        return;
      }
      
      if(this.reload >= lavaRiser.reloadTime){
        var type = this.peekAmmo();
        
        this.shoot(type);
        
        this.reload = 0;
        this._bulletLife = lavaRiser.shootDuration;
      }else{
        this.reload += this.delta() * this.baseReloadSpeed();
      }
    },
    bullet(type, angle){
      const bullet = type.create(this, this.team, this.targetPos.x, this.targetPos.y, angle);
      
      this._bullet = bullet;
    },
    turnToTarget(targetRot){
      if(this._bulletLife <= 0){
        this.rotation = Angles.moveToward(this.rotation, targetRot, this.efficiency() * lavaRiser.rotateSpeed * this.delta() * (this._bulletLife > 0 ? lavaRiser.firingMoveFract : 1));
      }
    },
    shouldActiveSound(){
      return this._bulletLife > 0 && this._bullet != null;
    }
	});
	magmaEntity.setEff();
	return magmaEntity;
};