// Flocking

import { Color, Component, Entity, Player, PropsDefinition, Quaternion, Vec3 } from '@early_access_api/v1';
import { AppComponent,OnAppStartingEvent } from 'app';
import { FlockManager } from 'flockmanager';
import { app } from 'iapp';

const maxSpeed = 2
const maxForce = 10

function limit(v: Vec3, limit: number) {
    const mag = v.magnitude();
    if (mag > limit) {
        const factor = limit / mag
        if (Number.isFinite(factor)) {
            return v.mul(factor)
        }
    }
    return v
}

export class Flocker extends AppComponent<{}> {
    static propsDefinition: PropsDefinition<{}> = {}

    private _flockManager!: FlockManager
    private _velocity = new Vec3(0, 0, 0);
    private _acceleration = new Vec3(0, 0, 0);

    constructor() {
        super()
        console.log(`Flocker:constructor OnAppStartingEvent uniqueName is (${OnAppStartingEvent.uniqueName})`)
    }

    override onStart() {
        console.log(`Flocker:onStart`)
        this._flockManager = app().getService(FlockManager)
        console.log(`Flocker:onStarting this._flockManager = ${this._flockManager}`)
        this._flockManager.registerFlocker(this)
    }

    override onUpdate(dt: number) {
        if (Math.random () < 0.005) console.log(`Flocker#${this.entityId} [sampled]: onUpdate dt = ${dt}`)
        // n.b. this code was written with numbers in millisecond scale, so need to div 1000 here
        dt /= 1000;
        let cohesionWeight = 1
        let separationWeight = 3
        let seekingWeight = 2
        const cohesion = Vec3.mul(this.cohesion(), (cohesionWeight))
        //    console.log('cohesion: ', cohesion)e
        const separation = Vec3.mul(this.separation(), (separationWeight))
        //  console.log('separation: ', separation)
        const seeking = Vec3.mul(this.seeking(), (seekingWeight));
        //  console.log('seeking: ', seeking)
        if (Number.isNaN(cohesion.x) || Number.isNaN(cohesion.z)) {
            console.log("cohesion has NaN");
        }
        if (Number.isNaN(separation.x) || Number.isNaN(separation.z)) {
            console.log("separation has NaN");
        }
        if (Number.isNaN(seeking.x) || Number.isNaN(seeking.z)) {
            console.log("seeking has NaN");
        }
        this._acceleration = Vec3.add(cohesion, Vec3.add(separation, seeking))
        this.entity.position.set(Vec3.add(this.entity.position.get().clone(), (new Vec3(this.velocity().x * dt, 0, this.velocity().z * dt))))
        this._velocity = limit(Vec3.add(this._velocity, Vec3.mul(this.acceleration(), dt)), maxSpeed);
    }

    position() {
        return new Vec3(this.entity.position.get().x, 0, this.entity.position.get().z);
    }

    velocity() {
        return this._velocity;
    }

    acceleration() {
        return this._acceleration;
    }

    separation() {
        let v = new Vec3(0, 0, 0);
        let cnt = 0;
        for (let flocker of this._flockManager.flockers) {
            if (flocker == this) continue;
            let d = this.position().distance(flocker.position())
            if (d < 2) {
                const invDistSqr = 1 / (d * d);
                if (Number.isFinite(invDistSqr)) {
                    let diff = Vec3.sub(this.position(), flocker.position());
                    v = Vec3.add(v, Vec3.mul(diff, invDistSqr));
                    cnt++;
                }
            }
        }
        if (cnt > 0) {
            v = limit(Vec3.sub(Vec3.mul(Vec3.mul(v, 1 / cnt).normalize(), maxSpeed), this.velocity()), maxForce)
        }
        return v;
    }

    alignment() {
        let v = new Vec3(0, 0, 0);
        let cnt = 0;
        for (let flocker of this._flockManager.flockers) {
            if (flocker == this) continue;
            if (this.position().distance(flocker.position()) < 2) {
                v.x += flocker.velocity().x;
                v.z += flocker.velocity().z;
                cnt++;
            }
        }
        if (cnt == 0) {
            return v;
        } else {
            return v.normalize();
        }
    }

    seeking() {
        let v = new Vec3(0, 0, 0);
        // if (this.isLeader()) {
        //   v = limit(goal.sub(this.position()).normalize().mul(maxSpeed).sub(this.velocity()), maxForce)
        // } else {
        const target = this._flockManager.snitch
        // console.log('target position:', target.position)
        // TODO:
        // v = limit(target.position.get().clone()["-"](this.position()).normalize()["*"](maxSpeed)["-"](this.velocity()), maxForce)
        // }
        return v;
    }

    cohesion() {
        let v = new Vec3(0, 0, 0);
        let cnt = 0;
        for (let flocker of this._flockManager.flockers) {
            if (flocker == this) continue;
            if (this.position().distance(flocker.position()) < 3.84) {
                v.x += flocker.position().x;
                v.z += flocker.position().z;
                cnt++;
            }
        }
        if (cnt == 0) {
            return v;
        } else {
            return v;
            // TODO
            // return limit(v["*"](1 / cnt)["-"](this.position()).normalize()["*"](maxSpeed)["-"](this.velocity()), maxForce);
        }
    }
}

Component.register(Flocker, 'Flocker')
