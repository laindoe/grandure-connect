import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import BrandWorkspace from './pages/BrandWorkspace'
import CurrentPhase from './pages/CurrentPhase'
import Overview from './pages/Overview'
import PlatformStrategy from './pages/PlatformStrategy'
import Season from './pages/Season'
import IdeaVault from './pages/IdeaVault'
import Inspiration from './pages/Inspiration'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/brand/:id" element={<BrandWorkspace />} />
      <Route path="/brand/:id/phase" element={<CurrentPhase />} />
      <Route path="/brand/:id/overview" element={<Overview />} />
      <Route path="/brand/:id/platforms" element={<PlatformStrategy />} />
      <Route path="/brand/:id/season" element={<Season />} />
      <Route path="/brand/:id/ideas" element={<IdeaVault />} />
      <Route path="/brand/:id/inspiration" element={<Inspiration />} />
    </Routes>
  )
}
