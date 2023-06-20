import { useEffect, useState } from 'react'
import '../styles/App.css'
import { getFromMessageQueue_Incoming, globalDb, MessageTypes, setActiveChat,User } from '../scripts/utils';
import { setCurrentUser, setMessages } from '../state/slices/userSlice';
import store from '../state/store';
let ch_initiated = 0;
export default function ChatHead(props)
{
    
    let [bgColor,setBgColor] = useState('black');
    useEffect(()=>{
    console.log(props.name + " : " + props.src);
   
    })
    
    return(
        <div className='chat-head' onClick={async(e)=>
        {
        //  setActiveChat(props); // get a chat id;
         store.dispatch(setCurrentUser(store.getState().users.users.find((u) => u.user_id == props.id)))
         window.dispatchEvent(new Event('chathead_clicked'));
         let user =new User(store.getState().users.users.find((u) => u.user_id == props.id));
         let col = await globalDb.messages.where('state').equals('sent');
         
         let unread =col.toArray();
         let msgs = await globalDb.messages.where("senderId").equals(props.id).toArray();
         for(let i = 0 ;i< unread.length;i++){
            user.NotifyMessageRead(unread[i].id);
         }
         await col.modify((v)=>{v.state = 'seen'})
         msgs.forEach((v)=>{
            let arr = [];
            for(let i = 0;i<v.payload.length;i++){
                arr[i] = v.payload.at(i);
            }
            v.payload = arr;
         })
         store.dispatch(setMessages(msgs));
        //  window.dispatchEvent(new Event('message_read'));
         setBgColor('grey')    
        

        }}>
            <img className='chat-profile'  src={ "http://localhost:8080/file/" + props.src}></img>
            <div className='ch-cont'>
                <div className='prof-name'>{props.name}</div>
                <div className='mt-3' style={{color:bgColor}}>{props.last}</div>
            </div>
            <div style={{marginLeft:"auto",marginRight:"10px",width:"10px",height:"10px",backgroundColor:props.state == "c" ? 'green':'grey',borderRadius:"50%",marginTop:"4%"}}></div>
        </div>
    )
}