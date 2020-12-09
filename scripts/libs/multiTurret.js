module.exports = {
  newMount(n){
    /*Notes: Too lazy to do charging, or continuous.*/
    const mount = {
      x: 0,
      y: 0,
      shootX: 0,
      xRand: 0,
      shootY: 0,
      yRand: 0,
      width: 3,
      height: 3,
      elevation: 1,
      
      reloadTime: 30,
      ammoTypes: null,
      maxAmmo: 30,
      ammoPerShot: 1,
      range: 80,
      rotateSpeed: 5,
      inaccuracy: 0,
      velocityInaccuracy: 0,
      shootCone: 8,
      targetAir: true,
      targetGround: true,
      
      recoilAmount: 1,
      restitution: 0.02,
      heatColor: Pal.turretHeat,
      cooldown: 0.02,
      
      name: n,
      title: "ohno",
      icon: "error",
      
      shootEffect: Fx.none,
      smokeEffect: Fx.none,
      coolEffect: Fx.fuelburn,
      ejectEffect: Fx.none,
      ejectX: 1,
      ejectY: -1,
      altEject: true,
      ejectRight: true,
      shootSound: Sounds.pew,
      loopSound: Sounds.none,
      loopVolume: 1,
      shootShake: 0,
      
      minRange: 0,
      shots: 1,
      barrels: 1,
      barrelSpacing: 0,
      sequential: false,
      spread: 0,
      burstSpacing: 0,
      
      unitSort: (u, x, y) => Mathf.dst(u.x, u.y, x, y)
    };
    
    return mount;
  },
  newMultiTurret(name, mounts, ammoItem, mainBullet, rangeTime, fadeTime, title){
    const numberOfMounts = mounts.length;
    const totalRangeTime = rangeTime * numberOfMounts;
    const newMountListValue = require("libs/newMountListValue");
    const newBaseListValue = require("libs/newBaseListValue");
    
    const multiTur = extendContent(ItemTurret, name, {
      load(){
        this.baseRegion = Core.atlas.find(this.name + "-base", "block-" + this.size);
        this.region = Core.atlas.find(this.name + "-baseTurret");
        this.heatRegion = Core.atlas.find(this.name + "-heat");
        this.outline = Core.atlas.find(this.name + "-outline");
        this.baseTurret = Core.atlas.find(this.name + "-baseTurret");
        this.turrets = [];
        this.loopSounds = [];
        for(var i = 0; i < numberOfMounts; i++){
          var curMount = mounts[i];
          
          //[Sprite, Outline, Heat, Fade Mask, Full]
          var sprites = [Core.atlas.find(mounts[i].name), 
          Core.atlas.find(curMount.name + "-outline"),
          Core.atlas.find(curMount.name + "-heat"), 
          Core.atlas.find(curMount.name + "-mask"),
          Core.atlas.find(curMount.name + "-full")];
          this.turrets[i] = sprites;
          
          this.loopSounds[i] = (curMount.loopSound == Sounds.none ? null : new SoundLoop(curMount.loopSound, curMount.loopVolume));
        }
      },
      drawPlace(x ,y ,rotation, valid){
        this.super$drawPlace(x, y, rotation, valid);
        for(var i = 0; i < numberOfMounts; i++){
          var curMount = mounts[i];
          var fade = Mathf.curve(Time.time % totalRangeTime, rangeTime * i, rangeTime * i + fadeTime) - Mathf.curve(Time.time % totalRangeTime, rangeTime * (i + 1) - fadeTime, rangeTime * (i + 1));
          
          var tX = x * Vars.tilesize + this.offset + curMount.x;
          var tY = y * Vars.tilesize + this.offset + curMount.y;
          //Drawf.dashCircle(Loc[0], Loc[1], curMount.range, Pal.placing); //I already know this'll be terrible in game.
          Lines.stroke(3, Pal.gray);
          Draw.alpha(fade);
          Lines.dashCircle(tX, tY, curMount.range);
          Lines.stroke(1, Vars.player.team().color);
          Draw.alpha(fade);
          Lines.dashCircle(tX, tY, curMount.range);
          
          Draw.color(Vars.player.team().color, fade);
          Draw.rect(this.turrets[i][3], tX, tY);
          Draw.reset();
        }
      },
      icons(){
        return[this.baseRegion, Core.atlas.find(this.name + "-icon")]
      },
      setStats(){
        this.super$setStats();
        
        this.stats.remove(Stat.shootRange);
        this.stats.remove(Stat.inaccuracy);
        this.stats.remove(Stat.reload);
        this.stats.remove(Stat.ammo);
        this.stats.remove(Stat.targetsAir);
        this.stats.remove(Stat.targetsGround);
        
        const wT = new StatValue({
          display(table){
            table.add();
            table.row();
            table.left();
            table.add("[lightgray]" + "Base Turret").fillX().padLeft(24);
            table.row();
            
            //Base Turret
            table.table(null, w => {
              const baseT = newBaseListValue(multiTur, multiTur.baseTurret, mainBullet, title);
              baseT.display(w);
              table.row();
            });
            
            table.row();
            table.left();
            table.add("[lightgray]" + "Mini Turrets").fillX().padLeft(24);
            
            //Mounts
            table.table(null, w => {
              const baseT = newMountListValue(mounts);
              baseT.display(w);
              table.row();
            });
          }
        });
        
        this.stats.add(Stat.weapons, wT);
      }/*,
      setBars(bars){
        bars.add("health", entity => new Bar("stat.health", Pal.health, entity.health).blink(Color.white));
        if(multiTur.hasLiquids){
          var current;
          if(multiTur.consumes.has(ConsumeType.liquid) && multiTur.consumes.get(ConsumeType.liquid) instanceof ConsumeLiquid){
            var liquid = consumes.get(ConsumeType.liquid).liquid;
            var current = entity => liquid;
          }else{
            var current = entity => entity.liquids == null ? Liquids.water : entity.liquids.current();
          }
          bars.add("liquid", entity => new Bar(() => entity.liquids.get(current.get(entity)) <= 0.001 ? Core.bundle.get("bar.liquid") : current.get(entity).localizedName, () => current.get(entity).barColor(), () => entity == null || entity.liquids == null ? 0 : entity.liquids.get(current.get(entity)) / multiTur.liquidCapacity));
        }
        bars.image(multiTur.baseTurret).size(3*8).left.top;
        bars.add("ammo", entity => new Bar(() => entity.totalAmmo / multiTur.maxAmmo));
        for(var i = 0; i < numberOfMounts; i++){
          bars.image(multiTur.turrets[i][4]).size(3*8).left.top;
          bars.add("ammo", entity => new Bar(() => entity._totalAmmos[i] / mounts[i].maxAmmo));
        }
      }*/
    });
    
    multiTur.ammo(ammoItem, mainBullet);
    multiTur.mountTimer = multiTur.timers++;
    multiTur.mountInterval = 20;
    
    multiTur.buildType = ent => {
      ent = extendContent(ItemTurret.ItemTurretBuild, multiTur, {
        setEffs(){
          this._reloads = [];
          this._heats = [];
          this._recoils = [];
          this._shotCounters = [];
          this._rotations = [];
          this._targets = [];
          this._targetPoss = [];
          this._wasShootings = [];
          this._totalAmmos = [];
          this._ammos = [];
          this._ammoTypes = [];
          for(var i = 0; i < numberOfMounts; i++){
            this._reloads[i] = 0;
            this._heats[i] = 0;
            this._recoils[i] = 0;
            this._shotCounters[i] = 0;
            this._rotations[i] = 90;
            this._targets[i] = null;
            this._targetPoss[i] = new Vec2();
            this._wasShootings[i] = false;
            this._totalAmmos[i] = 0;
            this._ammos[i] = new Seq();
            this._ammoTypes[i] = new ObjectMap;
          }
        },
        drawSelect(){
          this.super$drawSelect();
          for(var i = 0; i < numberOfMounts; i++){
            var fade = Mathf.curve(Time.time % totalRangeTime, rangeTime * i, rangeTime * i + fadeTime) - Mathf.curve(Time.time % totalRangeTime, rangeTime * (i + 1) - fadeTime, rangeTime * (i + 1));
            let loc = this.mountLocations(i);
            var curMount = mounts[i];
            
            Lines.stroke(3, Pal.gray);
            Draw.alpha(fade);
            Lines.dashCircle(loc[0], loc[1], curMount.range);
            Lines.stroke(1, this.team.color);
            Draw.alpha(fade);
            Lines.dashCircle(loc[0], loc[1], curMount.range);
          
            Draw.color(this.team.color, fade);
            Draw.rect(multiTur.turrets[i][3], loc[2], loc[3], this._rotations[i] - 90);
            Draw.reset();
          }
        },
        mountLocations(mount){
          var curMount = mounts[mount];
          
          Tmp.v1.trns(this.rotation - 90, curMount.x, curMount.y - this.recoil);
          Tmp.v1.add(this.x, this.y);
          Tmp.v2.trns(this._rotations[mount], -this._recoils[mount]);
          var i = (this._shotCounters[mount] % curMount.barrels) - (curMount.barrels - 1) / 2;
          Tmp.v3.trns(this._rotations[mount] - 90, curMount.shootX + curMount.barrelSpacing * i + curMount.xRand, curMount.shootY + curMount.yRand);
          
          var x = Tmp.v1.x;
          var y = Tmp.v1.y;
          var rX = x + Tmp.v2.x;
          var rY = y + Tmp.v2.y;
          var sX = rX + Tmp.v2.x;
          var sY = rY + Tmp.v2.y;
          
          return [x, y, rX, rY, sX, sY];
        },
        draw(){
          Draw.rect(multiTur.baseRegion, this.x, this.y);
          
          Draw.z(Layer.turret);
          Tmp.v4.trns(this.rotation, -this.recoil);
          Tmp.v4.add(this.x, this.y);
          
          Drawf.shadow(multiTur.region, Tmp.v4.x - multiTur.size * 2, Tmp.v4.y - multiTur.size * 2, this.rotation - 90);
          Draw.rect(multiTur.outline, Tmp.v4.x, Tmp.v4.y, this.rotation - 90);
          Draw.rect(multiTur.region, Tmp.v4.x, Tmp.v4.y, this.rotation - 90);
          
          if(multiTur.heatRegion != Core.atlas.find("error") && this._heat > 0.00001){
            Draw.color(multiTur.heatColor, this._heat);
            Draw.blend(Blending.additive);
            Draw.rect(multiTur.heatRegion, Tmp.v4.x, Tmp.v4.y, this.rotation - 90);
            Draw.blend();
            Draw.color();
          }
          
          for(var i = 0; i < numberOfMounts; i++){
            let loc = this.mountLocations(i);
            var curMount = mounts[i];
            
            Drawf.shadow(multiTur.turrets[i][0], loc[2] - curMount.elevation, loc[3] - curMount.elevation, this._rotations[i] - 90);
          }
          
          for(var i = 0; i < numberOfMounts; i++){
            let loc = this.mountLocations(i);
            
            Draw.rect(multiTur.turrets[i][1], loc[2], loc[3], this._rotations[i] - 90);
            Draw.rect(multiTur.turrets[i][0], loc[2], loc[3], this._rotations[i] - 90);
            
            if(multiTur.turrets[i][2] != Core.atlas.find("error") && this._heats[i] > 0.00001){
              Draw.color(mounts[i].heatColor, this._heats[i]);
              Draw.blend(Blending.additive);
              Draw.rect(multiTur.turrets[i][2], loc[2], loc[3], this._rotations[i] - 90);
              Draw.blend();
              Draw.color();
            }
          }
        },
        update(){
          this.super$update();
          
          for(var i = 0; i < numberOfMounts; i++){
            if(!Vars.headless){
              let loc = this.mountLocations(i);
                
              if(multiTur.loopSounds[i] != null){
                multiTur.loopSounds[i].update(loc[4], loc[5], this.mountLoopSound(i));
              }
            }
          }
        },
        updateTile(){
          this.super$updateTile();
          
          for(var i = 0; i < numberOfMounts; i++){
            var curMount = mounts[i];
            
            this._wasShootings[i] = false;
            this._recoils[i] = Mathf.lerpDelta(this._recoils[i], 0, curMount.restitution);
            this._heats[i] = Mathf.lerpDelta(this._heats[i], 0, curMount.cooldown);
            
            if(!this.validateMountTarget(i)) this._targets[i] = null;
            
            /*print(curMount.name + " ammo amount: " + this._totalAmmos[i]);
            print(curMount.name + " ammo max: " + curMount.maxAmmo);
            var a = this._totalAmmos[i] / curMount.maxAmmo;
            print(curMount.name + " ammo amount percent: " + a);*/
          }
          
          if(this.hasAmmo()){
            if(this.timer.get(multiTur.mountTimer, multiTur.mountInterval)){
              for(var i = 0; i < numberOfMounts; i++){
                let loc = this.mountLocations(i);
                
                this._targets[i] = this.findMountTargets(i);
              }
            }
            
            for(var i = 0; i < numberOfMounts; i++){
              let loc = this.mountLocations(i);
              
              if(this.validateMountTarget(i)){
                var canShoot = true;

                if(this.isControlled()){ //player behavior
                  this._targetPoss[i].set(this.unit.aimX, this.unit.aimY);
                  canShoot = this.unit.isShooting;
                }else if(this.logicControlled()){ //logic behavior
                  this._targetPoss[i] = this.targetPos;
                  canShoot = this.logicShooting;
                }else{ //default AI behavior
                  this.mountTargetPosition(i, this._targets[i], loc[0], loc[1]);

                  if(isNaN(this._rotations[i])){
                    this._rotations[i] = 0;
                  }
                }

                var targetRot = Angles.angle(loc[0], loc[1], this._targetPoss[i].x, this._targetPoss[i].y);

                this.mountTurnToTarget(i, targetRot);

                if(Angles.angleDist(this._rotations[i], targetRot) < mounts[i].shootCone && canShoot){
                  this.wasShooting = true;
                  this._wasShootings[i] = true;
                  this.updateMountShooting(i);
                }
              }
            }
          }
        },
        turnToTarget(target){
          this.super$turnToTarget(target);
          var speed = multiTur.rotateSpeed * this.delta() * this.baseReloadSpeed()
          var dist = Math.abs(Angles.angleDist(this.rotation, target));
          
          if(dist < speed) return;
          var angle = Mathf.mod(this.rotation, 360);
          var to = Mathf.mod(target, 360);

          if((angle > to && Angles.backwardDistance(angle, to) > Angles.forwardDistance(angle, to)) || (angle < to && Angles.backwardDistance(angle, to) < Angles.forwardDistance(angle, to))){
            var allRot = -speed;
          }else{
            var allRot = speed;
          }
          
          for(var i = 0; i < numberOfMounts; i++){
            this._rotations[i] = (this._rotations[i] + allRot) % 360;;
          }
        },
        mountTurnToTarget(mount, target){
          this._rotations[mount] = Angles.moveToward(this._rotations[mount], target, mounts[mount].rotateSpeed * this.delta() * this.baseReloadSpeed());
        },
        findMountTargets(mount){
          let loc = this.mountLocations(mount);
          var curMount = mounts[mount];
          
          if(curMount.targetAir && !curMount.targetGround){
            return Units.bestEnemy(this.team, loc[0], loc[1], curMount.range, e => !e.dead && !e.isGrounded(), curMount.unitSort);
          }else{
            return Units.bestTarget(this.team, loc[0], loc[1], curMount.range, e => !e.dead && (e.isGrounded() || curMount.targetAir) && (!e.isGrounded() || curMount.targetGround), b => true, curMount.unitSort);
          }
        },
        validateMountTarget(mount){
          let loc = this.mountLocations(mount);
          
          return !Units.invalidateTarget(this._targets[mount], this.team, loc[0], loc[1]) || this.isControlled() || this.logicControlled();
        },
        mountTargetPosition(mount, pos, x, y){
          if(!this.mountHasAmmo()) return;
          var bullet = this.mountPeekAmmo(mount);
          var speed = bullet.speed;
          //slow bullets never intersect
          if(speed < 0.1) speed = 9999999;
          
          this._targetPoss[mount].set(Predict.intercept(Tmp.v4.set(x, y), pos, speed));
          
          if(this._targetPoss[mount].isZero()){
            this._targetPoss[mount].set(this._targets[mount]);
          }
        },
        updateMountShooting(mount){
          var type = this.mountPeekAmmo(mount);
          if(this._reloads[mount] >= mounts[mount].reloadTime){
            this.mountShoot(mount, type);
            
            this._reloads[mount] = 0;
          }else{
            this._reloads[mount] += this.delta() * type.reloadMultiplier * this.baseReloadSpeed();
          }
        },
        updateCooling(){
          this.super$updateCooling();
          
          var maxUsed = multiTur.consumes.get(ConsumeType.liquid).numberOfMounts / numberOfMounts;

          var liquid = this.liquids.current();
          
          for(var i = 0; i < numberOfMounts; i++){
            var curMount = mounts[i];
            
            var used = Math.min(Math.min(this.liquids.get(liquid), maxUsed * Time.delta), Math.max(0, ((curMount.reloadTime - this._reloads[i]) / multiTur.coolantMultiplier) / liquid.heatCapacity)) * this.baseReloadSpeed();
            this._reloads[i] += used * liquid.heatCapacity * multiTur.coolantMultiplier;
            
            this.liquids.remove(liquid, used);
            
            let loc = this.mountLocations(i);
            
            if(Mathf.chance(0.06 / numberOfMounts * used)){
              curMount.coolEffect.at(loc[0] + Mathf.range(curMount.width), loc[1] + Mathf.range(curMount.height));
            }
          }
        },
        mountShoot(mount, type){
          var cMount = mounts[mount];
          for(var j = 0; j < cMount.shots; j++){
            const spreadAmount = j;
            const curMount = mounts[mount];
            Time.run(cMount.burstSpacing * j, () => {
              if(!this.isValid() || !this.hasAmmo()) return;
              
              let loc = this.mountLocations(mount);
              
              if(curMount.shootShake > 0){
                Effect.shake(curMount.shootShake, curMount.shootShake, loc[4], loc[y]);
              }
              
              var fshootEffect = curMount.shootEffect == Fx.none ? type.shootEffect : curMount.shootEffect;
              var fsmokeEffect = curMount.smokeEffect == Fx.none ? type.smokeEffect : curMount.smokeEffect;

              fshootEffect.at(loc[4], loc[5], this._rotations[mount]);
              fsmokeEffect.at(loc[4], loc[5], this._rotations[mount]);
              
              curMount.shootSound.at(loc[4], loc[5], Mathf.random(0.9, 1.1));
              
              this._recoils[mount] = curMount.recoilAmount;
              this._heats[mount] = 1;
              
              this.mountUseAmmo(mount);
              if(curMount.loopSound != Sounds.none){
                multiTur.loopSounds[mount].update(loc[4], loc[5], true);
              }
              
              var velScl = 1 + Mathf.range(curMount.velocityInaccuracy);
              var lifeScl = type.scaleVelocity ? Mathf.clamp(Mathf.dst(loc[4], loc[5], this._targetPoss[mount].x, this._targetPoss[mount].y) / type.range(), curMount.minRange / type.range(), curMount.range / type.range()) : 1;
              var angle = this._rotations[mount] + Mathf.range(curMount.inaccuracy + type.inaccuracy) + (spreadAmount - (curMount.shots / 2)) * curMount.spread;
              
              type.create(this, this.team, loc[4], loc[5], angle, velScl, lifeScl);
              
              if(curMount.sequential){
                this._shotCounters[mount]++;
              }
            });
          }
          
          if(!curMount.sequential){
            this._shotCounters[mount]++;
          }
        },
        mountUseAmmo(mount){
          if(this.cheating()) return this.mountPeekAmmo(mount);
          var ammo = this._ammos[mount];
          var curMount = mounts[mount];

          const entry = ammo.peek();
          entry.amount -= curMount.ammoPerShot;
          if(entry.amount <= 0) ammo.pop();
          this._totalAmmos[mount] -= curMount.ammoPerShot;
          this._totalAmmos[mount] = Mathf.maxZero(this._totalAmmos[mount]);
          this.mountEjectEffects(mount);
          return entry.type();
        },
        mountEjectEffects(mount){
          if(!this.isValid()) return;
          var curMount = mounts[mount];
          
          var side = curMount.altEject ? Mathf.signs[this._shotCounters[mount] % 2] : curMount.ejectRight;
          let loc = this.mountLocations(mount);
          
          curMount.ejectEffect.at(loc[4], loc[5], this._rotations[mount] * side);
        },
        mountLoopSound(mount){
          return this._wasShootings[mount];
        },
        acceptItem(source, item){
          var type = multiTur.ammoTypes.get(item);
          var accept = true;
          
          if(type != null){
            accept = this.totalAmmo + type.ammoMultiplier <= multiTur.maxAmmo;
          }
          
          if(accept){
            for(var i = 0; i < numberOfMounts; i++){
              var curMount = mounts[i];
              var type = curMount.ammoTypes.get(item);
              if(type != null){
                accept = this._totalAmmos[i] + type.ammoMultiplier <= curMount.maxAmmo;
              }
              if(!accept){
                continue;
              }
            }
          }
          
          return accept;
        },
        acceptStack(item, amount, source){
          var type = multiTur.ammoTypes.get(item);
          var accept = 0;
          
          if(type != null){
            accept = Math.min((multiTur.maxAmmo - this.totalAmmo) / type.ammoMultiplier, amount);
          }else{
            accept = amount;
          }
          
          for(var i = 0; i < numberOfMounts; i++){
            var curMount = mounts[i];
            var type = curMount.ammoTypes.get(item);
            if(type != null){
              accept = Math.min(accept, (curMount.maxAmmo - this._totalAmmos[i]) / type.ammoMultiplier);
            }
          }
          
          return accept;
        },
        handleItem(source, item){
          //Copy vanilla code over.
          if(item == Items.pyratite){
            Events.fire(Trigger.flameAmmo);
          }

          var type = multiTur.ammoTypes.get(item);
          if(type != null){
            this.totalAmmo += type.ammoMultiplier;

            //find ammo entry by type
            for(var i = 0; i < this.ammo.size; i++){
              var entry = this.ammo.get(i);

              //if found, put it to the right
              if(entry.item == item){
                entry.amount += type.ammoMultiplier;
                this.ammo.swap(i, this.ammo.size - 1);
                continue;
              }
            }
            
            /*var a = new ObjectMap();
            a.put(0, item);
            a.put(1, type.ammoMultiplier);
            a.put(2, type);*/
            
            var a = new ItemTurret.ItemEntry;
            a.item = item;
            a.amount = type.ammoMultiplier;
            
            //must not be found
            this.ammo.add(a);
          }
          
          //Mount ammos;
          for(var i = 0; i < numberOfMounts; i++){
            var type = mounts[i].ammoTypes.get(item);
            if(type != null){
              this._totalAmmos[i] += type.ammoMultiplier;
              var ammo = this._ammos[i];
              
              //find ammo entry by type
              for(var j = 0; j < ammo.size; j++){
                var entry = ammo.get(j);

                //if found, put it to the right
                if(entry.item == item){
                  entry.amount += type.ammoMultiplier;
                  ammo.swap(j, ammo.size - 1);
                  continue;
                }
              }
              
              //must not be found
              //ammo.add(new ItemTurret.ItemEntry(item, type.ammoMultiplier));
            }
          }
        },
        mountPeekAmmo(mount){
          return this._ammos[mount].peek().type();
        },
        mountHasAmmo(mount){
          var ammo = this._ammos[mount].peek();
          var curMount = mounts[mount];
          if(ammo.size >= 2 && ammo.peek().amount < curMount.ammoPerShot){
            ammo.pop();
          }
          return ammo.size > 0 && ammo.peek().amount >= curMount.ammoPerShot;
        },
        displayBars(bars){
          //bars.image(multiTur.baseTurret).size(3*8).left.top;
          //bars.row();
          this.super$displayBars(bars);
          bars.row();
          for(var i = 0; i < numberOfMounts; i++){
            bars.image(multiTur.turrets[i][4]).size(3 * 8).left.top;
            bars.add(new Bar("stat.ammo", Pal.ammo, () => this._totalAmmos[i] / mounts[i].maxAmmo)).growX();
            bars.row();
          }
        }
      });
      ent.setEffs();
      return ent;
    }
    multiTur.BaseEntry = extend(Turret.AmmoEntry, {
      /*entry(item, amount){
        this.item = item;
        this.amount = amount;
      },
      type(){
        return multiTur.ammoTypes.get(item);
      }*/
    });
    multiTur.MountEntry = extend(Turret.AmmoEntry, {
      
    });
    
    return multiTur;
  }
};