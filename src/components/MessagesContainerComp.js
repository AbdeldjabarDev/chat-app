import { useState } from "react"
import MessageContainer from "./MessageContainer";
export default function MessagesContainerComp(props){
    let message_conts = props.messages;

    return <div style={{display:'flex',overflow:'auto',flexDirection:'column',width:'100%',height:'100%',border:'none'}}>
    {
        Array.from( message_conts)
       .map((v)=>
        {
            return <MessageContainer 
                            message={v.payload}
                            d={v.direction}
                            key = {Math.random()*100000000}
                            time={ Number(v.timestamp.toString().substr(0,v.timestamp.toString().length))}
                            state={v.state}
                            type = {v.type}
                            >
                            </MessageContainer>
        })
    }       
    </div>
}