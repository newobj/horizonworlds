import { Component, Entity, PropsDefinition, PropTypes } from '@early_access_api/v1';
import { OnAppStartingEvent, ServiceComponent } from 'app';
import { Flocker } from 'flocker';

type Props = {
    snitch: Entity
}

export class FlockManager extends ServiceComponent<Props> {
    static propsDefinition: PropsDefinition<Props> = {
        snitch: { type: PropTypes.Entity },
    }

    private readonly _flockers: Flocker[] = []

    get snitch() { return this.props.snitch }
    get flockers() { return this._flockers }

    constructor() {
        super()
        console.log(`FlockManager:constructor OnAppStartingEvent uniqueName is (${OnAppStartingEvent.uniqueName})`)
    }

    override onStarting() {
        super.onStarting()
        console.log(`FlockManager:onStarting`)
    }

    override onStart() {
        console.log(`FlockManager:onStart`)
    }

    registerFlocker(flocker: Flocker) {
        console.log(`FlockManager: registering flocker ${flocker}`)
        this._flockers.push(flocker)
        console.log(`FlockManager: registered flocker ${flocker}`)
    }
}

Component.register(FlockManager, 'FlockManager')
