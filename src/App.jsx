import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Post from './pages/Post';
import MyTasks from './pages/MyTasks';
import TaskDetail from './pages/TaskDetail';
import Dashboard from './pages/Dashboard';

function Toast({ message, type, duration, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), duration);
    const doneTimer = setTimeout(onDone, duration + 300);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onDone]);

  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <div className={`toast ${type} ${visible ? 'show' : ''}`}>
      <span className="toast-icon">{icons[type] || 'ℹ'}</span>
      {message}
    </div>
  );
}

function AppContent() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type, duration });
  }, []);

  return (
    <>
      <Navbar showToast={showToast} />
      <Routes>
          <Route path="/" element={<Home showToast={showToast} />} />
          <Route path="/login" element={<Login showToast={showToast} />} />
          <Route path="/post" element={<Post showToast={showToast} />} />
          <Route path="/mytasks" element={<MyTasks showToast={showToast} />} />
          <Route path="/task/:id" element={<TaskDetail showToast={showToast} />} />
          <Route path="/dashboard" element={<Dashboard showToast={showToast} />} />
      </Routes>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
