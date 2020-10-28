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
      if(b.owner.target != null){
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
    this.cellHeats = [];
    this.capsA = [];
    this.capsB = [];
    this.capsC = [];
    this.outlines = [];
    
    this.baseRegion = Core.atlas.find("block-4");
    this.turretRegion = Core.atlas.find(this.name + "-turret");
    for(var i = 0; i < 3; i++){
      this.cells[i] = Core.atlas.find(this.name + "-cells-" + i);
      this.cellHeats[i] = Core.atlas.find(this.name + "-cells-heat-" + i);
    }
    for(var i = 0; i < 4; i++){
      this.capsA[i] = Core.atlas.find(this.name + "-caps-0-" + i);
      this.capsB[i] = Core.atlas.find(this.name + "-caps-1-" + i);
      this.capsC[i] = Core.atlas.find(this.name + "-caps-2-" + i);
    }
    for(var i = 0; i < 13; i++){
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
lavaRiser.recoilAmount = 4;
lavaRiser.COA = 1.5;
lavaRiser.cellHeight = 1;
lavaRiser.firingMoveFract = 0.8;
lavaRiser.shootEffect = Fx.none;
lavaRiser.smokeEffect = Fx.none;
lavaRiser.ammoUseEffect = Fx.none;
lavaRiser.capClosing = 0.01;
lavaRiser.heatColor = Color.valueOf("f08913");

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
      const alternate = [1, 1, 0, 0];
      
      Draw.rect(lavaRiser.baseRegion, this.x, this.y, 0);
      
      Draw.z(Layer.turret);
      
      back.trns(this.rotation - 90, 0, -this.recoil);
      
      Draw.rect(lavaRiser.outlines[0], this.x + back.x, this.y + back.y, this.rotation - 90);
      
      //Bottom Layer Cell Outlines
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[alternate[i]] * trnsX[i], this._cellOpenAmounts[alternate[i]] * trnsY[i]);
        Draw.rect(lavaRiser.outlines[i + 1], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
      }
      
      //Mid Layer Cell Outlines
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[alternate[3 - i]] * trnsX[i], this._cellOpenAmounts[alternate[3 - i]] * trnsY[i]);
        Draw.rect(lavaRiser.outlines[i + 5], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
      }
      
      //Top Layer Cell Outlines
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[alternate[i]] * trnsX[i], this._cellOpenAmounts[alternate[i]] * trnsY[i]);
        Draw.rect(lavaRiser.outlines[i + 9], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
      }
      
      Drawf.shadow(lavaRiser.turretRegion, this.x + back.x - (lavaRiser.size / (1 + (1/3))), this.y + back.y - (lavaRiser.size / (1 + (1/3))), this.rotation - 90);
      Draw.rect(lavaRiser.turretRegion, this.x + back.x, this.y + back.y, this.rotation - 90);
      
      //Bottom Layer Cells
      Drawf.shadow(lavaRiser.cells[0], this.x + back.x - lavaRiser.cellHeight, this.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[alternate[i]] * trnsX[i], this._cellOpenAmounts[alternate[i]] * trnsY[i]);
        Drawf.shadow(lavaRiser.capsA[i], this.x + open.x + back.x - lavaRiser.cellHeight, this.y + open.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      }
      
      Draw.rect(lavaRiser.cells[0], this.x + back.x, this.y + back.y, this.rotation - 90);
      
      if(this.heat > 0.00001){
        Draw.blend(Blending.additive);
        Draw.color(lavaRiser.heatColor, this.heat);
        Draw.rect(lavaRiser.cellHeats[0], this.x + back.x, this.y + back.y, this.rotation - 90);
        Draw.blend();
        Draw.color();
      }
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[alternate[i]] * trnsX[i], this._cellOpenAmounts[alternate[i]] * trnsY[i]);
        Draw.rect(lavaRiser.capsA[i], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
      }
      
      //Mid Layer Cells
      Drawf.shadow(lavaRiser.cells[1], this.x + open.x + back.x - lavaRiser.cellHeight, this.y + open.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[alternate[3 - i]] * trnsX[i], this._cellOpenAmounts[alternate[3 - i]] * trnsY[i]);
        Drawf.shadow(lavaRiser.capsB[i], this.x + open.x + back.x - lavaRiser.cellHeight, this.y + open.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      }
      
      Draw.rect(lavaRiser.cells[1], this.x + back.x, this.y + back.y, this.rotation - 90);
      
      if(this.heat > 0){
        Draw.blend(Blending.additive);
        Draw.color(lavaRiser.heatColor, this.heat);
        Draw.rect(lavaRiser.cellHeats[1], this.x + back.x, this.y + back.y, this.rotation - 90);
        Draw.blend();
        Draw.color();
      }
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[alternate[3 - i]] * trnsX[i], this._cellOpenAmounts[alternate[3 - i]] * trnsY[i]);
        Draw.rect(lavaRiser.capsB[i], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
      }
      
      //Top Layer Cells
      Drawf.shadow(lavaRiser.cells[2], this.x + open.x + back.x - lavaRiser.cellHeight, this.y + open.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[alternate[i]] * trnsX[i], this._cellOpenAmounts[alternate[i]] * trnsY[i]);
        Drawf.shadow(lavaRiser.capsC[i], this.x + open.x + back.x - lavaRiser.cellHeight, this.y + open.y + back.y - lavaRiser.cellHeight, this.rotation - 90);
      }
      
      Draw.rect(lavaRiser.cells[2], this.x + back.x, this.y + back.y, this.rotation - 90);
      
      if(this.heat > 0){
        Draw.blend(Blending.additive);
        Draw.color(lavaRiser.heatColor, this.heat);
        Draw.rect(lavaRiser.cellHeats[2], this.x + back.x, this.y + back.y, this.rotation - 90);
        Draw.blend();
        Draw.color();
      }
      
      for(var i = 0; i < 4; i ++){
      open.trns(this.rotation - 90, this._cellOpenAmounts[alternate[i]] * trnsX[i], this._cellOpenAmounts[alternate[i]] * trnsY[i]);
        Draw.rect(lavaRiser.capsC[i], this.x + open.x + back.x, this.y + open.y + back.y, this.rotation - 90);
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
      this.rotation = Angles.moveToward(this.rotation, targetRot, this.efficiency() * lavaRiser.rotateSpeed * this.delta() * (this._bulletLife > 0 ? lavaRiser.firingMoveFract : 1));
    },
    shouldActiveSound(){
      return this._bulletLife > 0 && this._bullet != null;
    }
	});
	magmaEntity.setEff();
	return magmaEntity;
};