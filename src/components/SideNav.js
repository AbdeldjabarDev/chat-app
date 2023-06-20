import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getToken, globalDb } from "../scripts/utils";
import { setUserLastMessage, setUserState } from "../state/slices/userSlice";
import { getFromMessageQueue_Incoming, MessageTypes, setActiveChat,User,usersDb } from '../scripts/utils';
import warnImg from "../assets/warn.svg";
import store from "../state/store";
import ChatHead from "./ChatHead";
import Cookies from "js-cookie";
import { addUser } from "../state/slices/userSlice";
let sn_initiated = 0;
export default function SideNav(props)
{
  let [error,setError] = useState(null);
  // let user = new User(null);
  
  // let [users,SetUsers] = useState([]);
  let users = useSelector((state)=> state.users.users)
  useEffect(()=>
  {
   if(sn_initiated == 0)
   {
    usersDb.users.toArray().then(async(data)=>{
      if(data.length == 0){
        fetch("http://localhost:8080/users",{
          headers:{
            "ClientId":Cookies.get('capp_id'),
            "Authorization":"Basic " + Cookies.get('capp_token')
          }
        }).then((res)=>res.json())
        .then(async(data)=>{
          usersDb.users.clear();
          for (let i =0;i<data.length;i++){
            usersDb.users.add({...data[i]})
          }
          // SetUsers(data);
          console.log("users gathered");
          if(store.getState().users.users.length  == 0)
       {
        console.log('store empty.');
        
        for(let i = 0;i<data.length;i++)
        {
         let l = await globalDb.messages.where("senderId").equals(data[i].user_id).last();
        //  let arr = [];
        //  for(let i = 0 ;i<l.payload.length;i++){
        //   arr[i] = l.payload[i];
        //  }
         store.dispatch(addUser({last:l?.payload? l?.payload : '',...data[i]}))
        }
     
        
       }
       
       console.log('store full.');
       console.log(store.getState().users);
        })
      }
      else{
        if(store.getState().users.users.length == 0){
          for(let i = 0;i<data.length;i++)
          {
         let l = await globalDb.messages.where("senderId").equals(data[i].user_id).last();
        //  let arr = [];
        //  for(let i = 0 ;i<l.payload.length;i++){
        //   arr[i] = l.payload[i];
        //  }
           
           store.dispatch(addUser({last:l?.payload? l?.payload : '',...data[i]}));
           console.log("added user" )
           console.log( {last:l?.payload? l?.payload : '',...data[i]});
          }
         console.log('store full from db.');
         console.log(store.getState().users.users.length);
        }
       

      }
    });
    
     const UserConnectedHandler = function() {
      let msg = getFromMessageQueue_Incoming();
      let uid = msg.payload.toString('hex');
      console.log('user connected')
  
      if(props.id == uid)
      {
      store.dispatch(setUserState({id:uid,state:'c'}))
      }
      
  
    }
    const TextMessageReceivedHandler = function()
    {
        let msg = getFromMessageQueue_Incoming();
        let uid = msg.senderId.toString('hex');
        console.log('message received from chat head ,sender : ' + msg.senderId.toString('hex')+ 'and our id is : ' + props.id + msg.payload.toString('utf8'));
            switch(msg.type)
            {
                case MessageTypes.Text:
                  console.log('message received setting last ...');
                    store.dispatch(setUserLastMessage({id:uid,message: msg.payload.toString('utf8')}))
                    
                    break;
                case MessageTypes.Image:
                  store.dispatch(setUserLastMessage({id:uid,message:'Sent an Image'}))
                    
                    break;    
            }
         
        
    }
    const UserDisconnectedHandler = function(){
      console.log('user disconnected')
      let msg = getFromMessageQueue_Incoming();
   
      let uid = msg.payload.toString('hex');
      if(props.id == uid)
      {
         if(props.id == uid)
         {
         store.dispatch(setUserState({id:uid,state:'n'}))
         }
      }
    }
      window.addEventListener("user_connected",UserConnectedHandler);
  
        window.addEventListener("user_disconnected",UserDisconnectedHandler);
      window.addEventListener('text_message_received',TextMessageReceivedHandler);
      window.addEventListener('unload',()=>
      {
          window.removeEventListener('text_message_received',TextMessageReceivedHandler);
          window.removeEventListener('user_connected',UserConnectedHandler);
          window.removeEventListener('user_disconnected',UserDisconnectedHandler);
      })
      sn_initiated++;
   }
  })
 if(users.length == 0){
  if(error != null){
    return(<div>
      <div className="side-nav-loader w-full h-full border border-black text-xl ">
        <img src={warnImg} style={{marginLeft:"auto",marginRight:"auto",width:"60px",height:"60px"}}></img>
        <div style={{marginLeft:"auto",marginRight:"auto",color:"#ff5540"}}>Can&lsquot connect to backend right now.Please refresh the page</div>
      </div>
   </div>)
  }
  return(<div className="min-w-[30%] w-[30%] shadow-md shadow-slate-500 min-h-screen ">
    <div className="mx-auto mt-[50%] w-14 h-14 border-[5px]  border-white spin border-t-blue-600 rounded-full shadow-sm shadow-blue-300"></div>
  </div>)
  
 }

    return(<div className="flex flex-col h-full shadow-md w-[30%] overflow-x-hidden">
       {users.map((v,i)=>{
        return <ChatHead key={i} name={v.user_name} src={v.profile_photo} last={v.last} id={v.user_id} state={v.state}></ChatHead>
       })}
    </div>)
}