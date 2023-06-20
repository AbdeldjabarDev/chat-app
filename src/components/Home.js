import React from 'react'
import ChatContainer from './ChatComp';
import SideNav from './SideNav';
import { initiateStuff } from '../scripts/utils';
let i = 0;
export default function Home()
{
  if( i == 0){
    initiateStuff();
    i++;
  }
  return(   <div className="border border-green-600 overflow-hidden h-screen w-screen  flex flex-col">
  <SideNav></SideNav>
  <ChatContainer ></ChatContainer>
  </div>)
}