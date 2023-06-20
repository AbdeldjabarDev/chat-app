import React from 'react'
import './styles/App.css';
import {BrowserRouter,Route,Routes} from 'react-router-dom'
import Cont from './components/Cont';
import Home from './components/Home';
import Login from './components/Login';
function App() { 
  return (
  <BrowserRouter>
      <Routes>
      <Route path='/' element={<Cont></Cont>}>
      <Route path='/chat' element={<Home></Home>}></Route>
      <Route path='login' element={<Login></Login>}></Route>  
      </Route>
      </Routes>
  </BrowserRouter>

 
  );
}
export default App;
