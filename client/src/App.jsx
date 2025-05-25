import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from "./components/common/Header";
import Dashboard from "./pages/Dashboard";
import History from './pages/History';
import DeviceList from './pages/DeviceList';
import { DeviceProvider } from './contexts/deviceContext';
import Footer from './components/common/Footer';

const App = () => {
  return (
    <DeviceProvider>
      <Router>
          <div className='app'>
              <Header/>
              <main>
                  <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/history" element={<History />} />
                      <Route path="/devices" element={<DeviceList />} />
                  </Routes>
              </main>
              <Footer/>
          </div>
      </Router>
    </DeviceProvider>   
  )  
}
export default App;