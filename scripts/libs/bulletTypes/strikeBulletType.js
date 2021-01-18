module.exports = {
  strikeBullet(autoDrop, autoDropRad, stopRad, resumeSeek, startOnOwner, givenData){
    const strike = extend(BasicBulletType, {
      init(b){
        if(!b) return;
        this.super$init(b);
        
        // (Owner x, Owner y, angle, reset speed)
        // Owner coords are placed in data in case it dies while the bullet is still active. Don't want null errors.
        if(!givenData){
          var x = startOnOwner ? b.owner.x : b.x;
          var y = startOnOwner ? b.owner.y : b.y;
          b.data = [x, y, 0, false];
        }
        b.fdata = -69420;
      },
      update(b){
        if(!b) return;
        
        var owner = b.owner;
        var x = b.data[0];
        var y = b.data[1];
        var rise = Interp.pow5In.apply(Mathf.curve(b.time, 0, this.riseTime));
        var rocket = Interp.pow5In.apply(Mathf.curve(b.time, 0, this.engineTime)) - Interp.pow5In.apply(Mathf.curve(b.time, this.engineTime, this.riseTime));
        if(this.weaveWidth > 0){
          var weave = Mathf.sin(b.time * this.weaveSpeed) * this.weaveWidth * Mathf.signs[Mathf.round(Mathf.randomSeed(b.id, 1))] * rise;
        }else{
          var weave = 0;
        }
        if(rise < 0.999 && Mathf.chanceDelta(this.smokeTrailChance)){
          Fx.rocketSmoke.at(x + weave + Mathf.range(this.trailRnd * rocket), y + rise * this.elevation + this.engineOffset + Mathf.range(this.trailRnd * rocket), this.trailSize * rocket);
        }
        
        var target = Units.closestTarget(b.team, b.x, b.y, this.homingRange, e => (e.isGrounded() && this.collidesGround) || (e.isFlying() && this.collidesAir), t => this.collidesGround);
        //Instant drop
        var dropTime = (1 - Mathf.curve(b.time, 0, this.riseTime)) + Mathf.curve(b.time, b.lifetime - this.fallTime, b.lifetime);
        if(autoDrop && dropTime == 0 && target != null){
          if(Mathf.within(b.x, b.y, target.x, target.y, autoDropRad)){
            b.time = b.lifetime - this.fallTime;
          }
        }
        //Stop/Start when over target
        if(target != null){
          var inRange = Mathf.within(b.x, b.y, target.x, target.y, stopRad);
          if(inRange && !b.data[3]){
            b.data[2] = b.vel.len();
            b.data[3] = true;
            b.vel.trns(b.vel.angle(), 0.001);
          }else if(!inRange && resumeSeek && b.data[3]){
            b.vel.trns(b.vel.angle(), b.data[2]);
            b.data[3] = false;
          }
        }
        
        if(this.homingPower > 0 && b.time >= this.homingDelay){
          if(target != null){
            b.vel.setAngle(Mathf.slerpDelta(b.rotation(), b.angleTo(target), this.homingPower));
          }
        }

        if(this.weaveMag > 0){
          var scl = Mathf.randomSeed(b.id, 0.9, 1.1);
          b.vel.rotate(Mathf.sin(b.time + Mathf.PI * this.weaveScale/2 * scl, this.weaveScale * scl, this.weaveMag) * Time.delta);
        }

        if(this.trailChance > 0){
          if(Mathf.chanceDelta(this.trailChance)){
            this.trailEffect.at(b.x, b.y, this.trailParam, this.teamTrail ? b.team.color : this.trailColor);
          }
        }
      },
      draw(b){
        //Variables
        var x = b.data[0];
        var y = b.data[1];
        var rise = Interp.pow5In.apply(Mathf.curve(b.time, 0, this.riseTime));
        var fadeOut = 1 - rise;
        var fadeIn = Mathf.curve(b.time, b.lifetime - this.fallTime, b.lifetime);
        var fall = 1 - fadeIn;
        var a = fadeOut + fadeIn;
        var rocket = Interp.pow5In.apply(Mathf.curve(b.time, 0, this.engineTime)) - Interp.pow5In.apply(Mathf.curve(b.time, this.engineTime, this.riseTime));
        var target = Mathf.curve(b.time, 0, 8) - Mathf.curve(b.time, b.lifetime - 8, b.lifetime);
        var rW = this.width * (1 + rise);
        var rH = this.height * (1 + rise);
        var fW = this.width * (1 + fall);
        var fH = this.height * (1 + fall);
        Tmp.v1.trns(225, rise * this.elevation * 2);
        Tmp.v2.trns(225, fall * this.elevation * 2);
        var rY = y + rise * this.elevation;
        var fY = b.y + fall * this.elevation;
        var side = Mathf.signs[Mathf.round(Mathf.randomSeed(b.id, 1))];
        var weave = Mathf.sin(b.time * this.weaveSpeed) * this.weaveWidth * side;
        if(this.weaveWidth > 0){
          var rWeave = weave * rise;
          var fWeave = weave * fall;
          var rot = Mathf.sin(b.time * this.weaveSpeed / 2) * 45 * side;
        }else{
          var rWeave = 0;
          var fWeave = 0;
          var rot = 0;
        }
        var rX = x + rWeave;
        var fX = b.x + fWeave;
        
        //Target
        var radius = this.targetRad * target;
        var mis = this.sprite == "missile";
        var tY = mis ? rY + this.bulletOffset : rY;
        var bY = mis ? fY + this.bulletOffset : fY;
        var engineY = mis ? rY + this.engineOffset : rY;
        var tW = mis ? rW : this.frontRegion.width * Draw.scl, tH = mis ? rH : this.frontRegion.height * Draw.scl;
        var bW = mis ? fW : this.backRegion.width * Draw.scl, bH = mis ? fH : this.backRegion.height * Draw.scl;
        Draw.z(Layer.flyingUnitLow - 1);
        Draw.color(Pal.gray, target);
        Lines.stroke(3);
        Lines.poly(b.x, b.y, 4, 7 * radius, Time.time * 1.5 + Mathf.randomSeed(b.id, 360));
        Lines.spikes(b.x, b.y, 3 * radius, 6 * radius, 4, Time.time * 1.5 + Mathf.randomSeed(b.id, 360));
        Draw.color(b.team.color, target);
        Lines.stroke(1);
        Lines.poly(b.x, b.y, 4, 7 * radius, Time.time * 1.5 + Mathf.randomSeed(b.id, 360));
        Lines.spikes(b.x, b.y, 3 * radius, 6 * radius, 4, Time.time * 1.5 + Mathf.randomSeed(b.id, 360));
        Draw.reset;
        
        //Missile
        if(fadeOut > 0 && fadeIn == 0){
          //Engine stolen from launchpad
          Draw.z(Layer.weather - 2);
          Draw.color(Pal.engine);
          Fill.light(rX, engineY, 10, this.engineSize * 1.5625 * rocket, Tmp.c1.set(Pal.engine).mul(1, 1, 1, rocket), Tmp.c2.set(Pal.engine).mul(1, 1, 1, 0));
          for(var i = 0; i < 4; i++){
            Drawf.tri(rX, engineY, this.engineSize * 0.375, this.engineSize * 2.5 * rocket, i * 90 + (Time.time * 1.5 + Mathf.randomSeed(b.id, 360)));
          }
          Drawf.light(b.team, rX, engineY, this.engineLightRadius * rocket, this.engineLightColor, this.engineLightOpacity * rocket);
          //Missile itself
          Draw.z(Layer.weather - 1);
          if(mis){
            Draw.color(this.backColor, a);
            Draw.rect(this.backRegion, rX, rY + this.bulletOffset, rW, rH, rot);
          }
          if(mis){
            Draw.color(this.frontColor, a);
          }else{
            Draw.color();
          }
          Draw.rect(this.frontRegion, rX, tY, tW, tH, rot);
          Drawf.light(b.team, rX, tY, this.lightRadius, this.lightColor, this.lightOpacity);
          //Missile shadow
          Draw.z(Layer.flyingUnit + 1);
          Draw.color(0, 0, 0, 0.22 * a);
          Draw.rect(this.backRegion, rX + Tmp.v1.x, tY + Tmp.v1.y, tW, tH, rot + this.shadowRot);
        }else if(fadeOut == 0 && fadeIn > 0){
          //Missile itself
          Draw.z(Layer.weather - 1);
          if(mis){
            Draw.color(this.backColor, a);
          }else{
            Draw.color();
          }
          Draw.rect(this.backRegion, fX, bY, bW, bH, rot + 180);
          if(mis){
            Draw.color(this.frontColor, a);
            Draw.rect(this.frontRegion, fX, fY, fW, fH, rot + 180);
            Drawf.light(b.team, fX, bY, this.lightRadius, this.lightColor, this.lightOpacity);
          }
          //Missile shadow
          Draw.z(Layer.flyingUnit + 1);
          Draw.color(0, 0, 0, 0.22 * a);
          Draw.rect(this.backRegion, fX + Tmp.v2.x, bY + Tmp.v2.y, bW, bH, rot + this.shadowRot + 180);
        }

        Draw.reset();
      },
      drawLight(b){
      }
    });
    strike.sprite = "missile";
    strike.trailChance = 0.5;
    strike.smokeTrailChance = 0.75;
    strike.teamTrail = true;
    
    strike.shadowRot = 0;
    
    strike.weaveWidth = 0;
    strike.weaveSpeed = 0;
    
    strike.targetRad = 1;
    
    strike.engineTime = 0;
    strike.engineSize = 8;
    strike.engineOffset = 0;
    
    strike.bulletOffset = 8;
    
    strike.trailRnd = 3;
    strike.trailSize = 0.5;
    
    strike.riseTime = 60;
    strike.fallTime = 20;
    strike.elevation = 200;
    
    strike.collides = false;
    strike.hittable = false;
    strike.absorbable = false;
    
    strike.hitEffect = Fx.blockExplosionSmoke;
    strike.despawnEffect = Fx.massiveExplosion;
    strike.shootEffect = Fx.none;
    strike.smokeEffect = Fx.none;
    
    strike.lightRadius = 32;
    strike.lightOpacity = 0.6;
    strike.lightColor = Pal.engine;
    
    strike.engineLightRadius = 56;
    strike.engineLightOpacity = 0.8;
    strike.engineLightColor = Pal.engine;
    
    return strike;
  }
}