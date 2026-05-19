import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'

const Home = () => {
  return (
    <div className="min-h-screen p-6">
      <div className="space-y-6">
        <Navbar />
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Sidebar />
          <div className="min-h-[70vh] rounded-3xl bg-white/70 p-6 shadow-sm">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
