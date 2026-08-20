import './App.css'
import { HunterService } from './application/hunters/hunterService'
import { LocalStorageHunterRepository } from './infrastructure/hunters/localStorageHunterRepository'
import { HunterWorkspace } from './ui/hunters/HunterWorkspace'

const hunterService = new HunterService(
  new LocalStorageHunterRepository(),
)

function App() {
  return <HunterWorkspace service={hunterService} />
}

export default App
