import { BuiltInVariableType, CodeBlockEvent, Component, HorizonEvent, PropsDefinition, PropTypes, Vec3 } from "@early_access_api/v1"
import { ctor } from "utils";
import { app, setAppInstance } from "iapp";

// Nothing should try to talk to anything else w/ this event
export const OnAppStartingEvent = new HorizonEvent<{}>('OnAppStartingEvent');

// It's safe to use other components, services, the app, etc
export const OnAppStartEvent = new HorizonEvent<{}>('OnAppStartEvent');

// High frequency update
export const OnAppUpdateEvent = new HorizonEvent<{ dt: number }>('OnAppUpdateEvent');

// Low frequency fixed update (@30hz)
export const OnAppFixedUpdateEvent = new HorizonEvent<{ dt: number }>('OnAppFixedUpdateEvent');


export abstract class AppComponent<T extends { [key: string]: BuiltInVariableType }> extends Component<T> {
    override start() {
        const self = this
        console.log(`AppComponent.start for ${this.constructor.name}`)
        if (this.onStarting) {
            console.log(`Registering onStarting for ${this.constructor.name} (${OnAppStartingEvent.uniqueName})`)
            this.connectBroadcastEvent(OnAppStartingEvent, () => { self.onStarting!() } )
        }
        if (this.onStart) {
            console.log(`Registering onStart for ${this.constructor.name}`)
            this.connectBroadcastEvent(OnAppStartEvent, () => { self.onStart!() } )
        }
        if (this.onUpdate) {
            console.log(`Registering onUpdate for ${this.constructor.name}`)
            this.connectBroadcastEvent(OnAppUpdateEvent, (e) => { self.onUpdate!(e.dt) })
        }
        if (this.onFixedUpdate) {
            console.log(`Registering onFixedUpdate for ${this.constructor.name}`)
            this.connectBroadcastEvent(OnAppFixedUpdateEvent, (e) => { self.onFixedUpdate!(e.dt) })
        }
    }

    onStarting?(): void
    onStart?(): void
    onFixedUpdate?(dt: number): void
    onUpdate?(dt: number): void
}

export abstract class ServiceComponent<T extends { [key: string]: BuiltInVariableType }> extends AppComponent<T> {
    override onStarting() {
        app().registerService(this)
    }
}

class App extends Component<{}> {
    static instance: App

    static propsDefinition: PropsDefinition<{}> = {
        // num: {type: PropTypes.Number, default: 42},
    }

    // define instance state
    private _services = new Set<any>()

    constructor() {
        super()
        console.log(`App:constructor OnAppStartingEvent uniqueName is (${OnAppStartingEvent.uniqueName})`)
        setAppInstance(this)
        console.log(`Set App.instance to ${this}`)
    }

    override start() {
        const CodeBlocksStartingEvent = new CodeBlockEvent<[]>("AppStarting", [])
        this.connectCodeBlockEvent<[]>(this.entity, CodeBlocksStartingEvent, () => {
            // Starting
            console.log(`App: sending OnAppStarting with (${OnAppStartingEvent.uniqueName})`)
            this.sendBroadcastEvent(OnAppStartingEvent, {})

            // Start
            console.log('App: sending OnAppStart')
            this.sendBroadcastEvent(OnAppStartEvent, {})

            // Updates
            console.log('App: entering OnUpdate loop')
            const CodeBlocksUpdateEvent = new CodeBlockEvent<[]>("AppUpdate", [])
            let lastTime: number = -1
            this.connectCodeBlockEvent<[]>(this.entity, CodeBlocksUpdateEvent, () => {
                const time = new Date().getTime()
                const dt = (lastTime!=-1) ? (time - lastTime!) : 10
                this.sendBroadcastEvent(OnAppUpdateEvent, { dt: dt })
                this.sendBroadcastEvent(OnAppFixedUpdateEvent, { dt: dt })
                this.sendCodeBlockEvent(this.entity, CodeBlocksUpdateEvent)
                lastTime = time
            })
            this.sendCodeBlockEvent(this.entity, CodeBlocksUpdateEvent)
        })
        this.sendCodeBlockEvent(this.entity, CodeBlocksStartingEvent)
    }

    registerService(service: any) {
        console.log(`App: Registering ${service.constructor.name} service`)
        this._services.add(service)
    }

    getService<T>(c: ctor<T>): T {
        let result = null
        console.log(`App: getService("${c.name}")`)
        this._services.forEach((svc) => {
            console.log(`App: getService visiting "${svc.constructor.name}"`)
            // TODO: use instanceof, once it works...
            if (svc.constructor.name == c.name) {
                result = svc
            }
        })
        if (result) { 
            return result
        } else {
            throw new Error(`Could not find service binding for ${c.name}`)
        }
    }
}

Component.register(App, 'App')

