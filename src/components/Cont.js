import React from 'react'
import { Outlet } from "react-router-dom";
export default function Cont()
{
    return(<div style={{width:"100%",height:"100vh"}}>
    <Outlet />
    </div>)
}