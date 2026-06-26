import { Routes, Route, Link } from 'react-router-dom'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import TabTimer from './components/TabTimer'

export default function App() {
  return (
    <div className="app">
      <TabTimer />
      <header className="app-header">
        <Link to="/" className="app-title">
          <span className="app-logo">⏱</span> Work Timer
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}
