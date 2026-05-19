import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Home from './pages/Home.jsx'
import Chat from './pages/Chat.jsx'
import Stories from './pages/Stories.jsx'
import Friends from './pages/Friends.jsx'
import Groups from './pages/Groups.jsx'
import BroadcastLists from './pages/BroadcastLists.jsx'
import Notifications from './pages/Notifications.jsx'
import Profile from './pages/Profile.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      >
        <Route index element={<Chat />} />
        <Route path="chats" element={<Chat />} />
        <Route path="stories" element={<Stories />} />
        <Route path="friends" element={<Friends />} />
        <Route path="groups" element={<Groups />} />
        <Route path="broadcasts" element={<BroadcastLists />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
