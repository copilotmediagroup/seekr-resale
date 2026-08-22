import './App.css'
import { HunterService } from './application/hunters/hunterService'
import { createHunterRuntime } from './application/composition/createHunterRuntime'
import { LocalStorageHunterRepository } from './infrastructure/hunters/localStorageHunterRepository'
import { HunterWorkspace } from './ui/hunters/HunterWorkspace'

const hunterService = new HunterService(
  new LocalStorageHunterRepository(),
)

const hunterRuntime = createHunterRuntime()

function App() {
  return (
    <HunterWorkspace
      acquisition={hunterRuntime.acquisition}
      intelligence={hunterRuntime.intelligence}
      service={hunterService}
    />
  )
}

export default App
