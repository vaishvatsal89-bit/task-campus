import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Post from './pages/Post.jsx'
import MyTasks from './pages/MyTasks.jsx'

function App() {

return (

<BrowserRouter>

<Routes>

<Route path="/" element={<Home />} />

<Route path="/login" element={<Login />} />

<Route path="/post" element={<Post />} />

<Route path="/mytasks" element={<MyTasks />} />

</Routes>

</BrowserRouter>

)

}

export default App