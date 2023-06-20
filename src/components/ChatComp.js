// import { Socket,parse } from 'engine.io-client';
window.Buffer = window.Buffer || require("buffer").Buffer;
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


import {
  User,
  encryptAndSendMessage,
  Message,
  destructureMessage,
  getAuthKey,
  getEncKey,
  MessageTypes,
  structureMessage,
  addToMessageQueue_Incoming,
  getFromMessageQueue_Incoming,
  getActiveChat,
  globalDb,

} from "../scripts/utils";
import Cookies from "js-cookie";
import ChatMessageContainer from "./ChatMessageContainer";
import { TextField, colors } from "@mui/material";
import SendFileComp from "./SendFileComp";
import store from "../state/store";
import { useSelector } from "react-redux";
// import { escape } from "querystring";



let findComponent = (arr, id) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].props.id == id) return i;
  }
  return undefined;
};

let initiated = 0;
async function initiate(s) {
 
  window.addEventListener("chathead_clicked", () => {
    console.log("Chat head clicked" + getActiveChat().id);
   
  });
  
  window.addEventListener("message_read", () => {
    let msg = getFromMessageQueue_Incoming();
    console.log("message_read_listener : " + Cookies.get('capp_id') + " : " + getAuthKey() + " : " + getActiveChat().id);
    let back_msg = structureMessage(2,getAuthKey(),Cookies.get('capp_id'),getActiveChat().id,MessageTypes.MessageRead,new Uint8Array([1]).buffer,new Uint8Array(1))
    // TODO : find the container with message read id and update ui accordingly;
  });
  window.addEventListener("message_deleivered",() => {
    // TODO : find the container with message read id and update ui accordingly;
    let msg = getFromMessageQueue_Incoming();

  });

  
}

export default function ChatContainer(props) {
  
  // let [children, setChildren] = useState([]);
  // let [childrenmr, setChildrenmr] = useState([]);

  let user = useSelector((state)=> state.users.current);
  let miRef = useRef();
  let nav = useNavigate();
  let [err,setErr] = useState(null);
  // let infileRef = useRef();
  // let [user,setUser] = useState(null);
  useEffect(() => {
    // if(user)
    // globalDb.messages.where('senderId').equals(user.user_id).modify({state:'seen'});
    if (initiated == 0) {
      
      const textMessageReceivedHandler = async function(){
        let msg = getFromMessageQueue_Incoming();
        let str = msg.payload.toString('utf-8');
        
        console.log('text message received : ' + str);
        // childrenmr.push(
        //   {msg: msg.payload.toString('utf8'),d:'in',timestamp:msg.timestamp}       
        // );
       try
       {
        await globalDb.messages.add({
          senderId:msg.senderId.toString('hex'),
          direction : 'in',
          type: msg.type,
          timestamp: Number(msg.timestamp),
          state:'deleivered',
          payload: msg.payload.toString('utf8')
          })
       }
       catch(error)
       {
   console.log('failed to add message to db : ' + error.toString());
       }
        
        // setChildrenmr(childrenmr.slice());
        // console.log(...childrenmr);
        
      }
      
      initiate();
      
      // window.addEventListener('user_typing',function()
      // {
      //   childrenmr.push()
      // })
      // if(Cookies.get('capp_token'))
      // {
      //   initiateStuff();
      // }
      // else
      // nav('/login');
      const messageReadHandler =async function(e)
      {
        let unread = await globalDb.messages.where("senderId").equals(user.id);
        unread.filter((u)=> u.user_id == user.id).toArray();
        if(unread.length != 0){
          await globalDb.messages.where('senderId').equals(user.id).modify({state:'seen'});
          
        }
        // let msg = getFromMessageQueue_Incoming();

      }
      const fetchFailedHandler = function(e){
      let s = e.detail.success;
      if(s){
      // fetch successfull
      }
      else{
      // fetch failed !

      }
      }
      const messageDeleiveredHandler = async function(e)
      {
        try
        {
        let msg = getFromMessageQueue_Incoming();
        let m = {
          messageId : msg.id.toString(),
          senderId:msg.receiverId.toString('hex'),
          direction : 'out',
          type: msg.type,
          timestamp:Date.now(),
          state : 'deleivered',
          payload: msg.payload.toString('utf8')
          };
     
        globalDb.messages.add(m).catch((e)=>
           {
            console.log('error from inside add promise : ' + e.toString());
           })
        }
        catch(error)
        {
    console.log('failed to add message to db outgoing : ' + error.toString());
        }  
      }
      window.addEventListener('fetch_completed',fetchFailedHandler)
      window.addEventListener('message_deleivered',messageDeleiveredHandler)
      window.addEventListener('message_read',messageReadHandler)
      window.addEventListener("text_message_received",textMessageReceivedHandler)
     
      window.addEventListener('unload',()=>
      {
        window.removeEventListener('text_message_received',textMessageReceivedHandler);
        window.removeEventListener('message_read',messageReadHandler);
        
      })
      initiated++;
    }
    
    // updateui = function(){ 
  
    //   let msg = getFromMessageQueue_Incoming();
      
    //   console.log('text message received : ' +  msg.toString('utf8'));
      
    //   // let p;
    //   // let tmp = () => {p = children.slice();}
    //   // tmp();
    //   console.log('children length ' + c.length);
    //   c.push(
    //     <MessageContainer
    //       key={Math.random() * 100000}
    //       message={msg.toString('utf8')}
    //       d='in'
    //     ></MessageContainer>
    //   );
    //   setChildren(!children);} 
  });
 

  return (
    <div className="w-[70%] flex flex-col border overflow-hidden border-red-600 ml-[30%] h-screen top-0 left-0 absolute">
      {/* <div className="absolute w-screen h-screen blur z-20  top-0 border border-blue-600 left-0 ">
         <SendFileComp vis={fname}></SendFileComp>
         </div> */}
     
    {  
   user ?      
      <div style={{ backgroundColor: "white" }}>
        <div
        className="w-full pl-[40px] pt-[15px] flex gap-[20px] shadow-md shadow-white"
        >
          <img
            src={"http://localhost:8080/file/" + user.profile_photo}
            style={{ height: "60px", width: "60px", borderRadius: "50%" }}
          ></img>
          <span style={{transform:'translateY(25%)'}}>{user.user_name}</span>
        </div>
      </div>
  :
        <div>
        Select a User to start Chatting 
        </div>
      
  
  
}
  {
    user ? 
    <ChatMessageContainer  user={user}/> : ''
  }  
      
    </div>
  );
}
